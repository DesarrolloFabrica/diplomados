"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { empresas } from "@/lib/db/schema";
import { requerirRol } from "@/lib/auth/sesion";
import { empresaSchema } from "@/lib/validators/empresas";
import type { ResultadoAccion } from "@/types";

function esViolacionDeNitDuplicado(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505" &&
    "constraint" in error &&
    (error as { constraint?: string }).constraint === "empresas_nit_key"
  );
}

export async function crearEmpresa(
  _prev: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin");

  const parsed = empresaSchema.safeParse({
    nombre: formData.get("nombre"),
    nit: formData.get("nit"),
    logoUrl: formData.get("logoUrl"),
  });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  try {
    await conSesion(sesion.id, (tx) =>
      tx.insert(empresas).values({
        nombre: parsed.data.nombre,
        nit: parsed.data.nit ?? null,
        logoUrl: parsed.data.logoUrl ?? null,
      }),
    );
  } catch (error) {
    if (esViolacionDeNitDuplicado(error)) {
      return { ok: false, mensaje: "Ya existe una empresa con ese NIT." };
    }
    throw error;
  }

  revalidatePath("/admin/empresas");
  return { ok: true };
}

export async function actualizarEmpresa(
  id: string,
  _prev: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin");

  const parsed = empresaSchema.safeParse({
    nombre: formData.get("nombre"),
    nit: formData.get("nit"),
    logoUrl: formData.get("logoUrl"),
  });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  try {
    await conSesion(sesion.id, (tx) =>
      tx
        .update(empresas)
        .set({
          nombre: parsed.data.nombre,
          nit: parsed.data.nit ?? null,
          logoUrl: parsed.data.logoUrl ?? null,
        })
        .where(eq(empresas.id, id)),
    );
  } catch (error) {
    if (esViolacionDeNitDuplicado(error)) {
      return { ok: false, mensaje: "Ya existe una empresa con ese NIT." };
    }
    throw error;
  }

  revalidatePath("/admin/empresas");
  return { ok: true };
}

export async function cambiarEstadoEmpresa(
  id: string,
  estado: "activa" | "inactiva",
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin");

  await conSesion(sesion.id, (tx) =>
    tx.update(empresas).set({ estado }).where(eq(empresas.id, id)),
  );

  revalidatePath("/admin/empresas");
  return { ok: true };
}
