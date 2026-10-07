"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { requerirSesion } from "@/lib/auth/sesion";
import { obtenerInscripcion } from "@/server/queries/mis-cursos";
import type { ResultadoAccion } from "@/types";

export async function marcarLeccionCompletada(
  cursoId: string,
  inscripcionId: string,
  leccionId: string,
): Promise<ResultadoAccion> {
  const sesion = await requerirSesion();

  const inscripcion = await obtenerInscripcion(sesion.id, cursoId);
  if (!inscripcion || inscripcion.id !== inscripcionId) {
    return {
      ok: false,
      mensaje: "No tienes una inscripción válida en este curso. Cierra sesión y vuelve a entrar.",
    };
  }

  try {
    await conSesion(sesion.id, (tx) =>
      tx.execute(
        sql`select public.registrar_progreso_leccion(${inscripcionId}, ${leccionId}, ${cursoId})`,
      ),
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "No se pudo guardar el progreso de la lección.";
    return { ok: false, mensaje };
  }

  revalidatePath(`/mis-cursos/${cursoId}`);
  revalidatePath("/mis-cursos");
  revalidatePath("/home");
  return { ok: true };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Guarda la última clase abierta (inscripciones.ultima_leccion_id) cada vez
 * que el estudiante abre una lección. Es el destino de los botones
 * "Continuar" del home y del mapa (ver resolverNodoContinuar). Al completar
 * una lección, registrar_progreso_leccion() también la actualiza.
 *
 * Solo toca la inscripción del propio usuario (RLS inscripciones_update) y
 * solo si la lección pertenece a ese curso. Sin revalidatePath: las vistas
 * del home y del mapa son dinámicas y leen el valor fresco al navegar.
 */
export async function registrarUltimaLeccion(
  cursoId: string,
  inscripcionId: string,
  leccionId: string,
): Promise<ResultadoAccion> {
  const sesion = await requerirSesion();
  if (![cursoId, inscripcionId, leccionId].every((id) => UUID.test(id))) {
    return { ok: false, mensaje: "Datos no válidos." };
  }

  await conSesion(sesion.id, (tx) =>
    tx.execute(sql`
      update public.inscripciones
      set ultima_leccion_id = ${leccionId}::uuid,
          updated_at = now()
      where id = ${inscripcionId}::uuid
        and profile_id = ${sesion.id}::uuid
        and curso_id = ${cursoId}::uuid
        and public.curso_de_leccion(${leccionId}::uuid) = ${cursoId}::uuid
        and ultima_leccion_id is distinct from ${leccionId}::uuid
    `),
  );

  return { ok: true };
}
