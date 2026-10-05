"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { conSesion } from "@/lib/db";
import { inscripciones } from "@/lib/db/schema";
import { requerirRol } from "@/lib/auth/sesion";
import type { ResultadoAccion } from "@/types";

// Inscripción libre: el propio colaborador se matricula en cualquier curso
// publicado que pueda ver (global o de su empresa). RLS
// (inscripciones_insert en 006_rls.sql) valida lo mismo del lado de la
// base: profile_id/empresa_id propios y puede_ver_curso(curso_id).
export async function inscribirme(cursoId: string): Promise<ResultadoAccion> {
  const sesion = await requerirRol("colaborador", "instructor", "admin_empresa", "superadmin");

  if (!sesion.empresaId) {
    return { ok: false, mensaje: "Tu cuenta no pertenece a ninguna empresa." };
  }

  try {
    // Igual que en cursos: evitamos `.returning()` porque `inscripciones_select`
    // también termina llamando `puede_ver_curso()` (self-referencia de
    // `cursos`, no de `inscripciones`, pero conviene curarse en salud aquí
    // también) — generamos el id nosotros para no depender de RETURNING.
    const id = randomUUID();
    await conSesion(sesion.id, (tx) =>
      tx.insert(inscripciones).values({
        id,
        cursoId,
        profileId: sesion.id,
        empresaId: sesion.empresaId!,
      }),
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      return { ok: false, mensaje: "Ya estás inscrito en este curso." };
    }
    throw error;
  }

  revalidatePath("/mis-cursos");
  return { ok: true };
}

// TEMPORAL: solo para probar manualmente la ficha/landing de curso
// ("/mis-cursos/[cursoId]/informacion") en su estado "no inscrito" sin
// depender de herramientas de base de datos. `inscripciones_delete` (RLS,
// 006_rls.sql) ya permite borrar la propia fila, y el borrado hace cascade
// sobre progreso_lecciones/intentos_evaluacion (002_tables.sql), así que
// desinscribirse deja el curso como si nunca se hubiera iniciado. Quitar
// esta acción y su botón (`BotonDesinscribirmePrueba`) cuando ya no haga
// falta probar ese flujo.
export async function desinscribirmePrueba(cursoId: string): Promise<ResultadoAccion> {
  const sesion = await requerirRol("colaborador", "instructor", "admin_empresa", "superadmin");

  await conSesion(sesion.id, (tx) =>
    tx
      .delete(inscripciones)
      .where(and(eq(inscripciones.cursoId, cursoId), eq(inscripciones.profileId, sesion.id))),
  );

  revalidatePath("/mis-cursos");
  return { ok: true };
}
