import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
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
  createdAt: Date;
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
  ultimaLeccionId: string | null;
  primeraLeccionId: string | null;
}

export interface ElementoBusquedaShell {
  id: string;
  tipo: "curso" | "leccion";
  titulo: string;
  contexto: string;
  href: string;
}

/**
 * Indice liviano para el buscador global del shell. Los cursos publicados
 * respetan RLS; las lecciones se limitan a inscripciones activas del usuario
 * para no ofrecer enlaces a contenido que todavia no puede abrir.
 */
export async function listarIndiceBusquedaColaborador(
  usuarioId: string,
): Promise<ElementoBusquedaShell[]> {
  return conSesion(usuarioId, async (tx) => {
    const cursosVisibles = await tx
      .select({
        id: cursos.id,
        titulo: cursos.titulo,
        inscripcionId: inscripciones.id,
      })
      .from(cursos)
      .leftJoin(
        inscripciones,
        and(
          eq(inscripciones.cursoId, cursos.id),
          eq(inscripciones.profileId, usuarioId),
          isNull(inscripciones.deletedAt),
        ),
      )
      .where(and(eq(cursos.estado, "publicado"), isNull(cursos.deletedAt)))
      .orderBy(asc(cursos.titulo));

    const clasesVisibles = await tx
      .select({
        id: lecciones.id,
        titulo: lecciones.titulo,
        cursoId: cursos.id,
        cursoTitulo: cursos.titulo,
        moduloTitulo: modulos.titulo,
      })
      .from(lecciones)
      .innerJoin(unidades, eq(lecciones.unidadId, unidades.id))
      .innerJoin(modulos, eq(unidades.moduloId, modulos.id))
      .innerJoin(cursos, eq(modulos.cursoId, cursos.id))
      .innerJoin(
        inscripciones,
        and(
          eq(inscripciones.cursoId, cursos.id),
          eq(inscripciones.profileId, usuarioId),
          isNull(inscripciones.deletedAt),
        ),
      )
      .where(
        and(
          eq(cursos.estado, "publicado"),
          isNull(cursos.deletedAt),
          isNull(modulos.deletedAt),
          isNull(unidades.deletedAt),
          isNull(lecciones.deletedAt),
        ),
      )
      .orderBy(
        asc(cursos.titulo),
        asc(modulos.orden),
        asc(unidades.orden),
        asc(lecciones.orden),
      );

    return [
      ...cursosVisibles.map<ElementoBusquedaShell>((curso) => ({
        id: `curso:${curso.id}`,
        tipo: "curso",
        titulo: curso.titulo,
        contexto: curso.inscripcionId ? "Curso inscrito" : "Curso disponible",
        href: curso.inscripcionId
          ? `/mis-cursos/${curso.id}`
          : `/mis-cursos/${curso.id}/informacion`,
      })),
      ...clasesVisibles.map<ElementoBusquedaShell>((leccion) => ({
        id: `leccion:${leccion.id}`,
        tipo: "leccion",
        titulo: leccion.titulo,
        contexto: `${leccion.cursoTitulo} · ${leccion.moduloTitulo}`,
        href: `/mis-cursos/${leccion.cursoId}/lecciones/${leccion.id}`,
      })),
    ];
  });
}

// RLS ya limita `cursos` a publicados (globales o de la empresa del
// usuario); el LEFT JOIN agrega el estado de inscripción de este usuario
// si ya se matriculó, sin filtrar los que todavía no.
export async function listarCursosParaColaborador(
  usuarioId: string,
): Promise<CursoCatalogoFila[]> {
  return conSesion(usuarioId, async (tx) => {
    const filas = await tx
      .select({
        id: cursos.id,
        titulo: cursos.titulo,
        descripcion: cursos.descripcion,
        imagenPortadaUrl: cursos.imagenPortadaUrl,
        esDiplomado: cursos.esDiplomado,
        nivelDificultad: cursos.nivelDificultad,
        escuela: cursos.escuela,
        createdAt: cursos.createdAt,
        inscripcionId: inscripciones.id,
        estadoInscripcion: inscripciones.estado,
        porcentajeAvance: inscripciones.porcentajeAvance,
        ultimaLeccionId: inscripciones.ultimaLeccionId,
      })
      .from(cursos)
      .leftJoin(
        inscripciones,
        and(eq(inscripciones.cursoId, cursos.id), eq(inscripciones.profileId, usuarioId)),
      )
      .where(and(eq(cursos.estado, "publicado"), isNull(cursos.deletedAt)))
      .orderBy(desc(cursos.createdAt));

    const cursoIdsSinUltimaLeccion = filas
      .filter((fila) => fila.inscripcionId && !fila.ultimaLeccionId)
      .map((fila) => fila.id);

    const primerasLecciones = await obtenerPrimerasLeccionesPorCursosEnTx(
      tx,
      cursoIdsSinUltimaLeccion,
    );

    return filas.map((fila) => ({
      ...fila,
      primeraLeccionId: fila.ultimaLeccionId ? null : (primerasLecciones.get(fila.id) ?? null),
    }));
  });
}

async function obtenerPrimerasLeccionesPorCursosEnTx(
  tx: Parameters<Parameters<typeof conSesion>[1]>[0],
  cursoIds: string[],
): Promise<Map<string, string>> {
  if (cursoIds.length === 0) return new Map();

  const filas = await tx
    .select({
      cursoId: modulos.cursoId,
      leccionId: lecciones.id,
    })
    .from(lecciones)
    .innerJoin(unidades, eq(lecciones.unidadId, unidades.id))
    .innerJoin(modulos, eq(unidades.moduloId, modulos.id))
    .where(
      and(
        inArray(modulos.cursoId, cursoIds),
        isNull(lecciones.deletedAt),
        isNull(unidades.deletedAt),
        isNull(modulos.deletedAt),
      ),
    )
    .orderBy(
      asc(modulos.cursoId),
      asc(modulos.orden),
      asc(unidades.orden),
      asc(lecciones.orden),
      asc(lecciones.createdAt),
    );

  const mapa = new Map<string, string>();
  for (const fila of filas) {
    if (!mapa.has(fila.cursoId)) {
      mapa.set(fila.cursoId, fila.leccionId);
    }
  }
  return mapa;
}

export interface InscripcionFila {
  id: string;
  estado: CursoCatalogoFila["estadoInscripcion"];
  porcentajeAvance: string;
  calificacionFinal: string | null;
  ultimaLeccionId: string | null;
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
        ultimaLeccionId: inscripciones.ultimaLeccionId,
      })
      .from(inscripciones)
      .where(and(eq(inscripciones.cursoId, cursoId), eq(inscripciones.profileId, usuarioId)))
      .limit(1);
    return fila ?? null;
  });
}

/**
 * Curso cuya última clase fue registrada más recientemente para el usuario.
 * Sirve como punto de entrada global de "Continuar" desde el dock.
 */
export async function obtenerCursoRecienteParaContinuar(
  usuarioId: string,
): Promise<string | null> {
  return (await obtenerUltimaLeccionAbierta(usuarioId))?.cursoId ?? null;
}

/**
 * Última lección abierta por el estudiante entre TODOS sus cursos: la de la
 * inscripción con actividad más reciente (updated_at, que se actualiza en
 * cada apertura de lección; ver registrarUltimaLeccion). Destino del botón
 * "Continuar aprendiendo" del menú inferior.
 */
export async function obtenerUltimaLeccionAbierta(
  usuarioId: string,
): Promise<{ cursoId: string; leccionId: string } | null> {
  return conSesion(usuarioId, async (tx) => {
    const [fila] = await tx
      .select({ cursoId: inscripciones.cursoId, leccionId: inscripciones.ultimaLeccionId })
      .from(inscripciones)
      .innerJoin(cursos, eq(inscripciones.cursoId, cursos.id))
      .innerJoin(lecciones, eq(lecciones.id, inscripciones.ultimaLeccionId))
      .where(
        and(
          eq(inscripciones.profileId, usuarioId),
          isNotNull(inscripciones.ultimaLeccionId),
          isNull(inscripciones.deletedAt),
          eq(cursos.estado, "publicado"),
          isNull(cursos.deletedAt),
          isNull(lecciones.deletedAt),
        ),
      )
      .orderBy(desc(inscripciones.updatedAt), desc(inscripciones.fechaAsignacion))
      .limit(1);

    return fila?.leccionId ? { cursoId: fila.cursoId, leccionId: fila.leccionId } : null;
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

async function listarLeccionesMetadataPorModulosEnTx(
  tx: Parameters<Parameters<typeof conSesion>[1]>[0],
  moduloIds: string[],
  inscripcionId: string | null,
): Promise<Array<LeccionProgresoFila & { moduloId: string }>> {
  if (moduloIds.length === 0) return [];

  if (!inscripcionId) {
    return tx
      .select({
        id: lecciones.id,
        titulo: lecciones.titulo,
        tipoContenido: lecciones.tipoContenido,
        esObligatoria: lecciones.esObligatoria,
        orden: lecciones.orden,
        completada: sql<boolean>`false`,
        moduloId: unidades.moduloId,
      })
      .from(lecciones)
      .innerJoin(unidades, eq(lecciones.unidadId, unidades.id))
      .where(
        and(
          inArray(unidades.moduloId, moduloIds),
          isNull(unidades.deletedAt),
          isNull(lecciones.deletedAt),
        ),
      )
      .orderBy(asc(unidades.orden), asc(lecciones.orden), asc(lecciones.createdAt));
  }

  return tx
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
        eq(progresoLecciones.inscripcionId, inscripcionId),
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
}

async function listarEvaluacionesMetadataEnTx(
  tx: Parameters<Parameters<typeof conSesion>[1]>[0],
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

  return filasEvaluaciones.map((evaluacion) => ({
    ...evaluacion,
    intentosUsados: 0,
    mejorPuntaje: null,
    aprobado: false,
  }));
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
        ultimaLeccionId: inscripciones.ultimaLeccionId,
      })
      .from(inscripciones)
      .where(and(eq(inscripciones.cursoId, cursoId), eq(inscripciones.profileId, usuarioId)))
      .limit(1);

    const inscripcion = inscripcionRaw ?? null;

    const moduloIds = listaModulos.map((m) => m.id);
    const leccionesFilas = await listarLeccionesMetadataPorModulosEnTx(
      tx,
      moduloIds,
      inscripcion?.id ?? null,
    );

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

    const listaEvaluaciones = inscripcion
      ? await listarEvaluacionesConEstadoEnTx(tx, usuarioId, cursoId)
      : await listarEvaluacionesMetadataEnTx(tx, cursoId);

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
