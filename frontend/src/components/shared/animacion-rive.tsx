"use client";

import { useEffect, useRef } from "react";
import {
  Alignment,
  Fit,
  Layout,
  useRive,
} from "@rive-app/react-webgl2";
import { cn } from "@/lib/utils";

type InstanciaRive = NonNullable<ReturnType<typeof useRive>["rive"]>;

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
  /**
   * Textos a inyectar en el View Model / text runs del .riv.
   * Clave = nombre de la propiedad string (o text run); valor = contenido.
   * Requiere que en el editor de Rive la propiedad esté enlazada al texto.
   */
  textos?: Record<string, string>;
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
 * Escribe strings en el View Model (preferido) o, si no hay propiedad,
 * intenta `setTextRunValue` como respaldo en runtimes que aún lo expongan.
 */
function aplicarTextosRive(rive: InstanciaRive, textos: Record<string, string>) {
  const vmi = rive.viewModelInstance;

  for (const [nombre, valor] of Object.entries(textos)) {
    const propiedad = vmi?.string?.(nombre);
    if (propiedad) {
      propiedad.value = valor;
      continue;
    }

    const riveConTextRun = rive as InstanciaRive & {
      setTextRunValue?: (name: string, value: string) => void;
    };
    riveConTextRun.setTextRunValue?.(nombre, valor);
  }
}

/**
 * Contenedor genérico para animaciones Rive (.riv) con renderer WebGL2.
 * Solo Client Components: depende de canvas/WebGL en el navegador.
 *
 * Para interacción (hover/click vía Listeners o Data Binding):
 * - `stateMachine` con el nombre exacto del editor
 * - `autoBind` si el archivo usa View Model
 * - el contenedor debe tener ancho y alto definidos (no height: auto vacío)
 * - `textos` para cambiar copy enlazado a propiedades string del View Model
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
  textos,
}: AnimacionRiveProps) {
  const stateMachineName =
    stateMachine ??
    (Array.isArray(stateMachines) ? stateMachines[0] : stateMachines);

  const onStateChangeRef = useRef(onStateChange);
  const textosRef = useRef(textos);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);
  useEffect(() => {
    textosRef.current = textos;
  }, [textos]);

  const { rive, RiveComponent } = useRive({
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
      if (textosRef.current) {
        aplicarTextosRive(instance, textosRef.current);
      }
    },
    onStateChange: (event) => {
      onStateChangeRef.current?.(normalizarEstados(event.data));
    },
  });

  useEffect(() => {
    if (!rive || !textos) return;
    aplicarTextosRive(rive, textos);
  }, [rive, textos]);

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
