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

export async function actualizarPreferenciaInterfaz(input: {
  variant: unknown;
}): Promise<ResultadoAccion> {
  const sesion = await requerirSesion();
  const parsed = preferenciaInterfazSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, mensaje: "Variante de interfaz no valida." };
  }

  await conSesion(sesion.id, (tx) =>
    tx
      .update(profiles)
      .set({ interfaceVariant: parsed.data.variant })
      .where(eq(profiles.id, sesion.id)),
  );

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

  await conSesion(sesion.id, (tx) =>
    tx
      .update(profiles)
      .set({
        interfaceVariant: parsed.data.variant,
        interfaceOnboardingCompletedAt: sql`coalesce(${profiles.interfaceOnboardingCompletedAt}, now())`,
      })
      .where(eq(profiles.id, sesion.id)),
  );

  return { ok: true };
}
