"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { inscripciones, progresoLecciones } from "@/lib/db/schema";
import { requerirSesion } from "@/lib/auth/sesion";
import type { ResultadoAccion } from "@/types";

export async function marcarLeccionCompletada(
  cursoId: string,
  inscripcionId: string,
  leccionId: string,
): Promise<ResultadoAccion> {
  const sesion = await requerirSesion();
  if (!sesion.empresaId) {
    return { ok: false, mensaje: "Tu cuenta no pertenece a ninguna empresa." };
  }

  await conSesion(sesion.id, async (tx) => {
    const [existente] = await tx
      .select({ id: progresoLecciones.id })
      .from(progresoLecciones)
      .where(
        and(
          eq(progresoLecciones.inscripcionId, inscripcionId),
          eq(progresoLecciones.leccionId, leccionId),
        ),
      )
      .limit(1);

    if (existente) {
      await tx
        .update(progresoLecciones)
        .set({ completada: true, fechaCompletado: new Date() })
        .where(eq(progresoLecciones.id, existente.id));
    } else {
      await tx.insert(progresoLecciones).values({
        inscripcionId,
        leccionId,
        empresaId: sesion.empresaId!,
        completada: true,
        fechaCompletado: new Date(),
      });
    }

    // Recalcula el % de avance: lecciones completadas / total del curso.
    const totalResultado = await tx.execute(sql`
      select count(*)::int as total
      from lecciones l
      join unidades u on u.id = l.unidad_id
      join modulos m on m.id = u.modulo_id
      where m.curso_id = ${cursoId}
        and l.deleted_at is null and u.deleted_at is null and m.deleted_at is null
    `);
    const completadasResultado = await tx.execute(sql`
      select count(*)::int as completadas
      from progreso_lecciones pl
      join lecciones l on l.id = pl.leccion_id
      join unidades u on u.id = l.unidad_id
      join modulos m on m.id = u.modulo_id
      where pl.inscripcion_id = ${inscripcionId} and pl.completada = true
        and m.curso_id = ${cursoId}
    `);

    const total = Number((totalResultado.rows[0] as { total?: number } | undefined)?.total ?? 0);
    const completadas = Number(
      (completadasResultado.rows[0] as { completadas?: number } | undefined)?.completadas ?? 0,
    );
    const porcentaje = total > 0 ? Math.round((completadas / total) * 10000) / 100 : 0;
    const nuevoEstado = porcentaje >= 100 ? "finalizado" : porcentaje > 0 ? "en_progreso" : "no_iniciado";

    await tx
      .update(inscripciones)
      .set({
        porcentajeAvance: String(porcentaje),
        estado: nuevoEstado,
        ultimaLeccionId: leccionId,
      })
      .where(eq(inscripciones.id, inscripcionId));
  });

  revalidatePath(`/mis-cursos/${cursoId}`);
  revalidatePath("/mis-cursos");
  return { ok: true };
}
