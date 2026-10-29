import type { TutorialSection, TutorialStep } from "./tutorial-types";

/**
 * Convención compartida por las cuatro interfaces. Los componentes equivalentes
 * deben exponer el mismo valor de `data-tutorial`.
 */
export const TUTORIAL_TARGETS = {
  dashboardHero: "dashboard-hero",
  catalogFilters: "catalog-filters",
  courseCatalog: "course-catalog",
  mainNavigation: "main-navigation",
  courseCard: "course-card",
  roadmap: "roadmap",
  lessonPlayer: "lesson-player",
  lessonResources: "lesson-resources",
  courseOutline: "course-outline",
} as const;

/** Capas compartidas para evitar z-index arbitrarios entre piezas del tutorial. */
export const TUTORIAL_LAYERS = {
  avatar: 60,
  overlay: 70,
  popover: 80,
} as const;

/** Beta lineal exclusiva del Dashboard; las demás secciones siguen inactivas. */
export const TUTORIAL_STEPS_BY_SECTION = {
  dashboard: [
    {
      id: "dashboard-welcome",
      section: "dashboard",
      target: TUTORIAL_TARGETS.dashboardHero,
      title: "Tu espacio de aprendizaje",
      description:
        "Desde aquí puedes continuar tus cursos y consultar rápidamente tu progreso.",
      placement: "bottom",
    },
    {
      id: "dashboard-filters",
      section: "dashboard",
      target: TUTORIAL_TARGETS.catalogFilters,
      title: "Explora tus cursos",
      description:
        "Utiliza estos filtros para consultar tus cursos, nuevos diplomados, recomendaciones y categorías.",
      placement: "bottom",
    },
    {
      id: "dashboard-catalog",
      section: "dashboard",
      target: TUTORIAL_TARGETS.courseCatalog,
      title: "Selecciona un curso",
      description:
        "Aquí encontrarás los cursos disponibles. Puedes abrir uno para consultar su información o continuar aprendiendo.",
      placement: "top",
    },
    {
      id: "dashboard-navigation",
      section: "dashboard",
      target: TUTORIAL_TARGETS.mainNavigation,
      title: "Muévete por la plataforma",
      description:
        "Utiliza esta navegación para volver al inicio, consultar tus cursos y acceder a las demás secciones disponibles.",
      placement: "top",
    },
  ],
  "course-detail": [],
  roadmap: [],
  lesson: [],
  quiz: [],
  profile: [],
} satisfies Record<TutorialSection, readonly TutorialStep[]>;

export function getTutorialSteps(section: TutorialSection): readonly TutorialStep[] {
  return TUTORIAL_STEPS_BY_SECTION[section];
}

export function hasTutorialSteps(section: TutorialSection): boolean {
  return getTutorialSteps(section).length > 0;
}

/**
 * Traduce rutas del colaborador a la seccion que podria ofrecer un tutorial.
 * No inicia recorridos ni presupone que existan pasos configurados.
 */
export function resolveTutorialSection(pathname: string | null): TutorialSection | null {
  if (!pathname) return null;
  if (pathname === "/home" || pathname === "/mis-cursos") return "dashboard";
  if (/^\/mis-cursos\/perfil(?:\/|$)/.test(pathname)) return "profile";
  if (/^\/mis-cursos\/[^/]+\/lecciones\/[^/]+(?:\/|$)/.test(pathname)) {
    return "lesson";
  }
  if (/^\/mis-cursos\/[^/]+\/evaluaciones\/[^/]+(?:\/|$)/.test(pathname)) {
    return "quiz";
  }
  if (/^\/mis-cursos\/[^/]+\/informacion(?:\/|$)/.test(pathname)) {
    return "course-detail";
  }
  if (/^\/mis-cursos\/[^/]+\/?$/.test(pathname)) return "roadmap";
  return null;
}

export function getTutorialTargetSelector(target: string): string {
  const escaped = target.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return `[data-tutorial="${escaped}"]`;
}
