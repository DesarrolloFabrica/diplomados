"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { requerirSesion } from "@/lib/auth/sesion";
import type { ResultadoAccion } from "@/types";

export async function marcarLeccionCompletada(
  cursoId: string,
  inscripcionId: string,
  leccionId: string,
): Promise<ResultadoAccion> {
  const sesion = await requerirSesion();

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
  return { ok: true };
}
