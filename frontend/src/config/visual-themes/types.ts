import type { EscuelaVisual } from "@backend/config/escuelas";

export type SchoolVisualId = EscuelaVisual;

export type SchoolEnvironment =
  | "territory"
  | "creative"
  | "technical"
  | "wellness"
  | "strategic"
  | "neutral";

export type SchoolAtmosphere =
  | "day"
  | "sunset"
  | "night"
  | "morning"
  | "golden-hour"
  | "soft-day";

export type SchoolParticlePreset =
  | "birds"
  | "color-fragments"
  | "data"
  | "leaves"
  | "connections"
  | "soft-points";

export type SchoolStationSet =
  | "civic"
  | "creative"
  | "technology"
  | "organic"
  | "business"
  | "neutral";

export type SchoolVisualTheme = {
  id: SchoolVisualId;
  label: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    surface: string;
  };
  environment: SchoolEnvironment;
  defaultAtmosphere: SchoolAtmosphere;
  particlePreset: SchoolParticlePreset;
  stationSet: SchoolStationSet;
};
