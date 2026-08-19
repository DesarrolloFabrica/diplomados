import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { cursos, modulos } from "@/lib/db/schema";

export interface CursoFila {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  estado: "borrador" | "publicado" | "archivado";
  esDiplomado: boolean;
  nivelDificultad: "basico" | "intermedio" | "avanzado";
  imagenPortadaUrl: string | null;
  empresaId: string | null;
  autorId: string | null;
  createdAt: Date;
}

// soloPropios: true para el listado de autoría del instructor (solo sus
// cursos); false para el listado global del superadmin.
export async function listarCursos(usuarioId: string, soloPropios: boolean): Promise<CursoFila[]> {
  return conSesion(usuarioId, (tx) => {
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
        imagenPortadaUrl: cursos.imagenPortadaUrl,
        empresaId: cursos.empresaId,
        autorId: cursos.autorId,
        createdAt: cursos.createdAt,
      })
      .from(cursos)
      .where(and(...condiciones))
      .orderBy(desc(cursos.createdAt));
  });
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
