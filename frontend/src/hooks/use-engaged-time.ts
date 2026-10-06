"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  AUTO_COMPLETION_THRESHOLD,
  MIN_DOCUMENT_REVIEW_SECONDS,
} from "@/hooks/use-auto-completion";
import type { TipoRecurso } from "@backend/lib/db/schema";

/**
 * Los iframes de Google Drive (y YouTube, InDesign) son de otro origen: el
 * navegador no deja leer su scroll, página actual ni currentTime. Por eso,
 * para esos recursos el completado automático se basa en "tiempo de
 * atención": segundos en que el recurso está visible en pantalla, la
 * pestaña está activa y el estudiante interactúa (con la página o dentro
 * del iframe). Los <video>/<audio> propios siguen usando el % real visto.
 */

/** Sin actividad en la página durante este tiempo, se deja de contar. */
const INACTIVIDAD_MS = 60_000;
/** Proporción mínima del recurso que debe estar en pantalla. */
const UMBRAL_VISIBLE = 0.5;

export const SEGUNDOS_REVISION_IFRAME = {
  imagen: MIN_DOCUMENT_REVIEW_SECONDS,
  presentacion: 45,
  documento: 60,
  interactivo: 60,
  /** Video/audio en iframe sin duración conocida de la lección. */
  multimediaSinDuracion: 120,
} as const;

/**
 * Segundos de atención exigidos para dar por revisado un recurso en iframe.
 * Para video/audio se usa la duración declarada de la lección (si existe)
 * con el mismo umbral que el seguimiento real de reproducción.
 */
export function segundosRevisionIframe(
  tipo: TipoRecurso,
  duracionSeg?: number | null,
): number {
  switch (tipo) {
    case "imagen":
      return SEGUNDOS_REVISION_IFRAME.imagen;
    case "presentacion":
      return SEGUNDOS_REVISION_IFRAME.presentacion;
    case "video":
    case "audio":
      return duracionSeg && duracionSeg > 0
        ? Math.ceil(duracionSeg * AUTO_COMPLETION_THRESHOLD)
        : SEGUNDOS_REVISION_IFRAME.multimediaSinDuracion;
    default:
      return SEGUNDOS_REVISION_IFRAME.documento;
  }
}

/** Segundos acumulados por recurso; sobrevive al cambio de pestaña de la lección. */
const segundosAcumulados = new Map<string, number>();

/**
 * Diagnóstico opcional para QA: en la consola del navegador ejecutar
 * `localStorage.setItem("debug:autocompletado", "1")` y recargar.
 */
function depuracionActiva(): boolean {
  try {
    return window.localStorage.getItem("debug:autocompletado") === "1";
  } catch {
    return false;
  }
}

interface UseEngagedTimeOptions {
  /** Identificador estable del recurso (p.ej. `${lessonId}:${resourceId}`). */
  clave: string;
  enabled: boolean;
  requiredSeconds: number;
  onReached?: () => void;
}

export function useEngagedTime(
  targetRef: RefObject<HTMLElement | null>,
  { clave, enabled, requiredSeconds, onReached }: UseEngagedTimeOptions,
) {
  const onReachedRef = useRef(onReached);
  onReachedRef.current = onReached;

  useEffect(() => {
    const target = targetRef.current;
    if (!enabled || !target || !onReachedRef.current) return undefined;
    const objetivo: HTMLElement = target;

    let visible = false;
    let ultimaActividad = performance.now();
    let enviado = false;

    function focoDentroDelRecurso() {
      const activo = document.activeElement;
      return activo instanceof HTMLIFrameElement && objetivo.contains(activo);
    }

    const observer = new IntersectionObserver(
      ([entrada]) => {
        visible = Boolean(entrada?.isIntersecting && entrada.intersectionRatio >= UMBRAL_VISIBLE);
      },
      { threshold: [0, UMBRAL_VISIBLE, 1] },
    );
    observer.observe(objetivo);

    const registrarActividad = () => {
      ultimaActividad = performance.now();
    };
    // Al hacer clic dentro del iframe, la ventana pierde el foco y el
    // iframe pasa a ser document.activeElement: se cuenta como interacción.
    const alPerderFoco = () => {
      window.setTimeout(() => {
        if (focoDentroDelRecurso()) registrarActividad();
      }, 0);
    };

    const eventos = ["pointermove", "pointerdown", "keydown", "wheel", "scroll", "touchstart"];
    for (const evento of eventos) {
      window.addEventListener(evento, registrarActividad, { passive: true });
    }
    window.addEventListener("blur", alPerderFoco);
    window.addEventListener("focus", registrarActividad);

    const depurar = depuracionActiva();

    const intervalo = window.setInterval(() => {
      if (enviado) return;
      const paginaActiva = document.visibilityState === "visible";
      const interactuando =
        focoDentroDelRecurso() || performance.now() - ultimaActividad < INACTIVIDAD_MS;
      if (!visible || !paginaActiva || !interactuando) {
        if (depurar) {
          console.debug("[autocompletado] pausado", {
            clave,
            visible,
            paginaActiva,
            interactuando,
            acumulado: segundosAcumulados.get(clave) ?? 0,
            requerido: requiredSeconds,
          });
        }
        return;
      }

      const total = (segundosAcumulados.get(clave) ?? 0) + 1;
      segundosAcumulados.set(clave, total);
      if (depurar) {
        console.debug(`[autocompletado] ${clave}: ${total}/${requiredSeconds} s`);
      }
      if (total >= requiredSeconds) {
        enviado = true;
        if (depurar) console.debug("[autocompletado] umbral alcanzado, marcando lección", { clave });
        onReachedRef.current?.();
      }
    }, 1000);

    return () => {
      observer.disconnect();
      window.clearInterval(intervalo);
      for (const evento of eventos) {
        window.removeEventListener(evento, registrarActividad);
      }
      window.removeEventListener("blur", alPerderFoco);
      window.removeEventListener("focus", registrarActividad);
    };
  }, [clave, enabled, requiredSeconds, targetRef]);
}
