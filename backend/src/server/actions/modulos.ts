"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { modulos } from "@/lib/db/schema";
import { requerirRol } from "@/lib/auth/sesion";
import { moduloSchema } from "@/lib/validators/modulos";
import type { ResultadoAccion } from "@/types";

export interface ResultadoCrearModulo extends ResultadoAccion {
  moduloId?: string;
}

export async function crearModulo(
  cursoId: string,
  _prev: ResultadoCrearModulo | null,
  formData: FormData,
): Promise<ResultadoCrearModulo> {
  const sesion = await requerirRol("superadmin", "instructor");

  const parsed = moduloSchema.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
  });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const filas = await conSesion(sesion.id, async (tx) => {
    const existentes = await tx
      .select({ id: modulos.id })
      .from(modulos)
      .where(and(eq(modulos.cursoId, cursoId), isNull(modulos.deletedAt)));

    return tx
      .insert(modulos)
      .values({
        cursoId,
        titulo: parsed.data.titulo,
        descripcion: parsed.data.descripcion ?? null,
        orden: existentes.length,
      })
      .returning({ id: modulos.id });
  });

  const fila = filas[0];
  if (!fila) {
    return { ok: false, mensaje: "No tienes permiso para editar este curso." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}`);
  return { ok: true, moduloId: fila.id };
}

export async function actualizarModulo(
  cursoId: string,
  moduloId: string,
  _prev: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin", "instructor");

  const parsed = moduloSchema.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
  });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const filas = await conSesion(sesion.id, (tx) =>
    tx
      .update(modulos)
      .set({ titulo: parsed.data.titulo, descripcion: parsed.data.descripcion ?? null })
      .where(eq(modulos.id, moduloId))
      .returning({ id: modulos.id }),
  );

  if (!filas.length) {
    return { ok: false, mensaje: "No tienes permiso para editar este módulo." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}`);
  return { ok: true };
}

export async function eliminarModulo(
  cursoId: string,
  moduloId: string,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin", "instructor");

  const filas = await conSesion(sesion.id, (tx) =>
    tx
      .update(modulos)
      .set({ deletedAt: new Date() })
      .where(eq(modulos.id, moduloId))
      .returning({ id: modulos.id }),
  );

  if (!filas.length) {
    return { ok: false, mensaje: "No tienes permiso para eliminar este módulo." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}`);
  return { ok: true };
}
