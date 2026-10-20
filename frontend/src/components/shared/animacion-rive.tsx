"use client";

import { useEffect, useRef } from "react";
import {
  Alignment,
  Fit,
  Layout,
  useRive,
} from "@rive-app/react-webgl2";
import { cn } from "@/lib/utils";

type FitKey =
  | "cover"
  | "contain"
  | "fill"
  | "fitWidth"
  | "fitHeight"
  | "none"
  | "scaleDown";

type AlignmentKey =
  | "center"
  | "topCenter"
  | "bottomCenter"
  | "centerLeft"
  | "centerRight"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight";

interface AnimacionRiveProps {
  src: string;
  /** Nombre del artboard en el archivo .riv (opcional; por defecto el primero). */
  artboard?: string;
  /**
   * Nombre exacto de la State Machine en el editor de Rive.
   * Preferir este prop (singular) frente a `stateMachines`.
   */
  stateMachine?: string;
  /**
   * @deprecated Usar `stateMachine`. Se mantiene por compatibilidad.
   */
  stateMachines?: string | string[];
  autoplay?: boolean;
  /**
   * Necesario si el .riv usa Data Binding / View Model
   * (propiedades como hover/click enlazadas a la State Machine).
   */
  autoBind?: boolean;
  fit?: FitKey;
  alignment?: AlignmentKey;
  className?: string;
  /** Etiqueta accesible para lectores de pantalla. */
  ariaLabel?: string;
  /**
   * Se llama cuando cambia el estado activo de la State Machine.
   * `states` son los nombres reportados por Rive (p. ej. "Normal").
   */
  onStateChange?: (states: string[]) => void;
}

const FIT_MAP = {
  cover: Fit.Cover,
  contain: Fit.Contain,
  fill: Fit.Fill,
  fitWidth: Fit.FitWidth,
  fitHeight: Fit.FitHeight,
  none: Fit.None,
  scaleDown: Fit.ScaleDown,
} as const;

const ALIGNMENT_MAP = {
  center: Alignment.Center,
  topCenter: Alignment.TopCenter,
  bottomCenter: Alignment.BottomCenter,
  centerLeft: Alignment.CenterLeft,
  centerRight: Alignment.CenterRight,
  topLeft: Alignment.TopLeft,
  topRight: Alignment.TopRight,
  bottomLeft: Alignment.BottomLeft,
  bottomRight: Alignment.BottomRight,
} as const;

function normalizarEstados(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data.filter((item): item is string => typeof item === "string");
  }
  if (typeof data === "string") return [data];
  return [];
}

/**
 * Contenedor genérico para animaciones Rive (.riv) con renderer WebGL2.
 * Solo Client Components: depende de canvas/WebGL en el navegador.
 *
 * Para interacción (hover/click vía Listeners o Data Binding):
 * - `stateMachine` con el nombre exacto del editor
 * - `autoBind` si el archivo usa View Model
 * - el contenedor debe tener ancho y alto definidos (no height: auto vacío)
 */
export function AnimacionRive({
  src,
  artboard,
  stateMachine,
  stateMachines,
  autoplay = true,
  autoBind = true,
  fit = "contain",
  alignment = "center",
  className,
  ariaLabel = "Animación",
  onStateChange,
}: AnimacionRiveProps) {
  const stateMachineName =
    stateMachine ??
    (Array.isArray(stateMachines) ? stateMachines[0] : stateMachines);

  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  const { RiveComponent } = useRive({
    src,
    artboard,
    stateMachine: stateMachineName,
    autoplay,
    autoBind,
    shouldDisableRiveListeners: false,
    layout: new Layout({
      fit: FIT_MAP[fit],
      alignment: ALIGNMENT_MAP[alignment],
    }),
    onRiveReady: (instance) => {
      instance.resizeDrawingSurfaceToCanvas();
    },
    onStateChange: (event) => {
      onStateChangeRef.current?.(normalizarEstados(event.data));
    },
  });

  return (
    <div
      aria-label={ariaLabel}
      className={cn("relative size-full overflow-hidden", className)}
    >
      <RiveComponent
        className="block size-full max-h-full max-w-full touch-none"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
