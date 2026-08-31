export const GERENCIA_SOCIAL_WORLD_BACKGROUND =
  "/images/roadmap_asset/ambiente_modulo-video.mp4";

/**
 * Fondo del mundo inmersivo por módulo (índice 0 → módulo 1, etc.). Solo
 * cubre los primeros módulos: el último módulo del diplomado usa siempre
 * `GERENCIA_SOCIAL_FONDO_MODULO_FINAL` sin importar cuántos módulos tenga.
 */
const GERENCIA_SOCIAL_FONDOS_POR_MODULO: readonly string[] = [
  GERENCIA_SOCIAL_WORLD_BACKGROUND,
  "/images/roadmap_asset/Desert_landscape_with_dunes_and_202608281557.jpeg",
  "/images/roadmap_asset/Desert_landscape_with_glowing_ri…_202608281557.jpeg",
  "/images/roadmap_asset/Rain_falling_in_desert_landscape_202608281557.jpeg",
];

const GERENCIA_SOCIAL_FONDO_MODULO_FINAL = "/images/roadmap_asset/Final_peak.jpeg";

export function obtenerFondoModuloInmersivo(
  indiceModulo: number,
  esUltimoModulo: boolean,
): string {
  if (esUltimoModulo) return GERENCIA_SOCIAL_FONDO_MODULO_FINAL;
  return GERENCIA_SOCIAL_FONDOS_POR_MODULO[indiceModulo] ?? GERENCIA_SOCIAL_WORLD_BACKGROUND;
}

const GERENCIA_SOCIAL_TITULO = "diplomado en gerencia social";

export const GERENCIA_SOCIAL_IMMERSIVE_COURSE_IDS = new Set<string>([
  // Agregar aqui el ID real del curso cuando se quiera fijar la activacion.
]);

export function normalizarTextoRoadmapInmersivo(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function usarRoadmapInmersivoExperimental({
  cursoId,
  titulo,
}: {
  cursoId: string;
  titulo: string;
}): boolean {
  return (
    GERENCIA_SOCIAL_IMMERSIVE_COURSE_IDS.has(cursoId) ||
    normalizarTextoRoadmapInmersivo(titulo) === GERENCIA_SOCIAL_TITULO
  );
}
