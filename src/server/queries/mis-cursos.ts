import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import {
  cursos,
  inscripciones,
  unidades,
  lecciones,
  progresoLecciones,
  evaluaciones,
  intentosEvaluacion,
} from "@/lib/db/schema";

export interface CursoCatalogoFila {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagenPortadaUrl: string | null;
  esDiplomado: boolean;
  nivelDificultad: "basico" | "intermedio" | "avanzado";
  inscripcionId: string | null;
  estadoInscripcion:
    | "no_iniciado"
    | "en_progreso"
    | "pendiente_evaluacion"
    | "aprobado"
    | "no_aprobado"
    | "finalizado"
    | null;
  porcentajeAvance: string | null;
}

// RLS ya limita `cursos` a publicados (globales o de la empresa del
// usuario); el LEFT JOIN agrega el estado de inscripción de este usuario
// si ya se matriculó, sin filtrar los que todavía no.
export async function listarCursosParaColaborador(
  usuarioId: string,
): Promise<CursoCatalogoFila[]> {
  return conSesion(usuarioId, (tx) =>
    tx
      .select({
        id: cursos.id,
        titulo: cursos.titulo,
        descripcion: cursos.descripcion,
        imagenPortadaUrl: cursos.imagenPortadaUrl,
        esDiplomado: cursos.esDiplomado,
        nivelDificultad: cursos.nivelDificultad,
        inscripcionId: inscripciones.id,
        estadoInscripcion: inscripciones.estado,
        porcentajeAvance: inscripciones.porcentajeAvance,
      })
      .from(cursos)
      .leftJoin(
        inscripciones,
        and(eq(inscripciones.cursoId, cursos.id), eq(inscripciones.profileId, usuarioId)),
      )
      .where(and(eq(cursos.estado, "publicado"), isNull(cursos.deletedAt)))
      .orderBy(desc(cursos.createdAt)),
  );
}

export interface InscripcionFila {
  id: string;
  estado: CursoCatalogoFila["estadoInscripcion"];
  porcentajeAvance: string;
  calificacionFinal: string | null;
}

export async function obtenerInscripcion(
  usuarioId: string,
  cursoId: string,
): Promise<InscripcionFila | null> {
  return conSesion(usuarioId, async (tx) => {
    const [fila] = await tx
      .select({
        id: inscripciones.id,
        estado: inscripciones.estado,
        porcentajeAvance: inscripciones.porcentajeAvance,
        calificacionFinal: inscripciones.calificacionFinal,
      })
      .from(inscripciones)
      .where(and(eq(inscripciones.cursoId, cursoId), eq(inscripciones.profileId, usuarioId)))
      .limit(1);
    return fila ?? null;
  });
}

export interface LeccionProgresoFila {
  id: string;
  titulo: string;
  tipoContenido: "texto" | "video" | "archivo" | "mixto";
  esObligatoria: boolean;
  orden: number;
  completada: boolean;
}

export async function listarLeccionesConProgreso(
  usuarioId: string,
  moduloId: string,
  inscripcionId: string,
): Promise<LeccionProgresoFila[]> {
  return conSesion(usuarioId, (tx) =>
    tx
      .select({
        id: lecciones.id,
        titulo: lecciones.titulo,
        tipoContenido: lecciones.tipoContenido,
        esObligatoria: lecciones.esObligatoria,
        orden: lecciones.orden,
        completada: sql<boolean>`coalesce(${progresoLecciones.completada}, false)`,
      })
      .from(lecciones)
      .innerJoin(unidades, eq(lecciones.unidadId, unidades.id))
      .leftJoin(
        progresoLecciones,
        and(
          eq(progresoLecciones.leccionId, lecciones.id),
          eq(progresoLecciones.inscripcionId, inscripcionId),
        ),
      )
      .where(
        and(
          eq(unidades.moduloId, moduloId),
          isNull(unidades.deletedAt),
          isNull(lecciones.deletedAt),
        ),
      )
      .orderBy(asc(lecciones.orden), asc(lecciones.createdAt)),
  );
}

export async function estaLeccionCompletada(
  usuarioId: string,
  inscripcionId: string,
  leccionId: string,
): Promise<boolean> {
  return conSesion(usuarioId, async (tx) => {
    const [fila] = await tx
      .select({ completada: progresoLecciones.completada })
      .from(progresoLecciones)
      .where(
        and(
          eq(progresoLecciones.inscripcionId, inscripcionId),
          eq(progresoLecciones.leccionId, leccionId),
        ),
      )
      .limit(1);
    return fila?.completada ?? false;
  });
}

export interface EvaluacionEstadoFila {
  id: string;
  titulo: string;
  maxIntentos: number;
  puntajeMinimo: string;
  intentosUsados: number;
  mejorPuntaje: number | null;
  aprobado: boolean;
}

export async function listarEvaluacionesConEstado(
  usuarioId: string,
  cursoId: string,
): Promise<EvaluacionEstadoFila[]> {
  return conSesion(usuarioId, async (tx) => {
    const filasEvaluaciones = await tx
      .select({
        id: evaluaciones.id,
        titulo: evaluaciones.titulo,
        maxIntentos: evaluaciones.maxIntentos,
        puntajeMinimo: evaluaciones.puntajeMinimo,
      })
      .from(evaluaciones)
      .where(and(eq(evaluaciones.cursoId, cursoId), isNull(evaluaciones.deletedAt)));

    const resultado: EvaluacionEstadoFila[] = [];
    for (const evaluacion of filasEvaluaciones) {
      const intentos = await tx
        .select({
          puntaje: intentosEvaluacion.puntaje,
          aprobado: intentosEvaluacion.aprobado,
          estado: intentosEvaluacion.estado,
        })
        .from(intentosEvaluacion)
        .where(
          and(
            eq(intentosEvaluacion.evaluacionId, evaluacion.id),
            eq(intentosEvaluacion.profileId, usuarioId),
          ),
        );

      const finalizados = intentos.filter((i) => i.estado === "finalizado");
      const mejorPuntaje = finalizados.reduce<number | null>((mejor, i) => {
        const puntaje = i.puntaje ? Number(i.puntaje) : null;
        if (puntaje === null) return mejor;
        return mejor === null || puntaje > mejor ? puntaje : mejor;
      }, null);

      resultado.push({
        id: evaluacion.id,
        titulo: evaluacion.titulo,
        maxIntentos: evaluacion.maxIntentos,
        puntajeMinimo: evaluacion.puntajeMinimo,
        intentosUsados: finalizados.length,
        mejorPuntaje,
        aprobado: finalizados.some((i) => i.aprobado === true),
      });
    }
    return resultado;
  });
}
