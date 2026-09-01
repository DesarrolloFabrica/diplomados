/**
 * Configuración del roadmap inmersivo (estándar para todos los diplomados).
 *
 * Los fondos actuales se reutilizan como ambiente por defecto mientras se crean
 * assets específicos por curso. Para personalizar un diplomado, registrar su
 * `cursoId` en `ROADMAP_CONFIG_POR_CURSO` con `backgrounds`, `finalModuleBackground`,
 * `defaultBackground`, `anchors` o `worldZones` sin tocar `RutaAprendizaje`.
 */

/** Anclas del mundo inmersivo; reservado para overrides por curso. */
export type WorldAnchorId =
  | "startPlatform"
  | "flowerPlatform"
  | "officePlatform"
  | "upperMonument"
  | "finalMonument";

/** Fallback genérico cuando no hay fondo definido para un índice de módulo. */
export const DEFAULT_ROADMAP_BACKGROUND =
  "/images/roadmap_asset/ambiente-modulo.jpeg";

/** Primer módulo: video de ambiente (misma secuencia visual existente). */
export const DEFAULT_MODULE_BACKGROUND =
  "/images/roadmap_asset/ambiente_modulo-video.mp4";

const DEFAULT_MODULE_BACKGROUNDS: readonly string[] = [
  DEFAULT_MODULE_BACKGROUND,
  "/images/roadmap_asset/Desert_landscape_with_dunes_and_202608281557.jpeg",
  "/images/roadmap_asset/desert_landscape_glowing_202608281557.jpeg",
  "/images/roadmap_asset/Rain_falling_in_desert_landscape_202608281557.jpeg",
];

const DEFAULT_FINAL_MODULE_BACKGROUND = "/images/roadmap_asset/Final_peak.mp4";

/** Hotspots decorativos del mundo; reservado para overrides por curso. */
export interface RoadmapWorldZoneConfig {
  id: string;
  x: number;
  y: number;
  label: string;
  effect?: string;
}

export interface RoadmapInmersivoCursoConfig {
  backgrounds?: readonly string[];
  finalModuleBackground?: string;
  defaultBackground?: string;
  anchors?: Partial<Record<WorldAnchorId, { x?: number; y?: number; label?: string }>>;
  worldZones?: readonly RoadmapWorldZoneConfig[];
}

const ROADMAP_CONFIG_POR_CURSO: Record<string, RoadmapInmersivoCursoConfig> = {
  // Ejemplo futuro:
  // "uuid-del-curso": {
  //   backgrounds: ["/images/roadmap_asset/mi-curso-modulo-1.mp4", ...],
  //   finalModuleBackground: "/images/roadmap_asset/mi-curso-final.mp4",
  // },
};

export function obtenerConfigRoadmapInmersivo(
  cursoId?: string,
): RoadmapInmersivoCursoConfig {
  if (!cursoId) return {};
  return ROADMAP_CONFIG_POR_CURSO[cursoId] ?? {};
}

export function obtenerFondoModuloInmersivo(
  indiceModulo: number,
  esUltimoModulo: boolean,
  cursoId?: string,
): string {
  const config = obtenerConfigRoadmapInmersivo(cursoId);
  const fallback = config.defaultBackground ?? DEFAULT_ROADMAP_BACKGROUND;

  if (esUltimoModulo) {
    return config.finalModuleBackground ?? DEFAULT_FINAL_MODULE_BACKGROUND;
  }

  const backgrounds = config.backgrounds ?? DEFAULT_MODULE_BACKGROUNDS;
  return backgrounds[indiceModulo] ?? fallback;
}
