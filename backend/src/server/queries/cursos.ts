import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import type { EscuelaVisual } from "@/config/escuelas";
import { cursos, modulos, profiles } from "@/lib/db/schema";

export interface CursoFila {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  estado: "borrador" | "publicado" | "archivado";
  esDiplomado: boolean;
  nivelDificultad: "basico" | "intermedio" | "avanzado";
  escuela: EscuelaVisual;
  imagenPortadaUrl: string | null;
  empresaId: string | null;
  autorId: string | null;
  createdAt: Date;
}

/**
 * Qué puede editar el usuario en el curso:
 * - "total": superadmin (datos generales, estado y contenido).
 * - "contenido": instructor del curso (módulos, lecciones, recursos y
 *   evaluaciones). Los datos generales y el estado los gestiona el superadmin.
 */
export type AccesoCurso = "total" | "contenido";

export interface CursoFilaConAcceso extends CursoFila {
  acceso: AccesoCurso;
}

export function accesoCurso(sesion: { rol: string }): AccesoCurso {
  return sesion.rol === "superadmin" ? "total" : "contenido";
}

// soloPropios: true para el instructor (cursos donde figura como autor, ya
// sea porque los creó o porque el superadmin se los asignó); false para el
// listado global del superadmin.
export async function listarCursos(
  usuarioId: string,
  soloPropios: boolean,
): Promise<CursoFilaConAcceso[]> {
  const acceso: AccesoCurso = soloPropios ? "contenido" : "total";
  const filas = await conSesion(usuarioId, (tx) => {
    const condiciones = [isNull(cursos.deletedAt)];
    if (soloPropios) condiciones.push(eq(cursos.autorId, usuarioId));

    return tx
      .select({
        id: cursos.id,
        titulo: cursos.titulo,
        slug: cursos.slug,
        descripcion: cursos.descripcion,
        estado: cursos.estado,
        esDiplomado: cursos.esDiplomado,
        nivelDificultad: cursos.nivelDificultad,
        escuela: cursos.escuela,
        imagenPortadaUrl: cursos.imagenPortadaUrl,
        empresaId: cursos.empresaId,
        autorId: cursos.autorId,
        createdAt: cursos.createdAt,
      })
      .from(cursos)
      .where(and(...condiciones))
      .orderBy(desc(cursos.createdAt));
  });

  return filas.map((fila) => ({ ...fila, acceso }));
}

export interface InstructorOpcion {
  id: string;
  nombreCompleto: string;
  email: string;
}

/** Instructores activos, para el selector de asignación del superadmin. */
export async function listarInstructores(usuarioId: string): Promise<InstructorOpcion[]> {
  return conSesion(usuarioId, (tx) =>
    tx
      .select({ id: profiles.id, nombreCompleto: profiles.nombreCompleto, email: profiles.email })
      .from(profiles)
      .where(
        and(eq(profiles.rol, "instructor"), eq(profiles.activo, true), isNull(profiles.deletedAt)),
      )
      .orderBy(asc(profiles.nombreCompleto)),
  );
}

export interface CursoDetalle extends CursoFila {
  objetivo: string | null;
  duracionEstimadaMin: number | null;
  porcentajeAprobacion: string;
  maxIntentos: number;
  navegacion: "obligatoria" | "libre";
}

export async function obtenerCurso(
  usuarioId: string,
  cursoId: string,
): Promise<CursoDetalle | null> {
  return conSesion(usuarioId, async (tx) => {
    const [fila] = await tx
      .select()
      .from(cursos)
      .where(and(eq(cursos.id, cursoId), isNull(cursos.deletedAt)))
      .limit(1);
    return fila ?? null;
  });
}

export interface ModuloFila {
  id: string;
  titulo: string;
  descripcion: string | null;
  orden: number;
}

export async function listarModulos(usuarioId: string, cursoId: string): Promise<ModuloFila[]> {
  return conSesion(usuarioId, (tx) =>
    tx
      .select({
        id: modulos.id,
        titulo: modulos.titulo,
        descripcion: modulos.descripcion,
        orden: modulos.orden,
      })
      .from(modulos)
      .where(and(eq(modulos.cursoId, cursoId), isNull(modulos.deletedAt)))
      .orderBy(asc(modulos.orden), asc(modulos.createdAt)),
  );
}
