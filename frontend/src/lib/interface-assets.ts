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
 * IMPORTANTE: `--interface-overlay` se usa como una capa más dentro de
 * `background-image` (junto a `--interface-bg-image` y los degradados de
 * respaldo). `background-image` exige un valor `<image>` en cada capa —
 * un `<color>` suelto (p. ej. `color-mix()` a secas) es inválido ahí y
 * invalida TODA la propiedad en tiempo de cómputo, con lo que ni el overlay
 * ni el asset ni los degradados de respaldo llegan a pintarse. Por eso cada
 * valor se envuelve en `linear-gradient(color, color)`: un degradado plano
 * es un `<image>` válido y produce el mismo efecto visual de velo sólido.
 * Usa `color-mix()` sobre `var(--interface-bg)` en vez de un color fijo, así
 * el velo se adapta solo a claro/oscuro sin duplicar valores por tema.
 */
function overlaySolido(color: string): string {
  return `linear-gradient(${color}, ${color})`;
}

const OVERLAY_POR_VARIANTE: Partial<Record<InterfaceVariant, string>> = {
  business: overlaySolido("color-mix(in srgb, var(--interface-bg) 60%, transparent)"),
  educational: overlaySolido("color-mix(in srgb, var(--interface-bg) 45%, transparent)"),
  gamified: overlaySolido("color-mix(in srgb, var(--interface-bg) 45%, transparent)"),
};

/**
 * Overrides puntuales por combinación variante:pantalla, para cuando el
 * asset de esa pantalla concreta necesita más o menos velo que el resto
 * (p. ej. lección/quiz muestran texto denso encima del fondo — más
 * ilustrado/detallado en `Edu-dash.png`/`game-quiz.png`/`emp-quiz.png` que
 * `emp-dash.png` — y piden un poco más de contraste). Si no hay entrada
 * aquí, se usa el valor por variante de `OVERLAY_POR_VARIANTE`.
 *
 * Un valor `""` desactiva el velo por completo para esa combinación
 * (distinto de "sin entrada", que hereda el valor por variante): el roadmap
 * en zigzag de business/educational (Fase 12) queda demasiado opaco con el
 * velo por defecto de su variante, así que se pide explícitamente sin velo.
 */
const OVERLAY_POR_ASSET: Record<string, string> = {
  "business:lessonBackground": overlaySolido("rgba(4, 22, 64, 0.14)"),
  "business:quizBackground": overlaySolido("rgba(2, 16, 50, 0.1)"),
  "business:roadmapBackground": "",
  // Pedido explícito: el fondo del dashboard se veía lavado (el velo por
  // defecto de la variante, 60% de --interface-bg, aclara demasiado la
  // imagen navy oscura en modo claro). La referencia quiere el fondo
  // tecnológico bien visible.
  "business:dashboardBackground": "",
  // Pedido explícito: el dashboard educativo un poco más oscuro que el
  // velo por defecto de la variante (45%).
  "educational:dashboardBackground": overlaySolido("color-mix(in srgb, var(--interface-bg) 60%, transparent)"),
  // Reproductor de contenido (Fase 14): la biblioteca de fondo debe quedar
  // claramente visible — el panel se rediseñó como vidrio verde oscuro con
  // su propia superficie clara para el contenido, así que ya no necesita un
  // velo fuerte para dar contraste.
  "educational:lessonBackground": overlaySolido("color-mix(in srgb, var(--interface-bg) 20%, transparent)"),
  "educational:quizBackground": overlaySolido("color-mix(in srgb, var(--interface-bg) 55%, transparent)"),
  "educational:roadmapBackground": "",
  "gamified:lessonBackground": overlaySolido("rgba(6, 17, 32, 0.2)"),
  "gamified:quizBackground": overlaySolido("color-mix(in srgb, var(--interface-bg) 55%, transparent)"),
  // Rediseño del dashboard gamificado: velo suave (no el 45% por defecto de
  // la variante) para que la imagen de fondo quede claramente visible detrás
  // de las tarjetas, con solo un poco de contraste azul oscuro.
  "gamified:dashboardBackground": overlaySolido("rgba(0, 0, 0, 0.1)"),
  // Roadmap horizontal (estaciones + texto blanco con drop-shadow, sin
  // tarjeta detrás del encabezado): el paisaje debe quedar tan visible como
  // en business/educational, que ya desactivan el velo para su roadmap.
  "gamified:roadmapBackground": "",
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
  "gamified:lessonBackground": "70% 45%",
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

  const overlay = variant
    ? (OVERLAY_POR_ASSET[`${variant}:${asset}`] ?? OVERLAY_POR_VARIANTE[variant as InterfaceVariant])
    : undefined;
  const posicion = variant ? POSICION_POR_ASSET[`${variant}:${asset}`] : undefined;

  return {
    "--interface-bg-image": `url("${url}")`,
    ...(overlay ? { "--interface-overlay": overlay } : {}),
    ...(posicion ? { "--interface-bg-position": posicion } : {}),
  } as CSSProperties;
}
