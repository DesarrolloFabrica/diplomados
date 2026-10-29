"use client";

import { TUTORIAL_LAYERS } from "./tutorial-config";
import { TutorialPopover } from "./tutorial-popover";
import type { TutorialStep, TutorialTargetRect } from "./tutorial-types";

interface TutorialOverlayProps {
  step: TutorialStep;
  currentStepIndex: number;
  totalSteps: number;
  targetRect: TutorialTargetRect | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}

export function TutorialOverlay({
  step,
  currentStepIndex,
  totalSteps,
  targetRect,
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
  onClose,
}: TutorialOverlayProps) {
  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: TUTORIAL_LAYERS.overlay }}
      data-tutorial-overlay="true"
    >
      {targetRect ? (
        <div
          aria-hidden="true"
          className="fixed rounded-xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(2,8,20,0.68),0_0_28px_rgba(255,255,255,0.38)] transition-[top,left,width,height] duration-200 motion-reduce:transition-none"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-slate-950/65" />
      )}

      <TutorialPopover
        title={step.title}
        description={step.description}
        eyebrow={`Paso ${currentStepIndex + 1} de ${totalSteps}`}
        targetRect={targetRect}
        placement={step.placement ?? (targetRect ? "bottom" : "center")}
        dismissAction={{ label: "Omitir", onClick: onClose }}
        secondaryAction={{
          label: "Anterior",
          onClick: onPrevious,
          disabled: isFirstStep,
        }}
        primaryAction={{
          label: isLastStep ? "Finalizar" : "Siguiente",
          onClick: onNext,
        }}
        onClose={onClose}
      />
    </div>
  );
}
