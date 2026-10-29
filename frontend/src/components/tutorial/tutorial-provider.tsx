"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getTutorialSteps, getTutorialTargetSelector } from "./tutorial-config";
import { TutorialOverlay } from "./tutorial-overlay";
import type {
  TutorialContextValue,
  TutorialSection,
  TutorialStep,
  TutorialTargetRect,
} from "./tutorial-types";

const TutorialContext = createContext<TutorialContextValue | null>(null);

function toTargetRect(rect: DOMRect): TutorialTargetRect {
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function isFormControl(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("button, a, input, select, textarea, [contenteditable='true']"))
  );
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<TutorialSection | null>(null);
  const [steps, setSteps] = useState<readonly TutorialStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TutorialTargetRect | null>(null);

  const currentStep = steps[currentStepIndex] ?? null;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = steps.length > 0 && currentStepIndex === steps.length - 1;

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
    setTargetRect(null);
  }, []);

  const startTutorial = useCallback((section: TutorialSection) => {
    const sectionSteps = getTutorialSteps(section);
    setActiveSection(section);
    setSteps(sectionSteps);
    setCurrentStepIndex(0);
    setTargetRect(null);
    setIsOpen(sectionSteps.length > 0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      closeTutorial();
      return;
    }

    setCurrentStepIndex((index) => index + 1);
  }, [closeTutorial, currentStepIndex, steps.length]);

  const previousStep = useCallback(() => {
    setCurrentStepIndex((index) => Math.max(0, index - 1));
  }, []);

  useEffect(() => {
    if (!isOpen || !currentStep) return undefined;

    let cancelled = false;
    let settleTimer: number | undefined;
    let target: HTMLElement | null = null;

    const updateTargetRect = () => {
      if (!cancelled && target?.isConnected) {
        setTargetRect(toTargetRect(target.getBoundingClientRect()));
      }
    };

    const prepareStep = () => {
      if (cancelled) return;

      if (!currentStep.target) {
        setTargetRect(null);
        return;
      }

      target = document.querySelector<HTMLElement>(
        getTutorialTargetSelector(currentStep.target),
      );

      // En todas las interfaces un target ausente es seguro: se omite sin error.
      if (!target) {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((index) => index + 1);
        } else {
          closeTutorial();
        }
        return;
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center",
        inline: "nearest",
      });
      updateTargetRect();
      settleTimer = window.setTimeout(updateTargetRect, reducedMotion ? 0 : 350);
      window.addEventListener("resize", updateTargetRect);
      window.addEventListener("scroll", updateTargetRect, { passive: true });
    };

    const frame = window.requestAnimationFrame(prepareStep);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect);
    };
  }, [closeTutorial, currentStep, currentStepIndex, isOpen, steps.length]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeTutorial();
      } else if (event.key === "Enter" && !isFormControl(event.target)) {
        event.preventDefault();
        nextStep();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeTutorial, isOpen, nextStep]);

  const value = useMemo<TutorialContextValue>(
    () => ({
      isOpen,
      activeSection,
      currentStepIndex,
      steps,
      currentStep,
      targetRect,
      isFirstStep,
      isLastStep,
      startTutorial,
      nextStep,
      previousStep,
      closeTutorial,
    }),
    [
      activeSection,
      closeTutorial,
      currentStep,
      currentStepIndex,
      isFirstStep,
      isLastStep,
      isOpen,
      nextStep,
      previousStep,
      startTutorial,
      steps,
      targetRect,
    ],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
      {isOpen && currentStep && (
        <TutorialOverlay
          step={currentStep}
          currentStepIndex={currentStepIndex}
          totalSteps={steps.length}
          targetRect={targetRect}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onPrevious={previousStep}
          onNext={nextStep}
          onClose={closeTutorial}
        />
      )}
    </TutorialContext.Provider>
  );
}

export function useTutorial(): TutorialContextValue {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial debe usarse dentro de TutorialProvider.");
  }
  return context;
}
