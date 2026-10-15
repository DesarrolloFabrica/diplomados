"use client";

import {
  Alignment,
  Fit,
  Layout,
  useRive,
} from "@rive-app/react-canvas";
import { cn } from "@/lib/utils";

interface AnimacionRiveProps {
  src: string;
  /** Nombre del artboard en el archivo .riv (opcional). */
  artboard?: string;
  /**
   * Nombre exacto de la State Machine en el editor de Rive.
   * Ejemplo: "State Machine 1"
   */
  stateMachines?: string | string[];
  autoplay?: boolean;
  /**
   * Cómo escala el artboard dentro del canvas:
   * - cover: llena todo el contenedor (puede recortar)
   * - contain: cabe completo sin recortar (puede dejar márgenes)
   * - fill: estira al tamaño del contenedor
   */
  fit?: "cover" | "contain" | "fill" | "fitWidth" | "fitHeight" | "none" | "scaleDown";
  className?: string;
  /** Etiqueta accesible para lectores de pantalla. */
  ariaLabel?: string;
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

/**
 * Contenedor genérico para animaciones Rive (.riv).
 * Debe usarse solo en Client Components; Rive depende de canvas en el navegador.
 *
 * Para que sea interactivo, pasa `stateMachines` con el nombre exacto
 * definido en el archivo .riv (p. ej. "State Machine 1").
 */
export function AnimacionRive({
  src,
  artboard,
  stateMachines,
  autoplay = true,
  fit = "contain",
  className,
  ariaLabel = "Animación",
}: AnimacionRiveProps) {
  const { RiveComponent } = useRive({
    src,
    artboard,
    stateMachines,
    autoplay,
    layout: new Layout({
      fit: FIT_MAP[fit],
      alignment: Alignment.Center,
    }),
  });

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("relative overflow-hidden", className)}
    >
      {/* El canvas debe recibir pointer events para inputs de la State Machine */}
      <RiveComponent className="size-full touch-none" />
    </div>
  );
}
