export const ESCUELAS_VISUALES = [
  "sociales",
  "diseno",
  "ingenieria",
  "salud",
  "empresarial",
  "neutral",
] as const;

export type EscuelaVisual = (typeof ESCUELAS_VISUALES)[number];

export const ESCUELA_VISUAL_DEFAULT: EscuelaVisual = "neutral";

export const ETIQUETAS_ESCUELA_VISUAL: Record<EscuelaVisual, string> = {
  sociales: "Ciencias Sociales, Jurídicas y Gobierno",
  diseno: "Diseño y Comunicación",
  ingenieria: "Ingeniería",
  salud: "Salud y Bienestar",
  empresarial: "Transformación Empresarial",
  neutral: "Escuela sin clasificar",
};
