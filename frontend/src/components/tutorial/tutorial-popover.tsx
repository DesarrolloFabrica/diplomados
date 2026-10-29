"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TUTORIAL_LAYERS } from "./tutorial-config";
import type { TutorialPlacement, TutorialTargetRect } from "./tutorial-types";

export type TutorialPopoverAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

interface TutorialPopoverProps {
  title: string;
  description: string;
  primaryAction?: TutorialPopoverAction;
  secondaryAction?: TutorialPopoverAction;
  dismissAction?: TutorialPopoverAction;
  onClose: () => void;
  eyebrow?: string;
  targetRect?: TutorialTargetRect | null;
  placement?: TutorialPlacement;
  variant?: "step" | "assistant";
}

function getPopoverStyle(
  targetRect: TutorialTargetRect | null,
  placement: TutorialPlacement,
): CSSProperties {
  const viewportWidth = typeof window === "undefined" ? 1024 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 768 : window.innerHeight;

  if (!targetRect || placement === "center") {
    return { bottom: 16, left: "50%", transform: "translateX(-50%)" };
  }

  if (viewportWidth < 640) {
    const mobilePosition = { left: "50%", transform: "translateX(-50%)" };
    const estimatedPopoverHeight = 220;

    if (placement === "top" && targetRect.top >= estimatedPopoverHeight) {
      return {
        ...mobilePosition,
        bottom: viewportHeight - targetRect.top + 12,
      };
    }
    if (
      placement === "bottom" &&
      viewportHeight - targetRect.bottom >= estimatedPopoverHeight
    ) {
      return { ...mobilePosition, top: targetRect.bottom + 12 };
    }

    return { ...mobilePosition, bottom: 16 };
  }

  const gap = 16;
  const width = Math.min(360, viewportWidth - 32);
  const centeredLeft = Math.max(
    16,
    Math.min(
      targetRect.left + targetRect.width / 2 - width / 2,
      viewportWidth - width - 16,
    ),
  );

  if (placement === "top") {
    return { bottom: viewportHeight - targetRect.top + gap, left: centeredLeft };
  }
  if (placement === "left") {
    return {
      left: Math.max(16, targetRect.left - width - gap),
      top: Math.max(16, targetRect.top),
    };
  }
  if (placement === "right") {
    return {
      left: Math.min(viewportWidth - width - 16, targetRect.right + gap),
      top: Math.max(16, targetRect.top),
    };
  }

  return { left: centeredLeft, top: targetRect.bottom + gap };
}

export function TutorialPopover({
  title,
  description,
  primaryAction,
  secondaryAction,
  dismissAction,
  onClose,
  eyebrow,
  targetRect = null,
  placement = "center",
  variant = "step",
}: TutorialPopoverProps) {
  const reactId = useId();
  const titleId = `tutorial-title-${reactId}`;
  const descriptionId = `tutorial-description-${reactId}`;
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, [title]);

  return (
    <section
      ref={dialogRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      className={cn(
        "pointer-events-auto fixed max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-[var(--interface-border,rgba(203,213,225,0.9))] bg-[var(--interface-surface-strong,rgba(255,255,255,0.96))] p-5 text-[var(--interface-text,#0f172a)] shadow-[0_24px_70px_rgba(2,8,20,0.34)] backdrop-blur-xl focus:outline-none",
        variant === "assistant"
          ? "bottom-48 left-4 right-4 w-auto sm:bottom-56 sm:left-auto sm:right-6 sm:w-[360px] lg:bottom-44 lg:right-8"
          : "w-[min(360px,calc(100vw-2rem))]",
      )}
      style={{
        ...(variant === "step" ? getPopoverStyle(targetRect, placement) : undefined),
        zIndex: TUTORIAL_LAYERS.popover,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar tutorial"
        className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-[var(--interface-text-muted,#64748b)] transition-colors hover:bg-black/5 hover:text-[var(--interface-text,#0f172a)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent,#059669)]"
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      {eyebrow ? (
        <p className="pr-9 text-xs font-bold uppercase tracking-[0.14em] text-[var(--interface-accent,#047857)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 id={titleId} className="mt-2 pr-8 text-lg font-bold">
        {title}
      </h2>
      <p
        id={descriptionId}
        className="mt-2 text-sm leading-6 text-[var(--interface-text-muted,#475569)]"
      >
        {description}
      </p>

      {primaryAction || secondaryAction || dismissAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          {dismissAction ? (
            <button
              type="button"
              onClick={dismissAction.onClick}
              disabled={dismissAction.disabled}
              className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--interface-text-muted,#475569)] transition-colors hover:bg-black/5 hover:text-[var(--interface-text,#0f172a)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent,#059669)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {dismissAction.label}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {secondaryAction ? (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
                className="rounded-full border border-[var(--interface-border,#cbd5e1)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent,#059669)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {secondaryAction.label}
              </button>
            ) : null}
            {primaryAction ? (
              <button
                type="button"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className="rounded-full bg-[var(--interface-accent,#065f46)] px-4 py-2 text-sm font-semibold text-[var(--interface-accent-foreground,#fff)] transition-[filter,transform] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent,#059669)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
              >
                {primaryAction.label}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {variant === "assistant" ? (
        <span
          aria-hidden="true"
          className="absolute bottom-[-7px] right-12 hidden size-3.5 rotate-45 border-b border-r border-[var(--interface-border,rgba(203,213,225,0.9))] bg-[var(--interface-surface-strong,rgba(255,255,255,0.96))] sm:block"
        />
      ) : null}
    </section>
  );
}
