import { and, asc, eq, isNull } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { modulos, unidades, lecciones, recursos } from "@/lib/db/schema";
import type { TipoRecurso } from "@/lib/db/schema";

export interface LeccionFila {
  id: string;
  titulo: string;
  tipoContenido: "texto" | "video" | "archivo" | "mixto";
  contenido: unknown;
  esObligatoria: boolean;
  marcado: "automatico" | "manual";
  orden: number;
}

// Las lecciones viven bajo una unidad "implícita" (una por módulo, creada
// la primera vez que se agrega una lección) para no obligar al instructor
// a gestionar un nivel extra que el contenido real no usa. Ver
// src/server/actions/lecciones.ts.
export async function listarLecciones(
  usuarioId: string,
  moduloId: string,
): Promise<LeccionFila[]> {
  return conSesion(usuarioId, (tx) =>
    tx
      .select({
        id: lecciones.id,
        titulo: lecciones.titulo,
        tipoContenido: lecciones.tipoContenido,
        contenido: lecciones.contenido,
        esObligatoria: lecciones.esObligatoria,
        marcado: lecciones.marcado,
        orden: lecciones.orden,
      })
      .from(lecciones)
      .innerJoin(unidades, eq(lecciones.unidadId, unidades.id))
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

export async function obtenerLeccion(
  usuarioId: string,
  leccionId: string,
): Promise<LeccionFila | null> {
  return conSesion(usuarioId, async (tx) => {
    const [fila] = await tx
      .select({
        id: lecciones.id,
        titulo: lecciones.titulo,
        tipoContenido: lecciones.tipoContenido,
        contenido: lecciones.contenido,
        esObligatoria: lecciones.esObligatoria,
        marcado: lecciones.marcado,
        orden: lecciones.orden,
      })
      .from(lecciones)
      .where(and(eq(lecciones.id, leccionId), isNull(lecciones.deletedAt)))
      .limit(1);
    return fila ?? null;
  });
}

export interface RecursoFila {
  id: string;
  tipo: TipoRecurso;
  nombre: string;
  storagePath: string | null;
  urlExterna: string | null;
  tamanoBytes: number | null;
  obligatorio: boolean;
  orden: number;
}

export async function listarRecursos(
  usuarioId: string,
  leccionId: string,
): Promise<RecursoFila[]> {
  return conSesion(usuarioId, (tx) =>
    tx
      .select({
        id: recursos.id,
        tipo: recursos.tipo,
        nombre: recursos.nombre,
        storagePath: recursos.storagePath,
        urlExterna: recursos.urlExterna,
        tamanoBytes: recursos.tamanoBytes,
        obligatorio: recursos.obligatorio,
        orden: recursos.orden,
      })
      .from(recursos)
      .where(and(eq(recursos.leccionId, leccionId), isNull(recursos.deletedAt)))
      .orderBy(asc(recursos.orden), asc(recursos.createdAt)),
  );
}

export async function obtenerModulo(usuarioId: string, moduloId: string) {
  return conSesion(usuarioId, async (tx) => {
    const [fila] = await tx
      .select()
      .from(modulos)
      .where(and(eq(modulos.id, moduloId), isNull(modulos.deletedAt)))
      .limit(1);
    return fila ?? null;
  });
}
