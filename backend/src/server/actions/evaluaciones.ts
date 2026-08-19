"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { evaluaciones, preguntas, opcionesRespuesta } from "@/lib/db/schema";
import { requerirRol } from "@/lib/auth/sesion";
import { evaluacionSchema, importarGiftSchema } from "@/lib/validators/evaluaciones";
import { parsearGift } from "@/lib/gift/parse";
import type { ResultadoAccion } from "@/types";

export interface ResultadoCrearEvaluacion extends ResultadoAccion {
  evaluacionId?: string;
}

export async function crearEvaluacion(
  cursoId: string,
  _prev: ResultadoCrearEvaluacion | null,
  formData: FormData,
): Promise<ResultadoCrearEvaluacion> {
  const sesion = await requerirRol("superadmin", "instructor");

  const parsed = evaluacionSchema.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    tiempoLimiteMin: formData.get("tiempoLimiteMin"),
    maxIntentos: formData.get("maxIntentos"),
    puntajeMinimo: formData.get("puntajeMinimo"),
    preguntasAleatorias: formData.get("preguntasAleatorias"),
    numPreguntasMostrar: formData.get("numPreguntasMostrar"),
    mostrarResultados: formData.get("mostrarResultados"),
  });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const filas = await conSesion(sesion.id, (tx) =>
    tx
      .insert(evaluaciones)
      .values({
        cursoId,
        titulo: parsed.data.titulo,
        descripcion: parsed.data.descripcion ?? null,
        tiempoLimiteMin: parsed.data.tiempoLimiteMin ?? null,
        maxIntentos: parsed.data.maxIntentos,
        puntajeMinimo: String(parsed.data.puntajeMinimo),
        preguntasAleatorias: parsed.data.preguntasAleatorias,
        numPreguntasMostrar: parsed.data.numPreguntasMostrar ?? null,
        mostrarResultados: parsed.data.mostrarResultados,
      })
      .returning({ id: evaluaciones.id }),
  );

  const fila = filas[0];
  if (!fila) {
    return { ok: false, mensaje: "No tienes permiso para editar este curso." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}`);
  return { ok: true, evaluacionId: fila.id };
}

export async function eliminarEvaluacion(
  cursoId: string,
  evaluacionId: string,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin", "instructor");

  const filas = await conSesion(sesion.id, (tx) =>
    tx
      .update(evaluaciones)
      .set({ deletedAt: new Date() })
      .where(eq(evaluaciones.id, evaluacionId))
      .returning({ id: evaluaciones.id }),
  );

  if (!filas.length) {
    return { ok: false, mensaje: "No tienes permiso para eliminar esta evaluación." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}`);
  return { ok: true };
}

export interface ResultadoImportarGift extends ResultadoAccion {
  preguntasImportadas?: number;
}

export async function importarPreguntasGift(
  cursoId: string,
  evaluacionId: string,
  _prev: ResultadoImportarGift | null,
  formData: FormData,
): Promise<ResultadoImportarGift> {
  const sesion = await requerirRol("superadmin", "instructor");

  const parsed = importarGiftSchema.safeParse({ texto: formData.get("texto") });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const preguntasImportadas = parsearGift(parsed.data.texto);
  if (preguntasImportadas.length === 0) {
    return {
      ok: false,
      mensaje: "No se reconoció ninguna pregunta en formato GIFT en ese texto.",
    };
  }

  const insertadas = await conSesion(sesion.id, async (tx) => {
    const existentes = await tx
      .select({ id: preguntas.id })
      .from(preguntas)
      .where(and(eq(preguntas.evaluacionId, evaluacionId), isNull(preguntas.deletedAt)));

    let siguienteOrden = existentes.length;
    let contador = 0;

    for (const importada of preguntasImportadas) {
      const [filaPregunta] = await tx
        .insert(preguntas)
        .values({
          evaluacionId,
          tipo: "seleccion_unica",
          enunciado: importada.enunciado,
          orden: siguienteOrden,
        })
        .returning({ id: preguntas.id });

      // Sin permiso (RLS bloqueó la primera inserción): no tiene sentido
      // seguir intentando las demás.
      if (!filaPregunta) break;

      for (const [indice, opcion] of importada.opciones.entries()) {
        await tx.insert(opcionesRespuesta).values({
          preguntaId: filaPregunta.id,
          texto: opcion.texto,
          esCorrecta: opcion.esCorrecta,
          retroalimentacion: opcion.retroalimentacion ?? null,
          orden: indice,
        });
      }

      siguienteOrden += 1;
      contador += 1;
    }

    return contador;
  });

  if (insertadas === 0) {
    return { ok: false, mensaje: "No tienes permiso para editar esta evaluación." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}/evaluaciones/${evaluacionId}`);
  return { ok: true, preguntasImportadas: insertadas };
}

export async function eliminarPregunta(
  cursoId: string,
  evaluacionId: string,
  preguntaId: string,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin", "instructor");

  const filas = await conSesion(sesion.id, (tx) =>
    tx
      .update(preguntas)
      .set({ deletedAt: new Date() })
      .where(eq(preguntas.id, preguntaId))
      .returning({ id: preguntas.id }),
  );

  if (!filas.length) {
    return { ok: false, mensaje: "No tienes permiso para eliminar esta pregunta." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}/evaluaciones/${evaluacionId}`);
  return { ok: true };
}
