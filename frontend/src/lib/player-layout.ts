import type { InterfaceVariant } from "@backend/config/interface-variants";

/** Estructuras internas del visualizador. No son nombres visibles en la UI. */
export type PlayerLayoutType = "type-1" | "type-2";

/**
 * Resuelve una sola vez la estructura del Player. La variante continúa
 * determinando exclusivamente el skin (tokens, fondos, bordes y acentos).
 */
export function resolvePlayerLayoutType(
  variant: InterfaceVariant | string | null | undefined,
): PlayerLayoutType {
  switch (variant) {
    case "educational":
    case "gamified": // Identificador persistido actual de la UI Aventura.
      return "type-2";
    case "creative":
    case "business":
    default:
      return "type-1";
  }
}

