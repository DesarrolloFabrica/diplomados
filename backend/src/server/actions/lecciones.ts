"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, isNull } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { unidades, lecciones } from "@/lib/db/schema";
import { requerirRol } from "@/lib/auth/sesion";
import { leccionSchema } from "@/lib/validators/lecciones";
import type { ResultadoAccion } from "@/types";

export interface ResultadoCrearLeccion extends ResultadoAccion {
  leccionId?: string;
}

export async function crearLeccion(
  cursoId: string,
  moduloId: string,
  _prev: ResultadoCrearLeccion | null,
  formData: FormData,
): Promise<ResultadoCrearLeccion> {
  const sesion = await requerirRol("superadmin", "instructor");

  const parsed = leccionSchema.safeParse({
    titulo: formData.get("titulo"),
    tipoContenido: formData.get("tipoContenido"),
    contenido: formData.get("contenido"),
    esObligatoria: formData.get("esObligatoria"),
    marcado: formData.get("marcado"),
  });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const resultado = await conSesion(sesion.id, async (tx) => {
    // Unidad implícita: una sola por módulo, creada la primera vez que se
    // agrega una lección (el contenido real no separa "unidades" de
    // "lecciones"; ver server/queries/modulos.ts).
    const [unidadExistente] = await tx
      .select({ id: unidades.id })
      .from(unidades)
      .where(and(eq(unidades.moduloId, moduloId), isNull(unidades.deletedAt)))
      .orderBy(asc(unidades.orden))
      .limit(1);

    let unidadId = unidadExistente?.id;
    if (!unidadId) {
      const [nuevaUnidad] = await tx
        .insert(unidades)
        .values({ moduloId, titulo: "Contenido", orden: 0 })
        .returning({ id: unidades.id });
      if (!nuevaUnidad) return [];
      unidadId = nuevaUnidad.id;
    }

    const existentes = await tx
      .select({ id: lecciones.id })
      .from(lecciones)
      .where(and(eq(lecciones.unidadId, unidadId), isNull(lecciones.deletedAt)));

    return tx
      .insert(lecciones)
      .values({
        unidadId,
        titulo: parsed.data.titulo,
        tipoContenido: parsed.data.tipoContenido,
        contenido: { texto: parsed.data.contenido ?? "" },
        esObligatoria: parsed.data.esObligatoria,
        marcado: parsed.data.marcado,
        orden: existentes.length,
      })
      .returning({ id: lecciones.id });
  });

  const fila = resultado[0];
  if (!fila) {
    return { ok: false, mensaje: "No tienes permiso para editar este módulo." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}/modulos/${moduloId}`);
  return { ok: true, leccionId: fila.id };
}

export async function actualizarLeccion(
  cursoId: string,
  moduloId: string,
  leccionId: string,
  _prev: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin", "instructor");

  const parsed = leccionSchema.safeParse({
    titulo: formData.get("titulo"),
    tipoContenido: formData.get("tipoContenido"),
    contenido: formData.get("contenido"),
    esObligatoria: formData.get("esObligatoria"),
    marcado: formData.get("marcado"),
  });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const filas = await conSesion(sesion.id, (tx) =>
    tx
      .update(lecciones)
      .set({
        titulo: parsed.data.titulo,
        tipoContenido: parsed.data.tipoContenido,
        contenido: { texto: parsed.data.contenido ?? "" },
        esObligatoria: parsed.data.esObligatoria,
        marcado: parsed.data.marcado,
      })
      .where(eq(lecciones.id, leccionId))
      .returning({ id: lecciones.id }),
  );

  if (!filas.length) {
    return { ok: false, mensaje: "No tienes permiso para editar esta lección." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}/modulos/${moduloId}/lecciones/${leccionId}`);
  revalidatePath(`/instructor/cursos/${cursoId}/modulos/${moduloId}`);
  return { ok: true };
}

export async function eliminarLeccion(
  cursoId: string,
  moduloId: string,
  leccionId: string,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin", "instructor");

  const filas = await conSesion(sesion.id, (tx) =>
    tx
      .update(lecciones)
      .set({ deletedAt: new Date() })
      .where(eq(lecciones.id, leccionId))
      .returning({ id: lecciones.id }),
  );

  if (!filas.length) {
    return { ok: false, mensaje: "No tienes permiso para eliminar esta lección." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}/modulos/${moduloId}`);
  return { ok: true };
}
