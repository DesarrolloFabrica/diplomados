import { eq } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import {
  DEFAULT_INTERFACE_VARIANT,
  resolveInterfaceVariant,
  type InterfaceVariant,
} from "@/config/interface-variants";

export interface PreferenciaInterfazUsuario {
  interfaceVariant: InterfaceVariant;
  interfaceVariantRaw: string | null;
  interfaceOnboardingCompletedAt: Date | null;
}

function esColumnaInexistente(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "42703"
  );
}

export async function obtenerPreferenciaInterfazUsuario(
  usuarioId: string,
): Promise<PreferenciaInterfazUsuario | null> {
  try {
    return await conSesion(usuarioId, async (tx) => {
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
  } catch (error) {
    if (!esColumnaInexistente(error)) {
      throw error;
    }

    return {
      interfaceVariant: DEFAULT_INTERFACE_VARIANT,
      interfaceVariantRaw: null,
      interfaceOnboardingCompletedAt: new Date(0),
    };
  }
}
