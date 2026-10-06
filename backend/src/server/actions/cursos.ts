"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { cursos, profiles } from "@/lib/db/schema";
import { requerirRol } from "@/lib/auth/sesion";
import { cursoSchema } from "@/lib/validators/cursos";
import type { ResultadoAccion } from "@/types";

function generarSlug(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

function esSlugDuplicado(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505" &&
    "constraint" in error &&
    (error as { constraint?: string }).constraint === "cursos_slug_key"
  );
}

function datosCursoDesdeFormData(formData: FormData) {
  return {
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    objetivo: formData.get("objetivo"),
    imagenPortadaUrl: formData.get("imagenPortadaUrl"),
    duracionEstimadaMin: formData.get("duracionEstimadaMin"),
    nivelDificultad: formData.get("nivelDificultad"),
    porcentajeAprobacion: formData.get("porcentajeAprobacion"),
    maxIntentos: formData.get("maxIntentos"),
    navegacion: formData.get("navegacion"),
    esDiplomado: formData.get("esDiplomado"),
    escuela: formData.get("escuela"),
    empresaId: formData.get("empresaId"),
  };
}

export interface ResultadoCrearCurso extends ResultadoAccion {
  cursoId?: string;
}

export async function crearCurso(
  _prev: ResultadoCrearCurso | null,
  formData: FormData,
): Promise<ResultadoCrearCurso> {
  const sesion = await requerirRol("superadmin", "instructor");

  const parsed = cursoSchema.safeParse(datosCursoDesdeFormData(formData));
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const slugBase = generarSlug(parsed.data.titulo);
  if (!slugBase) {
    return { ok: false, mensaje: "El título debe incluir al menos una letra o número." };
  }

  const valores = {
    titulo: parsed.data.titulo,
    descripcion: parsed.data.descripcion ?? null,
    objetivo: parsed.data.objetivo ?? null,
    imagenPortadaUrl: parsed.data.imagenPortadaUrl ?? null,
    duracionEstimadaMin: parsed.data.duracionEstimadaMin ?? null,
    nivelDificultad: parsed.data.nivelDificultad,
    porcentajeAprobacion: String(parsed.data.porcentajeAprobacion),
    maxIntentos: parsed.data.maxIntentos,
    navegacion: parsed.data.navegacion,
    esDiplomado: parsed.data.esDiplomado,
    escuela: parsed.data.escuela,
    empresaId: parsed.data.empresaId || null,
    autorId: sesion.id,
  };

  for (const slug of [slugBase, `${slugBase}-${Date.now().toString(36).slice(-5)}`]) {
    // Sin .returning(): puede_ver_curso() vuelve a consultar `cursos` desde
    // adentro (self-referencia). Postgres evalúa esa función (stable) con
    // el snapshot del inicio del statement, que todavía no ve la fila que
    // este mismo INSERT acaba de crear — el chequeo de RETURNING la
    // bloquea con "violates row-level security policy" aunque el INSERT en
    // sí sea válido. Generamos el id nosotros para no necesitar RETURNING.
    const id = randomUUID();
    try {
      await conSesion(sesion.id, (tx) => tx.insert(cursos).values({ ...valores, id, slug }));
      revalidatePath("/instructor/cursos");
      revalidatePath("/admin/cursos");
      return { ok: true, cursoId: id };
    } catch (error) {
      if (esSlugDuplicado(error)) continue;
      throw error;
    }
  }

  return { ok: false, mensaje: "Ya existe un curso con un título muy similar. Cambia el título." };
}

export async function actualizarCurso(
  id: string,
  _prev: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  // Los datos generales del curso los gestiona el superadmin; el instructor
  // solo edita el contenido (módulos, lecciones, recursos, evaluaciones).
  const sesion = await requerirRol("superadmin");

  const parsed = cursoSchema.safeParse(datosCursoDesdeFormData(formData));
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const filas = await conSesion(sesion.id, (tx) =>
    tx
      .update(cursos)
      .set({
        titulo: parsed.data.titulo,
        descripcion: parsed.data.descripcion ?? null,
        objetivo: parsed.data.objetivo ?? null,
        imagenPortadaUrl: parsed.data.imagenPortadaUrl ?? null,
        duracionEstimadaMin: parsed.data.duracionEstimadaMin ?? null,
        nivelDificultad: parsed.data.nivelDificultad,
        porcentajeAprobacion: String(parsed.data.porcentajeAprobacion),
        maxIntentos: parsed.data.maxIntentos,
        navegacion: parsed.data.navegacion,
        esDiplomado: parsed.data.esDiplomado,
        escuela: parsed.data.escuela,
        empresaId: parsed.data.empresaId || null,
      })
      .where(eq(cursos.id, id))
      .returning({ id: cursos.id }),
  );

  // RLS filtra la fila si no tienes permiso: 0 filas no lanza error, así que
  // hay que comprobarlo explícitamente para no reportar éxito falso.
  if (!filas.length) {
    return { ok: false, mensaje: "No tienes permiso para editar este curso." };
  }

  revalidatePath(`/instructor/cursos/${id}`);
  revalidatePath("/instructor/cursos");
  revalidatePath("/admin/cursos");
  return { ok: true };
}

export async function cambiarEstadoCurso(
  id: string,
  estado: "borrador" | "publicado" | "archivado",
): Promise<ResultadoAccion> {
  // Publicar/archivar es decisión del superadmin.
  const sesion = await requerirRol("superadmin");

  const filas = await conSesion(sesion.id, (tx) =>
    tx.update(cursos).set({ estado }).where(eq(cursos.id, id)).returning({ id: cursos.id }),
  );

  if (!filas.length) {
    return { ok: false, mensaje: "No tienes permiso para editar este curso." };
  }

  revalidatePath(`/instructor/cursos/${id}`);
  revalidatePath("/instructor/cursos");
  revalidatePath("/admin/cursos");
  return { ok: true };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Asigna el curso a un instructor (solo superadmin). Sin tablas nuevas: el
 * instructor queda como autor (cursos.autor_id), que es lo que las políticas
 * RLS existentes (puede_editar_curso) usan para permitirle editar el
 * contenido. El superadmin conserva acceso total a todos los cursos.
 */
export async function asignarInstructorCurso(
  cursoId: string,
  instructorId: string,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin");

  if (!UUID.test(cursoId) || !UUID.test(instructorId)) {
    return { ok: false, mensaje: "Datos no válidos." };
  }

  const filas = await conSesion(sesion.id, async (tx) => {
    const [instructor] = await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(
          eq(profiles.id, instructorId),
          eq(profiles.rol, "instructor"),
          eq(profiles.activo, true),
          isNull(profiles.deletedAt),
        ),
      )
      .limit(1);
    if (!instructor) return null;

    return tx
      .update(cursos)
      .set({ autorId: instructorId })
      .where(eq(cursos.id, cursoId))
      .returning({ id: cursos.id });
  });

  if (filas === null) {
    return { ok: false, mensaje: "El usuario seleccionado no es un instructor activo." };
  }
  if (!filas.length) {
    return { ok: false, mensaje: "No se encontró el curso." };
  }

  revalidatePath("/admin/cursos");
  revalidatePath("/instructor/cursos");
  revalidatePath("/instructor/evaluaciones");
  revalidatePath(`/instructor/cursos/${cursoId}`);
  return { ok: true };
}
