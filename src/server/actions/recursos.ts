"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { recursos } from "@/lib/db/schema";
import { requerirRol } from "@/lib/auth/sesion";
import {
  recursoEnlaceSchema,
  recursoArchivoSchema,
  tipoRecursoSchema,
} from "@/lib/validators/recursos";
import { generarUrlSubida, rutaObjeto, eliminarObjeto, type CarpetaStorage } from "@/lib/storage";
import type { ResultadoAccion } from "@/types";
import type { z } from "zod";

const CARPETA_POR_TIPO: Record<z.infer<typeof tipoRecursoSchema>, CarpetaStorage> = {
  pdf: "recursos",
  presentacion: "recursos",
  archivo: "recursos",
  imagen: "recursos",
  audio: "recursos",
  video: "videos",
  enlace: "recursos", // no se usa: los enlaces no suben archivo a Storage
};

export interface ResultadoUrlSubida extends ResultadoAccion {
  url?: string;
  storagePath?: string;
}

// Paso 1 de la subida: el navegador pide una URL firmada y sube el
// binario directo a GCS (no pasa por el servidor de Next.js).
export async function solicitarUrlSubidaRecurso(
  tipo: string,
  nombreArchivo: string,
  contentType: string,
): Promise<ResultadoUrlSubida> {
  await requerirRol("superadmin", "instructor");

  const tipoParsed = tipoRecursoSchema.safeParse(tipo);
  if (!tipoParsed.success) {
    return { ok: false, mensaje: "Tipo de recurso no válido." };
  }

  const carpeta = CARPETA_POR_TIPO[tipoParsed.data];
  const storagePath = rutaObjeto(carpeta, `${randomUUID()}-${nombreArchivo}`);

  try {
    const url = await generarUrlSubida(storagePath, contentType);
    return { ok: true, url, storagePath };
  } catch {
    return {
      ok: false,
      mensaje:
        "No se pudo generar la URL de subida. Revisa que GCS_BUCKET esté configurado y que la app tenga credenciales de Google Cloud.",
    };
  }
}

// Paso 2: una vez el navegador confirma que el PUT a GCS terminó, se
// registra la fila en `recursos` con la ruta ya subida.
export async function agregarRecursoArchivo(
  cursoId: string,
  moduloId: string,
  leccionId: string,
  _prev: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin", "instructor");

  const parsed = recursoArchivoSchema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    storagePath: formData.get("storagePath"),
    tamanoBytes: formData.get("tamanoBytes"),
  });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const filas = await conSesion(sesion.id, async (tx) => {
    const existentes = await tx
      .select({ id: recursos.id })
      .from(recursos)
      .where(and(eq(recursos.leccionId, leccionId), isNull(recursos.deletedAt)));

    return tx
      .insert(recursos)
      .values({
        leccionId,
        tipo: parsed.data.tipo,
        nombre: parsed.data.nombre,
        storagePath: parsed.data.storagePath,
        tamanoBytes: parsed.data.tamanoBytes ?? null,
        orden: existentes.length,
      })
      .returning({ id: recursos.id });
  });

  if (!filas.length) {
    return { ok: false, mensaje: "No tienes permiso para editar esta lección." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}/modulos/${moduloId}/lecciones/${leccionId}`);
  return { ok: true };
}

export async function agregarRecursoEnlace(
  cursoId: string,
  moduloId: string,
  leccionId: string,
  _prev: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin", "instructor");

  const parsed = recursoEnlaceSchema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    urlExterna: formData.get("urlExterna"),
  });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const filas = await conSesion(sesion.id, async (tx) => {
    const existentes = await tx
      .select({ id: recursos.id })
      .from(recursos)
      .where(and(eq(recursos.leccionId, leccionId), isNull(recursos.deletedAt)));

    return tx
      .insert(recursos)
      .values({
        leccionId,
        tipo: parsed.data.tipo,
        nombre: parsed.data.nombre,
        urlExterna: parsed.data.urlExterna,
        orden: existentes.length,
      })
      .returning({ id: recursos.id });
  });

  if (!filas.length) {
    return { ok: false, mensaje: "No tienes permiso para editar esta lección." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}/modulos/${moduloId}/lecciones/${leccionId}`);
  return { ok: true };
}

export async function actualizarRecursoEnlace(
  cursoId: string,
  moduloId: string,
  leccionId: string,
  recursoId: string,
  _prev: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin", "instructor");

  const parsed = recursoEnlaceSchema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    urlExterna: formData.get("urlExterna"),
  });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const filas = await conSesion(sesion.id, async (tx) => {
    const [existente] = await tx
      .select({ id: recursos.id, urlExterna: recursos.urlExterna })
      .from(recursos)
      .where(
        and(
          eq(recursos.id, recursoId),
          eq(recursos.leccionId, leccionId),
          isNull(recursos.deletedAt),
        ),
      )
      .limit(1);

    if (!existente?.urlExterna) {
      return [];
    }

    return tx
      .update(recursos)
      .set({
        nombre: parsed.data.nombre,
        tipo: parsed.data.tipo,
        urlExterna: parsed.data.urlExterna,
        updatedAt: new Date(),
      })
      .where(eq(recursos.id, recursoId))
      .returning({ id: recursos.id });
  });

  if (!filas.length) {
    return { ok: false, mensaje: "No se pudo editar el enlace." };
  }

  revalidatePath(`/instructor/cursos/${cursoId}/modulos/${moduloId}/lecciones/${leccionId}`);
  return { ok: true };
}

export async function eliminarRecurso(
  cursoId: string,
  moduloId: string,
  leccionId: string,
  recursoId: string,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin", "instructor");

  const filas = await conSesion(sesion.id, (tx) =>
    tx
      .update(recursos)
      .set({ deletedAt: new Date() })
      .where(eq(recursos.id, recursoId))
      .returning({ id: recursos.id, storagePath: recursos.storagePath }),
  );

  if (!filas.length) {
    return { ok: false, mensaje: "No tienes permiso para eliminar este recurso." };
  }

  const storagePath = filas[0]?.storagePath;
  if (storagePath) {
    await eliminarObjeto(storagePath).catch(() => {
      // El registro ya quedó borrado lógicamente; si falla el borrado en
      // GCS (p. ej. bucket no configurado en local) no bloqueamos la acción.
    });
  }

  revalidatePath(`/instructor/cursos/${cursoId}/modulos/${moduloId}/lecciones/${leccionId}`);
  return { ok: true };
}
