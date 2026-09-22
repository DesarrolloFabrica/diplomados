import type { CSSProperties } from "react";
import {
  resolveInterfaceAsset,
  type InterfaceAssetKey,
  type InterfaceVariant,
} from "@backend/config/interface-variants";

/**
 * Velo de contraste por variante, aplicado únicamente junto a un asset real
 * (ver `estiloFondoInterfaz`) — nunca de forma global, para no oscurecer
 * superficies que no tienen imagen de fondo asignada (p. ej. el hero o el
 * dashboard de una variante sin `heroBackground`/`dashboardBackground`).
 *
 * Usa `color-mix()` sobre `var(--interface-bg)` en vez de un color fijo, así
 * el velo se adapta solo a claro/oscuro sin duplicar valores por tema.
 */
const OVERLAY_POR_VARIANTE: Partial<Record<InterfaceVariant, string>> = {
  business: "color-mix(in srgb, var(--interface-bg) 60%, transparent)",
  educational: "color-mix(in srgb, var(--interface-bg) 45%, transparent)",
  gamified: "color-mix(in srgb, var(--interface-bg) 45%, transparent)",
};

/**
 * Posición de recorte no centrada para assets cuyo motivo principal no está
 * en el centro de la imagen (evita que `cover` lo corte en pantallas
 * angostas/móvil). Clave = `${variant}:${asset}`. Si no hay entrada, se usa
 * el `center` por defecto del CSS.
 */
const POSICION_POR_ASSET: Record<string, string> = {
  // fondo-cursos.png: las ruinas/templo quedan a la derecha del encuadre.
  "gamified:dashboardBackground": "70% 45%",
  "gamified:roadmapBackground": "70% 45%",
};

/**
 * Punto único de integración entre `INTERFACE_VARIANT_CONFIG[variant].assets`
 * y los componentes visuales. Nunca hardcodear rutas de fondo/asset dentro de
 * un componente: siempre pasar por aquí para que asignar/reemplazar un asset
 * en la config (Fase 9) baste para que se vea en toda la app.
 *
 * Devuelve un objeto de estilo con `--interface-bg-image` (y, si aplica,
 * `--interface-overlay`) fijados solo cuando el asset existe, o `undefined`
 * si no hay ninguno asignado — en ese caso el CSS de la variante ya trae su
 * propio fondo de respaldo (gradientes/tokens), así que la UI nunca se rompe
 * por falta de asset.
 */
export function estiloFondoInterfaz(
  variant: string | null | undefined,
  asset: InterfaceAssetKey,
  fallback?: string,
): CSSProperties | undefined {
  const url = resolveInterfaceAsset({ variant, asset, fallback });
  if (!url) return undefined;

  const overlay = variant ? OVERLAY_POR_VARIANTE[variant as InterfaceVariant] : undefined;
  const posicion = variant ? POSICION_POR_ASSET[`${variant}:${asset}`] : undefined;

  return {
    "--interface-bg-image": `url(${url})`,
    ...(overlay ? { "--interface-overlay": overlay } : {}),
    ...(posicion ? { "--interface-bg-position": posicion } : {}),
  } as CSSProperties;
}
