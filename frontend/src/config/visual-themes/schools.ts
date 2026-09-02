import { ESCUELAS_VISUALES } from "@backend/config/escuelas";
import type { SchoolVisualId, SchoolVisualTheme } from "./types";

export const SCHOOL_VISUAL_THEMES = {
  sociales: {
    id: "sociales",
    label: "Ciencias Sociales, Juridicas y Gobierno",
    palette: {
      primary: "#365E68",
      secondary: "#74CFC4",
      accent: "#83E6D4",
      glow: "#77F2E4",
      surface: "#EAF4F1",
    },
    environment: "territory",
    defaultAtmosphere: "day",
    particlePreset: "birds",
    stationSet: "civic",
  },
  diseno: {
    id: "diseno",
    label: "Diseno y Comunicacion",
    palette: {
      primary: "#735F9D",
      secondary: "#E895B1",
      accent: "#85D7E5",
      glow: "#B6A4FF",
      surface: "#F5EFF8",
    },
    environment: "creative",
    defaultAtmosphere: "sunset",
    particlePreset: "color-fragments",
    stationSet: "creative",
  },
  ingenieria: {
    id: "ingenieria",
    label: "Ingenieria",
    palette: {
      primary: "#102C49",
      secondary: "#26BFD8",
      accent: "#58E4F7",
      glow: "#6AF2FF",
      surface: "#E9F5F8",
    },
    environment: "technical",
    defaultAtmosphere: "night",
    particlePreset: "data",
    stationSet: "technology",
  },
  salud: {
    id: "salud",
    label: "Salud y Bienestar",
    palette: {
      primary: "#38735A",
      secondary: "#74C9A5",
      accent: "#70D8C8",
      glow: "#9BF3D8",
      surface: "#EFF8F2",
    },
    environment: "wellness",
    defaultAtmosphere: "morning",
    particlePreset: "leaves",
    stationSet: "organic",
  },
  empresarial: {
    id: "empresarial",
    label: "Transformacion Empresarial",
    palette: {
      primary: "#132B42",
      secondary: "#2BAF9B",
      accent: "#D8A83B",
      glow: "#EACB72",
      surface: "#F2F3EE",
    },
    environment: "strategic",
    defaultAtmosphere: "golden-hour",
    particlePreset: "connections",
    stationSet: "business",
  },
  neutral: {
    id: "neutral",
    label: "Escuela sin clasificar",
    palette: {
      primary: "#061120",
      secondary: "#2FB9A5",
      accent: "#91DC00",
      glow: "#83E6D4",
      surface: "#F5F7FA",
    },
    environment: "neutral",
    defaultAtmosphere: "soft-day",
    particlePreset: "soft-points",
    stationSet: "neutral",
  },
} satisfies Record<SchoolVisualId, SchoolVisualTheme>;

export const DEFAULT_SCHOOL_VISUAL_THEME = SCHOOL_VISUAL_THEMES.neutral;

const SCHOOL_ALIASES: Record<string, SchoolVisualId> = {
  "ciencias sociales juridicas y gobierno": "sociales",
  "escuela ciencias sociales juridicas y gobierno": "sociales",
  "escuela de ciencias sociales juridicas y gobierno": "sociales",
  gobierno: "sociales",
  juridicas: "sociales",
  social: "sociales",
  sociales: "sociales",

  "diseno comunicacion": "diseno",
  "diseno y comunicacion": "diseno",
  "escuela de diseno comunicacion": "diseno",
  "escuela de diseno y comunicacion": "diseno",
  comunicacion: "diseno",
  diseno: "diseno",

  "escuela de ingenieria": "ingenieria",
  ingenieria: "ingenieria",

  "escuela salud bienestar": "salud",
  "escuela salud y bienestar": "salud",
  "escuela de salud bienestar": "salud",
  "escuela de salud y bienestar": "salud",
  bienestar: "salud",
  salud: "salud",

  "escuela transformacion empresarial": "empresarial",
  "escuela de transformacion empresarial": "empresarial",
  empresarial: "empresarial",
  transformacion: "empresarial",
  "transformacion empresarial": "empresarial",
};

function normalizeSchoolValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveSchoolVisualId(schoolName?: string | null): SchoolVisualId {
  if (!schoolName) return DEFAULT_SCHOOL_VISUAL_THEME.id;

  if ((ESCUELAS_VISUALES as readonly string[]).includes(schoolName)) {
    return schoolName as SchoolVisualId;
  }

  const normalized = normalizeSchoolValue(schoolName);
  if (!normalized) return DEFAULT_SCHOOL_VISUAL_THEME.id;

  return SCHOOL_ALIASES[normalized] ?? DEFAULT_SCHOOL_VISUAL_THEME.id;
}

export function getSchoolVisualTheme(schoolName?: string | null): SchoolVisualTheme {
  const schoolId = resolveSchoolVisualId(schoolName);
  return SCHOOL_VISUAL_THEMES[schoolId] ?? DEFAULT_SCHOOL_VISUAL_THEME;
}
