"use client";

import { Component, type ReactNode } from "react";
import { HelperdAnimacion } from "@/components/shared/helperd-animacion";
import { cn } from "@/lib/utils";
import { TUTORIAL_LAYERS } from "./tutorial-config";
import type {
  TutorialAvatarPosition,
  TutorialTargetRect,
} from "./tutorial-types";

interface TutorialAvatarProps {
  avatarState?: string;
  position?: TutorialAvatarPosition;
  targetRect?: TutorialTargetRect | null;
  onActivate?: () => void;
  children?: ReactNode;
  className?: string;
  riveText?: string;
  ariaLabel?: string;
  interactive?: boolean;
  screenScale?: boolean;
}

const FIXED_POSITION_CLASSES: Record<
  Exclude<TutorialAvatarPosition, "target-right" | "target-left">,
  string
> = {
  "bottom-right": "bottom-24 right-4 sm:bottom-28 sm:right-6 lg:bottom-8 lg:right-8",
  "bottom-left": "bottom-24 left-4 sm:bottom-28 sm:left-6 lg:bottom-8 lg:left-8",
};

class TutorialAvatarErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Limite de integracion con Rive. El motor del tutorial no importa ni controla
 * Rive: este componente reutiliza HelperdAnimacion como representacion visual.
 * Si el renderer falla, el avatar se oculta y el overlay sigue operativo.
 */
export function TutorialAvatar({
  avatarState,
  position = "bottom-right",
  targetRect,
  onActivate,
  children,
  className,
  riveText,
  ariaLabel = "Abrir ayuda",
  interactive = true,
  screenScale = false,
}: TutorialAvatarProps) {
  const viewportWidth = typeof window === "undefined" ? 1024 : window.innerWidth;
  const avatarSize = viewportWidth >= 1024 ? 240 : viewportWidth >= 640 ? 176 : 128;
  const targetPosition =
    targetRect && (position === "target-right" || position === "target-left")
      ? {
          top: Math.max(12, targetRect.top + targetRect.height / 2),
          left:
            position === "target-right"
              ? Math.min(viewportWidth - avatarSize - 12, targetRect.right + 12)
              : Math.max(12, targetRect.left - avatarSize - 12),
          transform: "translateY(-50%)",
        }
      : undefined;

  if (screenScale && !children) {
    return (
      <TutorialAvatarErrorBoundary>
        <aside
          data-avatar-state={avatarState}
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: TUTORIAL_LAYERS.avatar }}
          aria-label="Guia del tutorial"
        >
          <button
            type="button"
            onClick={onActivate}
            className={cn(
              "absolute inset-0 size-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent,#10b981)] focus-visible:ring-inset",
              "[clip-path:inset(0_0_0_40%)] sm:[clip-path:inset(0_0_0_45%)] md:[clip-path:inset(0_4%_0_48%)] lg:[clip-path:inset(0_5%_0_50%)]",
              interactive ? "pointer-events-auto" : "pointer-events-none",
            )}
            aria-label={ariaLabel}
            aria-disabled={!interactive}
          >
            <HelperdAnimacion
              variante="seccion"
              texto={riveText}
              className="!fixed !inset-0 !h-dvh !w-screen"
            />
          </button>
        </aside>
      </TutorialAvatarErrorBoundary>
    );
  }

  return (
    <TutorialAvatarErrorBoundary>
      <aside
        data-avatar-state={avatarState}
        className={cn(
          "pointer-events-none fixed size-32 sm:size-44 lg:size-60",
          position === "bottom-right" || position === "bottom-left"
            ? FIXED_POSITION_CLASSES[position]
            : undefined,
          className,
        )}
        style={{ ...targetPosition, zIndex: TUTORIAL_LAYERS.avatar }}
        aria-label="Guia del tutorial"
      >
        <button
          type="button"
          onClick={onActivate}
          className={cn(
            "size-full rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent,#10b981)] focus-visible:ring-offset-2",
            interactive ? "pointer-events-auto cursor-pointer" : "pointer-events-none",
          )}
          aria-label={ariaLabel}
          aria-disabled={!interactive}
        >
          {children ?? (
            <HelperdAnimacion
              variante="seccion"
              texto={riveText}
              className="!h-full !w-full"
            />
          )}
        </button>
      </aside>
    </TutorialAvatarErrorBoundary>
  );
}
