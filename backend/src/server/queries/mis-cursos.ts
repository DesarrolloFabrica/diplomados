import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import {
  cursos,
  empresas,
  inscripciones,
  profiles,
  unidades,
  lecciones,
  progresoLecciones,
  evaluaciones,
  intentosEvaluacion,
  modulos,
} from "@/lib/db/schema";
import type { EscuelaVisual } from "@/config/escuelas";
import type { CursoDetalle, ModuloFila } from "@/server/queries/cursos";

export interface CursoCatalogoFila {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagenPortadaUrl: string | null;
  esDiplomado: boolean;
  nivelDificultad: "basico" | "intermedio" | "avanzado";
  escuela: EscuelaVisual;
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
        escuela: cursos.escuela,
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
  return conSesion(usuarioId, async (tx) => listarEvaluacionesConEstadoEnTx(tx, usuarioId, cursoId));
}

async function listarEvaluacionesConEstadoEnTx(
  tx: Parameters<Parameters<typeof conSesion>[1]>[0],
  usuarioId: string,
  cursoId: string,
): Promise<EvaluacionEstadoFila[]> {
  const filasEvaluaciones = await tx
    .select({
      id: evaluaciones.id,
      titulo: evaluaciones.titulo,
      maxIntentos: evaluaciones.maxIntentos,
      puntajeMinimo: evaluaciones.puntajeMinimo,
    })
    .from(evaluaciones)
    .where(and(eq(evaluaciones.cursoId, cursoId), isNull(evaluaciones.deletedAt)));

  if (filasEvaluaciones.length === 0) return [];

  const ids = filasEvaluaciones.map((e) => e.id);
  const intentos = await tx
    .select({
      evaluacionId: intentosEvaluacion.evaluacionId,
      puntaje: intentosEvaluacion.puntaje,
      aprobado: intentosEvaluacion.aprobado,
      estado: intentosEvaluacion.estado,
    })
    .from(intentosEvaluacion)
    .where(
      and(
        inArray(intentosEvaluacion.evaluacionId, ids),
        eq(intentosEvaluacion.profileId, usuarioId),
      ),
    );

  const intentosPorEval = new Map<string, typeof intentos>();
  for (const intento of intentos) {
    const lista = intentosPorEval.get(intento.evaluacionId) ?? [];
    lista.push(intento);
    intentosPorEval.set(intento.evaluacionId, lista);
  }

  return filasEvaluaciones.map((evaluacion) => {
    const deEval = intentosPorEval.get(evaluacion.id) ?? [];
    const finalizados = deEval.filter((i) => i.estado === "finalizado");
    const mejorPuntaje = finalizados.reduce<number | null>((mejor, i) => {
      const puntaje = i.puntaje ? Number(i.puntaje) : null;
      if (puntaje === null) return mejor;
      return mejor === null || puntaje > mejor ? puntaje : mejor;
    }, null);

    return {
      id: evaluacion.id,
      titulo: evaluacion.titulo,
      maxIntentos: evaluacion.maxIntentos,
      puntajeMinimo: evaluacion.puntajeMinimo,
      intentosUsados: finalizados.length,
      mejorPuntaje,
      aprobado: finalizados.some((i) => i.aprobado === true),
    };
  });
}

export interface ModuloConLeccionesProgreso extends ModuloFila {
  lecciones: LeccionProgresoFila[];
}

export interface VistaCursoColaborador {
  curso: CursoDetalle;
  modulos: ModuloFila[];
  inscripcion: InscripcionFila | null;
  modulosConLecciones: ModuloConLeccionesProgreso[];
  evaluaciones: EvaluacionEstadoFila[];
}

// Una sola transacción/conexión a Cloud SQL: evita N+1 round-trips
// (cada conSesion aparte suma cientos de ms en local).
export async function cargarVistaCursoColaborador(
  usuarioId: string,
  cursoId: string,
): Promise<VistaCursoColaborador | null> {
  return conSesion(usuarioId, async (tx) => {
    const [curso] = await tx
      .select()
      .from(cursos)
      .where(and(eq(cursos.id, cursoId), isNull(cursos.deletedAt)))
      .limit(1);
    if (!curso) return null;

    const listaModulos = await tx
      .select({
        id: modulos.id,
        titulo: modulos.titulo,
        descripcion: modulos.descripcion,
        orden: modulos.orden,
      })
      .from(modulos)
      .where(and(eq(modulos.cursoId, cursoId), isNull(modulos.deletedAt)))
      .orderBy(asc(modulos.orden), asc(modulos.createdAt));

    const [inscripcionRaw] = await tx
      .select({
        id: inscripciones.id,
        estado: inscripciones.estado,
        porcentajeAvance: inscripciones.porcentajeAvance,
        calificacionFinal: inscripciones.calificacionFinal,
      })
      .from(inscripciones)
      .where(and(eq(inscripciones.cursoId, cursoId), eq(inscripciones.profileId, usuarioId)))
      .limit(1);

    const inscripcion = inscripcionRaw ?? null;

    if (!inscripcion) {
      return {
        curso,
        modulos: listaModulos,
        inscripcion: null,
        modulosConLecciones: [],
        evaluaciones: [],
      };
    }

    const moduloIds = listaModulos.map((m) => m.id);
    const leccionesFilas =
      moduloIds.length === 0
        ? []
        : await tx
            .select({
              id: lecciones.id,
              titulo: lecciones.titulo,
              tipoContenido: lecciones.tipoContenido,
              esObligatoria: lecciones.esObligatoria,
              orden: lecciones.orden,
              completada: sql<boolean>`coalesce(${progresoLecciones.completada}, false)`,
              moduloId: unidades.moduloId,
            })
            .from(lecciones)
            .innerJoin(unidades, eq(lecciones.unidadId, unidades.id))
            .leftJoin(
              progresoLecciones,
              and(
                eq(progresoLecciones.leccionId, lecciones.id),
                eq(progresoLecciones.inscripcionId, inscripcion.id),
              ),
            )
            .where(
              and(
                inArray(unidades.moduloId, moduloIds),
                isNull(unidades.deletedAt),
                isNull(lecciones.deletedAt),
              ),
            )
            .orderBy(asc(unidades.orden), asc(lecciones.orden), asc(lecciones.createdAt));

    const leccionesPorModulo = new Map<string, LeccionProgresoFila[]>();
    for (const fila of leccionesFilas) {
      const lista = leccionesPorModulo.get(fila.moduloId) ?? [];
      lista.push({
        id: fila.id,
        titulo: fila.titulo,
        tipoContenido: fila.tipoContenido,
        esObligatoria: fila.esObligatoria,
        orden: fila.orden,
        completada: fila.completada,
      });
      leccionesPorModulo.set(fila.moduloId, lista);
    }

    const modulosConLecciones: ModuloConLeccionesProgreso[] = listaModulos.map((modulo) => ({
      ...modulo,
      lecciones: leccionesPorModulo.get(modulo.id) ?? [],
    }));

    const listaEvaluaciones = await listarEvaluacionesConEstadoEnTx(tx, usuarioId, cursoId);

    return {
      curso,
      modulos: listaModulos,
      inscripcion,
      modulosConLecciones,
      evaluaciones: listaEvaluaciones,
    };
  });
}

export interface PerfilColaboradorFila {
  nombreCompleto: string;
  email: string;
  cargo: string | null;
  area: string | null;
  activo: boolean;
  createdAt: Date;
  empresaNombre: string | null;
}

export async function obtenerPerfilColaborador(
  usuarioId: string,
): Promise<PerfilColaboradorFila | null> {
  return conSesion(usuarioId, async (tx) => {
    const [fila] = await tx
      .select({
        nombreCompleto: profiles.nombreCompleto,
        email: profiles.email,
        cargo: profiles.cargo,
        area: profiles.area,
        activo: profiles.activo,
        createdAt: profiles.createdAt,
        empresaNombre: empresas.nombre,
      })
      .from(profiles)
      .leftJoin(empresas, eq(profiles.empresaId, empresas.id))
      .where(and(eq(profiles.id, usuarioId), isNull(profiles.deletedAt)))
      .limit(1);
    return fila ?? null;
  });
}
