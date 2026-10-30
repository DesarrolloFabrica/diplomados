"use client";

import { useEffect, useRef } from "react";
import {
  Alignment,
  EventType,
  Fit,
  Layout,
  LoopType,
  useRive,
  type Event,
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
  /** Expone la instancia ya cargada sin recrear el canvas. */
  onReady?: (rive: InstanciaRive) => void;
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
   * Se llama con el nombre del Rive Event (si existe) o "" si no viene nombre.
   * Útil cuando una animación termina sin cambiar de estado en la State Machine.
   */
  onRiveEvent?: (nombre: string) => void;
  /**
   * Textos a inyectar en el View Model / text runs del .riv.
   * Clave = nombre de la propiedad string (o text run); valor = contenido.
   * Requiere que en el editor de Rive la propiedad esté enlazada al texto.
   */
  textos?: Record<string, string>;
  /**
   * Hover impulsado desde fuera (hitbox HTML separada del artboard).
   * Intenta boolean del View Model o input de la State Machine llamados hover.
   */
  hoverExterno?: boolean;
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
 * Escribe strings en el View Model (preferido) y también en text runs.
 * Si la propiedad VM existe pero no está enlazada al globo en el editor,
 * solo el text run cambia el texto visible.
 */
function aplicarTextosRive(rive: InstanciaRive, textos: Record<string, string>) {
  const vmi = rive.viewModelInstance;
  const riveConTextRun = rive as InstanciaRive & {
    setTextRunValue?: (name: string, textValue: string) => void;
    getTextRunValue?: (name: string) => string | undefined;
  };

  for (const [nombre, valor] of Object.entries(textos)) {
    const propiedad = vmi?.string?.(nombre);
    if (propiedad) {
      propiedad.value = valor;
    }

    // Siempre intentar el text run: cubre .riv sin binding o con binding roto.
    try {
      riveConTextRun.setTextRunValue?.(nombre, valor);
    } catch {
      // Nombre inexistente en este artboard: se ignora.
    }
  }
}

const NOMBRES_HOVER = ["hover", "Hover", "isHover", "isHovered", "hovered"] as const;

function aplicarHoverExterno(
  rive: InstanciaRive,
  stateMachineName: string | undefined,
  hover: boolean,
) {
  const vmi = rive.viewModelInstance;
  for (const nombre of NOMBRES_HOVER) {
    const propiedad = vmi?.boolean?.(nombre);
    if (propiedad) {
      propiedad.value = hover;
      return;
    }
  }

  if (!stateMachineName) return;
  const inputs = rive.stateMachineInputs(stateMachineName);
  if (!inputs) return;
  for (const input of inputs) {
    if (!/hover/i.test(input.name)) continue;
    if ("value" in input) {
      (input as { value: boolean | number }).value = hover;
      return;
    }
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
  onReady,
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
  onRiveEvent,
  textos,
  hoverExterno,
}: AnimacionRiveProps) {
  const stateMachineName =
    stateMachine ??
    (Array.isArray(stateMachines) ? stateMachines[0] : stateMachines);

  const onStateChangeRef = useRef(onStateChange);
  const onRiveEventRef = useRef(onRiveEvent);
  const textosRef = useRef(textos);
  const riveRef = useRef<InstanciaRive | null>(null);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);
  useEffect(() => {
    onRiveEventRef.current = onRiveEvent;
  }, [onRiveEvent]);
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
      riveRef.current = instance;
      instance.resizeDrawingSurfaceToCanvas();
      if (textosRef.current) {
        aplicarTextosRive(instance, textosRef.current);
      }
    },
    onStateChange: (event) => {
      // Reaplicar copy al cambiar de estado (p. ej. al abrir el globo).
      // Si la timeline keyframea el Text Value, esto no basta: hay que
      // quitar esos keyframes en el editor de Rive.
      const instancia = riveRef.current;
      if (instancia && textosRef.current) {
        aplicarTextosRive(instancia, textosRef.current);
      }
      onStateChangeRef.current?.(normalizarEstados(event.data));
    },
  });

  useEffect(() => {
    riveRef.current = rive ?? null;
  }, [rive]);

  useEffect(() => {
    if (rive) onReady?.(rive);
  }, [rive, onReady]);

  useEffect(() => {
    if (!rive || !textos) return;
    aplicarTextosRive(rive, textos);
  }, [rive, textos]);

  useEffect(() => {
    if (!rive || hoverExterno === undefined) return;
    aplicarHoverExterno(rive, stateMachineName, hoverExterno);
  }, [rive, hoverExterno, stateMachineName]);

  // Eventos / oneshot: cuando la animación del globo termina sin reportar
  // un StateChange a "Normal", el padre igual puede cerrar el overlay.
  useEffect(() => {
    if (!rive) return;

    const notificarEvento = (event: Event) => {
      const data = event.data;
      if (data && typeof data === "object" && "name" in data) {
        onRiveEventRef.current?.(String((data as { name: string }).name ?? ""));
        return;
      }
      onRiveEventRef.current?.("");
    };

    const onLoop = (event: Event) => {
      const data = event.data;
      if (!data || typeof data !== "object" || !("type" in data)) return;
      const loop = data as { type: string; animation?: string };
      if (loop.type !== LoopType.OneShot && loop.type !== "oneshot") return;
      const animacion = (loop.animation ?? "").toLowerCase();
      // Solo al terminar salida del globo (no la entrada).
      if (!animacion.includes("salir") && !animacion.includes("salida")) return;
      onStateChangeRef.current?.(["Normal"]);
    };

    rive.on(EventType.RiveEvent, notificarEvento);
    rive.on(EventType.Loop, onLoop);
    return () => {
      rive.off(EventType.RiveEvent, notificarEvento);
      rive.off(EventType.Loop, onLoop);
    };
  }, [rive]);

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
