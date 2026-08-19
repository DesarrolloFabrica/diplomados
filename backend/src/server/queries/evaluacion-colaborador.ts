import { and, asc, eq, isNull } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { preguntas, opcionesRespuesta, intentosEvaluacion, evaluaciones } from "@/lib/db/schema";

export interface OpcionPresentacion {
  id: string;
  texto: string;
}

export interface PreguntaPresentacion {
  id: string;
  enunciado: string;
  opciones: OpcionPresentacion[];
}

// A propósito NO trae es_correcta ni retroalimentacion: eso solo se
// calcula del lado del servidor al calificar (ver server/actions/
// evaluacion-colaborador.ts). RLS permite leer esas columnas a nivel de
// fila, pero la app nunca las selecciona para este caso de uso.
export async function obtenerPreguntasParaPresentar(
  usuarioId: string,
  evaluacionId: string,
): Promise<PreguntaPresentacion[]> {
  return conSesion(usuarioId, async (tx) => {
    const filasPreguntas = await tx
      .select({ id: preguntas.id, enunciado: preguntas.enunciado })
      .from(preguntas)
      .where(and(eq(preguntas.evaluacionId, evaluacionId), isNull(preguntas.deletedAt)))
      .orderBy(asc(preguntas.orden), asc(preguntas.createdAt));

    const resultado: PreguntaPresentacion[] = [];
    for (const pregunta of filasPreguntas) {
      const opciones = await tx
        .select({ id: opcionesRespuesta.id, texto: opcionesRespuesta.texto })
        .from(opcionesRespuesta)
        .where(eq(opcionesRespuesta.preguntaId, pregunta.id))
        .orderBy(asc(opcionesRespuesta.orden));
      resultado.push({ id: pregunta.id, enunciado: pregunta.enunciado, opciones });
    }
    return resultado;
  });
}

export interface ConfigEvaluacion {
  preguntasAleatorias: boolean;
  numPreguntasMostrar: number | null;
}

export async function obtenerConfigEvaluacion(
  usuarioId: string,
  evaluacionId: string,
): Promise<ConfigEvaluacion | null> {
  return conSesion(usuarioId, async (tx) => {
    const [fila] = await tx
      .select({
        preguntasAleatorias: evaluaciones.preguntasAleatorias,
        numPreguntasMostrar: evaluaciones.numPreguntasMostrar,
      })
      .from(evaluaciones)
      .where(eq(evaluaciones.id, evaluacionId))
      .limit(1);
    return fila ?? null;
  });
}

export interface IntentoResumen {
  id: string;
  estado: "en_curso" | "finalizado" | "expirado";
  puntaje: string | null;
  aprobado: boolean | null;
}

export async function listarIntentos(
  usuarioId: string,
  evaluacionId: string,
): Promise<IntentoResumen[]> {
  return conSesion(usuarioId, (tx) =>
    tx
      .select({
        id: intentosEvaluacion.id,
        estado: intentosEvaluacion.estado,
        puntaje: intentosEvaluacion.puntaje,
        aprobado: intentosEvaluacion.aprobado,
      })
      .from(intentosEvaluacion)
      .where(
        and(
          eq(intentosEvaluacion.evaluacionId, evaluacionId),
          eq(intentosEvaluacion.profileId, usuarioId),
        ),
      )
      .orderBy(asc(intentosEvaluacion.numeroIntento)),
  );
}
