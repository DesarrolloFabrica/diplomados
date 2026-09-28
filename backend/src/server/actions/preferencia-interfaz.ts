"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { conSesion } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requerirSesion } from "@/lib/auth/sesion";
import { INTERFACE_VARIANTS } from "@/config/interface-variants";
import type { ResultadoAccion } from "@/types";

const preferenciaInterfazSchema = z.object({
  variant: z.enum(INTERFACE_VARIANTS),
});

function esColumnaInexistente(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "42703"
  );
}

const MENSAJE_MIGRACION_PENDIENTE =
  "La preferencia visual aun no esta disponible. Falta aplicar la migracion 013 en produccion.";

export async function actualizarPreferenciaInterfaz(input: {
  variant: unknown;
}): Promise<ResultadoAccion> {
  const sesion = await requerirSesion();
  const parsed = preferenciaInterfazSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, mensaje: "Variante de interfaz no valida." };
  }

  try {
    await conSesion(sesion.id, (tx) =>
      tx
        .update(profiles)
        .set({ interfaceVariant: parsed.data.variant })
        .where(eq(profiles.id, sesion.id)),
    );
  } catch (error) {
    if (esColumnaInexistente(error)) {
      return { ok: false, mensaje: MENSAJE_MIGRACION_PENDIENTE };
    }
    throw error;
  }

  return { ok: true };
}

export async function seleccionarInterfazInicial(input: {
  variant: unknown;
}): Promise<ResultadoAccion> {
  const sesion = await requerirSesion();
  const parsed = preferenciaInterfazSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, mensaje: "Variante de interfaz no valida." };
  }

  try {
    await conSesion(sesion.id, (tx) =>
      tx
        .update(profiles)
        .set({
          interfaceVariant: parsed.data.variant,
          interfaceOnboardingCompletedAt: sql`coalesce(${profiles.interfaceOnboardingCompletedAt}, now())`,
        })
        .where(eq(profiles.id, sesion.id)),
    );
  } catch (error) {
    if (esColumnaInexistente(error)) {
      return { ok: false, mensaje: MENSAJE_MIGRACION_PENDIENTE };
    }
    throw error;
  }

  return { ok: true };
}
