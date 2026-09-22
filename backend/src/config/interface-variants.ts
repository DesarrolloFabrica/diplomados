export const INTERFACE_VARIANTS = [
  "creative",
  "business",
  "educational",
  "gamified",
] as const;

export type InterfaceVariant = (typeof INTERFACE_VARIANTS)[number];

export const DEFAULT_INTERFACE_VARIANT: InterfaceVariant = "creative";

export type InterfaceVariantDensity = "compact" | "balanced" | "spacious";

export type InterfaceVariantNavigationStyle =
  | "immersive"
  | "corporate"
  | "academic"
  | "game";

export type InterfaceVariantNavigationPosition = "bottom" | "top" | "side";
export type InterfaceVariantDashboardLayout = "immersive" | "executive" | "learning" | "mission";
export type InterfaceVariantHero = "cinematic" | "corporate" | "academic" | "quest";
export type InterfaceVariantCatalogCard = "visual" | "business" | "academic" | "game";
export type InterfaceVariantCatalogDensity = "comfortable" | "compact";
export type InterfaceVariantRoadmap = "world" | "structured" | "learning-path" | "level-map";
export type InterfaceVariantLesson = "immersive" | "focused" | "study" | "mission";
export type InterfaceVariantQuiz = "immersive" | "professional" | "academic" | "challenge";
export type InterfaceAssetKey =
  | "dashboardBackground"
  | "dashboardDecoration"
  | "heroBackground"
  | "roadmapBackground"
  | "lessonBackground"
  | "quizBackground"
  | "overlayTexture"
  | "decorativeAssetPrimary"
  | "decorativeAssetSecondary";

export type InterfaceVariantAssets = Partial<Record<InterfaceAssetKey, string>>;

export type InterfaceVariantConfig = {
  id: InterfaceVariant;
  label: string;
  description: string;
  intent: string;
  density: InterfaceVariantDensity;
  navigation: {
    style: InterfaceVariantNavigationStyle;
    position: InterfaceVariantNavigationPosition;
  };
  dashboard: {
    layout: InterfaceVariantDashboardLayout;
  };
  hero: {
    variant: InterfaceVariantHero;
  };
  catalog: {
    cardVariant: InterfaceVariantCatalogCard;
    density: InterfaceVariantCatalogDensity;
  };
  roadmap: {
    variant: InterfaceVariantRoadmap;
  };
  lesson: {
    variant: InterfaceVariantLesson;
  };
  quiz: {
    variant: InterfaceVariantQuiz;
  };
  assets?: InterfaceVariantAssets;
};

export const INTERFACE_VARIANT_CONFIG = {
  creative: {
    id: "creative",
    label: "Interfaz Creativa",
    description: "Experiencia inmersiva actual, con ambientes visuales y superficies glassmorphism.",
    intent: "visual storytelling, glass, ilustraciones, ambientes, formas organicas y mayor profundidad",
    density: "balanced",
    navigation: {
      style: "immersive",
      position: "bottom",
    },
    dashboard: {
      layout: "immersive",
    },
    hero: {
      variant: "cinematic",
    },
    catalog: {
      cardVariant: "visual",
      density: "comfortable",
    },
    roadmap: {
      variant: "world",
    },
    lesson: {
      variant: "immersive",
    },
    quiz: {
      variant: "immersive",
    },
    assets: {
      dashboardBackground: "/images/Dashboard_fondo.mp4",
      roadmapBackground: "/images/roadmap_asset/ambiente_modulo-video.mp4",
      lessonBackground: "/images/Fondo_reproductor.png",
      quizBackground: "/images/quiz.jpeg",
    },
  },
  business: {
    id: "business",
    label: "Interfaz Empresarial",
    description: "Base futura para una experiencia sobria, corporativa y estructurada.",
    intent: "corporativo, sobrio, estructurado, alta legibilidad, menor ornamentacion y cards compactas",
    density: "compact",
    navigation: {
      style: "corporate",
      position: "side",
    },
    dashboard: {
      layout: "executive",
    },
    hero: {
      variant: "corporate",
    },
    catalog: {
      cardVariant: "business",
      density: "compact",
    },
    roadmap: {
      variant: "structured",
    },
    lesson: {
      variant: "focused",
    },
    quiz: {
      variant: "professional",
    },
    // Assets reales asignados en Fase 9 (emp-dash.png / emp-quiz.png).
    assets: {
      dashboardBackground: "/images/emp-dash.png",
      roadmapBackground: "/images/emp-dash.png",
      lessonBackground: "/images/emp-quiz.png",
      quizBackground: "/images/emp-quiz.png",
    },
  },
  educational: {
    id: "educational",
    label: "Interfaz Educativa",
    description: "Base futura para claridad academica, contenido protagonista y estructura modular.",
    intent: "academico, claro, modular, contenido protagonista, jerarquia evidente y menor distraccion",
    density: "spacious",
    navigation: {
      style: "academic",
      position: "top",
    },
    dashboard: {
      layout: "learning",
    },
    hero: {
      variant: "academic",
    },
    catalog: {
      cardVariant: "academic",
      density: "comfortable",
    },
    roadmap: {
      variant: "learning-path",
    },
    lesson: {
      variant: "study",
    },
    quiz: {
      variant: "academic",
    },
    // Assets reales asignados en Fase 9 (edu-road.png / Edu-dash.png).
    assets: {
      roadmapBackground: "/images/edu-road.png",
      lessonBackground: "/images/Edu-dash.png",
      quizBackground: "/images/Edu-dash.png",
    },
  },
  gamified: {
    id: "gamified",
    label: "Interfaz Gamificada",
    description: "Base futura para progreso protagonista, niveles, logros y misiones.",
    intent: "niveles, misiones, progreso, logros, feedback, cards dinamicas y microinteraccion",
    density: "balanced",
    navigation: {
      style: "game",
      position: "bottom",
    },
    dashboard: {
      layout: "mission",
    },
    hero: {
      variant: "quest",
    },
    catalog: {
      cardVariant: "game",
      density: "comfortable",
    },
    roadmap: {
      variant: "level-map",
    },
    lesson: {
      variant: "mission",
    },
    quiz: {
      variant: "challenge",
    },
    // Assets reales asignados en Fase 9 (fondo-cursos.png / game-quiz.png).
    assets: {
      dashboardBackground: "/images/fondo-cursos.png",
      roadmapBackground: "/images/fondo-cursos.png",
      lessonBackground: "/images/game-quiz.png",
      quizBackground: "/images/game-quiz.png",
    },
  },
} as const satisfies Record<InterfaceVariant, InterfaceVariantConfig>;

export const INTERFACE_VARIANT_OPTIONS = INTERFACE_VARIANTS.map((variant) => ({
  value: variant,
  label: INTERFACE_VARIANT_CONFIG[variant].label,
  description: INTERFACE_VARIANT_CONFIG[variant].description,
})) as readonly {
  value: InterfaceVariant;
  label: string;
  description: string;
}[];

export function isInterfaceVariant(value: string | null | undefined): value is InterfaceVariant {
  return INTERFACE_VARIANTS.includes(value as InterfaceVariant);
}

export function resolveInterfaceVariant(
  variant?: string | null,
): InterfaceVariant {
  if (isInterfaceVariant(variant)) {
    return variant;
  }

  return DEFAULT_INTERFACE_VARIANT;
}

export function getInterfaceVariantConfig(
  variant?: string | null,
): InterfaceVariantConfig {
  return INTERFACE_VARIANT_CONFIG[resolveInterfaceVariant(variant)];
}

export function resolveInterfaceAsset({
  variant,
  asset,
  fallback,
}: {
  variant?: string | null;
  asset: InterfaceAssetKey;
  fallback?: string;
}): string | undefined {
  const config = getInterfaceVariantConfig(variant);
  return config.assets?.[asset] ?? fallback;
}
