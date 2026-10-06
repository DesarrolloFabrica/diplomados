import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { cursos, evaluaciones, preguntas, opcionesRespuesta } from "@/lib/db/schema";

export interface EvaluacionFila {
  id: string;
  titulo: string;
  descripcion: string | null;
  tiempoLimiteMin: number | null;
  maxIntentos: number;
  puntajeMinimo: string;
  preguntasAleatorias: boolean;
  numPreguntasMostrar: number | null;
  mostrarResultados: "inmediato" | "al_cerrar" | "nunca";
}

export async function listarEvaluaciones(
  usuarioId: string,
  cursoId: string,
): Promise<EvaluacionFila[]> {
  return conSesion(usuarioId, (tx) =>
    tx
      .select({
        id: evaluaciones.id,
        titulo: evaluaciones.titulo,
        descripcion: evaluaciones.descripcion,
        tiempoLimiteMin: evaluaciones.tiempoLimiteMin,
        maxIntentos: evaluaciones.maxIntentos,
        puntajeMinimo: evaluaciones.puntajeMinimo,
        preguntasAleatorias: evaluaciones.preguntasAleatorias,
        numPreguntasMostrar: evaluaciones.numPreguntasMostrar,
        mostrarResultados: evaluaciones.mostrarResultados,
      })
      .from(evaluaciones)
      .where(and(eq(evaluaciones.cursoId, cursoId), isNull(evaluaciones.deletedAt)))
      .orderBy(asc(evaluaciones.createdAt)),
  );
}

export async function obtenerEvaluacion(usuarioId: string, evaluacionId: string) {
  return conSesion(usuarioId, async (tx) => {
    const [fila] = await tx
      .select()
      .from(evaluaciones)
      .where(and(eq(evaluaciones.id, evaluacionId), isNull(evaluaciones.deletedAt)))
      .limit(1);
    return fila ?? null;
  });
}

export interface OpcionFila {
  id: string;
  texto: string;
  esCorrecta: boolean;
  retroalimentacion: string | null;
}

export interface PreguntaConOpciones {
  id: string;
  tipo: string;
  enunciado: string;
  puntaje: string;
  orden: number;
  opciones: OpcionFila[];
}

// Trae preguntas + opciones con una query por pregunta: aceptable para el
// volumen típico de un quiz (10-20 preguntas); no vale la pena el join
// agregado para este caso de uso.
export async function listarPreguntas(
  usuarioId: string,
  evaluacionId: string,
): Promise<PreguntaConOpciones[]> {
  return conSesion(usuarioId, async (tx) => {
    const filasPreguntas = await tx
      .select()
      .from(preguntas)
      .where(and(eq(preguntas.evaluacionId, evaluacionId), isNull(preguntas.deletedAt)))
      .orderBy(asc(preguntas.orden), asc(preguntas.createdAt));

    const resultado: PreguntaConOpciones[] = [];
    for (const pregunta of filasPreguntas) {
      const opciones = await tx
        .select({
          id: opcionesRespuesta.id,
          texto: opcionesRespuesta.texto,
          esCorrecta: opcionesRespuesta.esCorrecta,
          retroalimentacion: opcionesRespuesta.retroalimentacion,
        })
        .from(opcionesRespuesta)
        .where(eq(opcionesRespuesta.preguntaId, pregunta.id))
        .orderBy(asc(opcionesRespuesta.orden));

      resultado.push({
        id: pregunta.id,
        tipo: pregunta.tipo,
        enunciado: pregunta.enunciado,
        puntaje: pregunta.puntaje,
        orden: pregunta.orden,
        opciones,
      });
    }
    return resultado;
  });
}

export interface EvaluacionResumen {
  id: string;
  titulo: string;
  cursoId: string;
  cursoTitulo: string;
  maxIntentos: number;
  puntajeMinimo: string;
  tiempoLimiteMin: number | null;
  numPreguntas: number;
}

/** Evaluaciones de un conjunto de cursos (p.ej. los visibles para el instructor). */
export async function listarEvaluacionesDeCursos(
  usuarioId: string,
  cursoIds: string[],
): Promise<EvaluacionResumen[]> {
  if (!cursoIds.length) return [];
  return conSesion(usuarioId, (tx) =>
    tx
      .select({
        id: evaluaciones.id,
        titulo: evaluaciones.titulo,
        cursoId: evaluaciones.cursoId,
        cursoTitulo: cursos.titulo,
        maxIntentos: evaluaciones.maxIntentos,
        puntajeMinimo: evaluaciones.puntajeMinimo,
        tiempoLimiteMin: evaluaciones.tiempoLimiteMin,
        numPreguntas: sql<number>`(
          select count(*)::int from ${preguntas}
          where ${preguntas.evaluacionId} = ${evaluaciones.id} and ${preguntas.deletedAt} is null
        )`,
      })
      .from(evaluaciones)
      .innerJoin(cursos, eq(cursos.id, evaluaciones.cursoId))
      .where(and(inArray(evaluaciones.cursoId, cursoIds), isNull(evaluaciones.deletedAt)))
      .orderBy(asc(cursos.titulo), asc(evaluaciones.createdAt)),
  );
}
