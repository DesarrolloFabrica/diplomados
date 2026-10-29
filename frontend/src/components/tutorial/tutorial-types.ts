export type TutorialSection =
  | "dashboard"
  | "course-detail"
  | "roadmap"
  | "lesson"
  | "quiz"
  | "profile";

export type TutorialPlacement = "top" | "right" | "bottom" | "left" | "center";

export type TutorialAvatarPosition =
  | "bottom-right"
  | "bottom-left"
  | "target-right"
  | "target-left";

/**
 * `target` es el valor semántico de `data-tutorial`, no un selector CSS.
 * Ejemplo: target: "lesson-player" busca [data-tutorial="lesson-player"].
 */
export type TutorialStep = {
  id: string;
  section: TutorialSection;
  target?: string;
  title: string;
  description: string;
  placement?: TutorialPlacement;
  avatarState?: string;
  optional?: boolean;
};

export type TutorialTargetRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

export type TutorialContextValue = {
  isOpen: boolean;
  activeSection: TutorialSection | null;
  currentStepIndex: number;
  steps: readonly TutorialStep[];
  currentStep: TutorialStep | null;
  targetRect: TutorialTargetRect | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  startTutorial: (section: TutorialSection) => void;
  nextStep: () => void;
  previousStep: () => void;
  closeTutorial: () => void;
};
