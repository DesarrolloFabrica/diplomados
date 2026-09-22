import { eq } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import {
  resolveInterfaceVariant,
  type InterfaceVariant,
} from "@/config/interface-variants";

export interface PreferenciaInterfazUsuario {
  interfaceVariant: InterfaceVariant;
  interfaceVariantRaw: string | null;
  interfaceOnboardingCompletedAt: Date | null;
}

export async function obtenerPreferenciaInterfazUsuario(
  usuarioId: string,
): Promise<PreferenciaInterfazUsuario | null> {
  return conSesion(usuarioId, async (tx) => {
    const [fila] = await tx
      .select({
        interfaceVariant: profiles.interfaceVariant,
        interfaceOnboardingCompletedAt: profiles.interfaceOnboardingCompletedAt,
      })
      .from(profiles)
      .where(eq(profiles.id, usuarioId))
      .limit(1);

    if (!fila) return null;

    return {
      interfaceVariant: resolveInterfaceVariant(fila.interfaceVariant),
      interfaceVariantRaw: fila.interfaceVariant,
      interfaceOnboardingCompletedAt: fila.interfaceOnboardingCompletedAt,
    };
  });
}
