"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import {
  evaluaciones,
  preguntas,
  opcionesRespuesta,
  intentosEvaluacion,
  respuestasParticipante,
} from "@/lib/db/schema";
import { requerirSesion } from "@/lib/auth/sesion";
import {
  obtenerPreguntasParaPresentar,
  obtenerConfigEvaluacion,
  type PreguntaPresentacion,
} from "@/server/queries/evaluacion-colaborador";
import { barajarConSemilla } from "@/lib/aleatorio";
import type { ResultadoAccion } from "@/types";

export interface ResultadoIniciarIntento extends ResultadoAccion {
  intentoId?: string;
}

export async function iniciarIntento(
  evaluacionId: string,
  inscripcionId: string,
): Promise<ResultadoIniciarIntento> {
  const sesion = await requerirSesion();
  if (!sesion.empresaId) {
    return { ok: false, mensaje: "Tu cuenta no pertenece a ninguna empresa." };
  }

  const resultado = await conSesion(sesion.id, async (tx) => {
    const [evaluacion] = await tx
      .select({ maxIntentos: evaluaciones.maxIntentos })
      .from(evaluaciones)
      .where(eq(evaluaciones.id, evaluacionId))
      .limit(1);
    if (!evaluacion) return "NO_ENCONTRADA" as const;

    const existentes = await tx
      .select({ id: intentosEvaluacion.id, estado: intentosEvaluacion.estado })
      .from(intentosEvaluacion)
      .where(
        and(
          eq(intentosEvaluacion.evaluacionId, evaluacionId),
          eq(intentosEvaluacion.profileId, sesion.id),
        ),
      );

    const enCurso = existentes.find((i) => i.estado === "en_curso");
    if (enCurso) return { id: enCurso.id };

    const finalizados = existentes.filter((i) => i.estado !== "en_curso").length;
    if (finalizados >= evaluacion.maxIntentos) return "MAX_INTENTOS" as const;

    const id = randomUUID();
    await tx.insert(intentosEvaluacion).values({
      id,
      evaluacionId,
      inscripcionId,
      profileId: sesion.id,
      empresaId: sesion.empresaId!,
      numeroIntento: finalizados + 1,
    });
    return { id };
  });

  if (resultado === "MAX_INTENTOS") {
    return { ok: false, mensaje: "Ya usaste todos tus intentos permitidos." };
  }
  if (resultado === "NO_ENCONTRADA") {
    return { ok: false, mensaje: "No se encontró la evaluación." };
  }

  return { ok: true, intentoId: resultado.id };
}

export interface ResultadoPreguntasIntento extends ResultadoAccion {
  preguntas?: PreguntaPresentacion[];
}

// Se llama recién cuando existe un intento (nuevo o retomado), nunca antes:
// así la semilla de aleatorización es el propio id del intento — estable
// mientras dure (recargar la página no cambia las preguntas) pero distinta
// entre intentos, que es justo lo que implica "preguntas aleatorias".
export async function obtenerPreguntasDeIntento(
  intentoId: string,
): Promise<ResultadoPreguntasIntento> {
  const sesion = await requerirSesion();

  const intento = await conSesion(sesion.id, async (tx) => {
    const [fila] = await tx
      .select({ evaluacionId: intentosEvaluacion.evaluacionId, profileId: intentosEvaluacion.profileId })
      .from(intentosEvaluacion)
      .where(eq(intentosEvaluacion.id, intentoId))
      .limit(1);
    return fila ?? null;
  });

  if (!intento || intento.profileId !== sesion.id) {
    return { ok: false, mensaje: "No se encontró el intento." };
  }

  const [config, todasLasPreguntas] = await Promise.all([
    obtenerConfigEvaluacion(sesion.id, intento.evaluacionId),
    obtenerPreguntasParaPresentar(sesion.id, intento.evaluacionId),
  ]);

  let seleccionadas = todasLasPreguntas;

  if (config?.numPreguntasMostrar && config.numPreguntasMostrar < seleccionadas.length) {
    const ordenOriginal = new Map(seleccionadas.map((p, indice) => [p.id, indice]));
    seleccionadas = barajarConSemilla(seleccionadas, `${intentoId}-seleccion`)
      .slice(0, config.numPreguntasMostrar)
      .sort((a, b) => (ordenOriginal.get(a.id) ?? 0) - (ordenOriginal.get(b.id) ?? 0));
  }

  if (config?.preguntasAleatorias) {
    seleccionadas = barajarConSemilla(seleccionadas, `${intentoId}-orden`);
  }

  return { ok: true, preguntas: seleccionadas };
}

export interface ResultadoEnviarIntento extends ResultadoAccion {
  puntaje?: number;
  aprobado?: boolean;
}

export async function enviarIntento(
  cursoId: string,
  evaluacionId: string,
  intentoId: string,
  respuestas: { preguntaId: string; opcionId: string }[],
): Promise<ResultadoEnviarIntento> {
  const sesion = await requerirSesion();

  const resultado = await conSesion(sesion.id, async (tx) => {
    const [evaluacion] = await tx
      .select({ puntajeMinimo: evaluaciones.puntajeMinimo })
      .from(evaluaciones)
      .where(eq(evaluaciones.id, evaluacionId))
      .limit(1);
    if (!evaluacion) return null;

    // Solo las preguntas que en efecto se le mostraron a este intento (el
    // conjunto puede ser un subconjunto si la evaluación usa "mostrar solo
    // N preguntas"): el total posible debe salir de esas, no de todas las
    // de la evaluación, o nunca se podría llegar al 100%.
    const preguntaIds = respuestas.map((r) => r.preguntaId);
    const preguntasEval =
      preguntaIds.length === 0
        ? []
        : await tx
            .select({ id: preguntas.id, puntaje: preguntas.puntaje })
            .from(preguntas)
            .where(
              and(
                eq(preguntas.evaluacionId, evaluacionId),
                isNull(preguntas.deletedAt),
                inArray(preguntas.id, preguntaIds),
              ),
            );

    const totalPosible = preguntasEval.reduce((acc, p) => acc + Number(p.puntaje), 0);
    let obtenido = 0;

    for (const respuesta of respuestas) {
      const pregunta = preguntasEval.find((p) => p.id === respuesta.preguntaId);
      if (!pregunta) continue;

      const [opcion] = await tx
        .select({ esCorrecta: opcionesRespuesta.esCorrecta })
        .from(opcionesRespuesta)
        .where(
          and(
            eq(opcionesRespuesta.id, respuesta.opcionId),
            eq(opcionesRespuesta.preguntaId, respuesta.preguntaId),
          ),
        )
        .limit(1);

      const esCorrecta = opcion?.esCorrecta ?? false;
      const puntajeObtenido = esCorrecta ? Number(pregunta.puntaje) : 0;
      obtenido += puntajeObtenido;

      await tx.insert(respuestasParticipante).values({
        intentoId,
        preguntaId: respuesta.preguntaId,
        opcionId: respuesta.opcionId,
        esCorrecta,
        puntajeObtenido: String(puntajeObtenido),
      });
    }

    const puntajePorcentaje = totalPosible > 0 ? (obtenido / totalPosible) * 100 : 0;
    const aprobado = puntajePorcentaje >= Number(evaluacion.puntajeMinimo);

    await tx
      .update(intentosEvaluacion)
      .set({
        finalizadoEn: new Date(),
        puntaje: String(Math.round(puntajePorcentaje * 100) / 100),
        aprobado,
        estado: "finalizado",
      })
      .where(eq(intentosEvaluacion.id, intentoId));

    return { puntaje: puntajePorcentaje, aprobado };
  });

  if (!resultado) {
    return { ok: false, mensaje: "No se encontró la evaluación." };
  }

  revalidatePath(`/mis-cursos/${cursoId}/evaluaciones/${evaluacionId}`);
  revalidatePath(`/mis-cursos/${cursoId}`);
  return { ok: true, puntaje: resultado.puntaje, aprobado: resultado.aprobado };
}
