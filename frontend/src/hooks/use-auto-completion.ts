"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import { marcarLeccionCompletada } from "@backend/server/actions/progreso";
import type { TabContenido } from "@/lib/contenido-leccion";

export const AUTO_COMPLETION_THRESHOLD = 0.85;
export const MIN_DOCUMENT_REVIEW_SECONDS = 8;
/**
 * Margen (s) sobre el avance que pudo reproducirse en tiempo real entre dos
 * lecturas de currentTime. Un avance mayor es un salto (adelantar/arrastrar)
 * y no cuenta como visto.
 */
const MEDIA_JUMP_TOLERANCE_SECONDS = 1.5;

/** Claves de los apartados que no son un recurso de la BD. */
export const CLAVE_TEXTO_LECCION = "texto-leccion";
export const CLAVE_INFOGRAFIA_INTERACTIVA = "infografia-interactiva";

/**
 * Apartados obligatorios: la lección no se completa sola hasta que todos sus
 * videos y audios lleguen al umbral, aunque el resto ya esté revisado.
 */
export const APARTADOS_OBLIGATORIOS: readonly TabContenido[] = ["video", "podcast"];

type ConsumptionRange = [start: number, end: number];

export interface MediaConsumptionSample {
  resourceId: string;
  start: number;
  end: number;
  duration: number;
  ended?: boolean;
}

export type MediaConsumptionReporter = (sample: MediaConsumptionSample) => void;

/** Un elemento medible de la lección (recurso, texto o infografía interactiva). */
export interface ElementoLeccion {
  clave: string;
  apartado: TabContenido;
}

export interface EstadoApartado {
  apartado: TabContenido;
  completo: boolean;
  obligatorio: boolean;
}

export interface ResumenApartados {
  apartados: EstadoApartado[];
  completos: number;
  /** Apartados completos necesarios para la mayoría (más de la mitad). */
  requeridos: number;
  obligatoriosCompletos: boolean;
  cumple: boolean;
}

/**
 * Regla de completado automático de la lección:
 * 1. Todos los apartados obligatorios presentes (video y audio) completos, y
 * 2. la mayoría (más de la mitad) de los apartados de la lección completos.
 * Un apartado está completo cuando todos sus elementos llegaron a su umbral.
 */
export function evaluarApartados(
  elementos: ElementoLeccion[],
  revisados: ReadonlySet<string>,
): ResumenApartados {
  const porApartado = new Map<TabContenido, ElementoLeccion[]>();
  for (const elemento of elementos) {
    const lista = porApartado.get(elemento.apartado) ?? [];
    lista.push(elemento);
    porApartado.set(elemento.apartado, lista);
  }

  const apartados: EstadoApartado[] = [...porApartado].map(([apartado, lista]) => ({
    apartado,
    completo: lista.every((elemento) => revisados.has(elemento.clave)),
    obligatorio: APARTADOS_OBLIGATORIOS.includes(apartado),
  }));

  const completos = apartados.filter((a) => a.completo).length;
  const requeridos = Math.floor(apartados.length / 2) + 1;
  const obligatoriosCompletos = apartados.every((a) => !a.obligatorio || a.completo);

  return {
    apartados,
    completos,
    requeridos,
    obligatoriosCompletos,
    cumple: apartados.length > 0 && obligatoriosCompletos && completos >= requeridos,
  };
}

export type AutoCompletionStatus =
  | "watching"
  | "saving"
  | "completed"
  | "error";

interface UseAutoCompletionOptions {
  enabled: boolean;
  alreadyCompleted: boolean;
  courseId: string;
  enrollmentId: string;
  lessonId: string;
  /** Elementos medibles de la lección; definen los apartados a revisar. */
  elementos: ElementoLeccion[];
}

interface MediaConsumptionState {
  duration: number;
  ranges: ConsumptionRange[];
}

function mergeRanges(ranges: ConsumptionRange[]): ConsumptionRange[] {
  if (ranges.length <= 1) return ranges;

  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: ConsumptionRange[] = [];

  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || range[0] > previous[1] + 0.25) {
      merged.push([...range]);
      continue;
    }
    previous[1] = Math.max(previous[1], range[1]);
  }

  return merged;
}

function coveredSeconds(ranges: ConsumptionRange[]): number {
  return ranges.reduce((total, [start, end]) => total + Math.max(0, end - start), 0);
}

function depuracionActiva(): boolean {
  try {
    return window.localStorage.getItem("debug:autocompletado") === "1";
  } catch {
    return false;
  }
}

/**
 * Avance por lección en el navegador del estudiante (elementos revisados y
 * apartados abiertos): sobrevive a recargas y a volver otro día a la lección.
 */
type RegistroLeccion = "elementos-revisados" | "apartados-abiertos";

function claveRegistro(registro: RegistroLeccion, enrollmentId: string, lessonId: string) {
  return `leccion:${registro}:v1:${enrollmentId}:${lessonId}`;
}

function leerRegistro(
  registro: RegistroLeccion,
  enrollmentId: string,
  lessonId: string,
): Set<string> {
  try {
    const valor = window.localStorage.getItem(claveRegistro(registro, enrollmentId, lessonId));
    const ids: unknown = valor ? JSON.parse(valor) : [];
    return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function guardarRegistro(
  registro: RegistroLeccion,
  enrollmentId: string,
  lessonId: string,
  valores: Set<string>,
) {
  try {
    window.localStorage.setItem(
      claveRegistro(registro, enrollmentId, lessonId),
      JSON.stringify([...valores]),
    );
  } catch {
    // Sin localStorage el avance solo dura mientras la página esté abierta.
  }
}

export function useAutoCompletion({
  enabled,
  alreadyCompleted,
  courseId,
  enrollmentId,
  lessonId,
  elementos,
}: UseAutoCompletionOptions) {
  const router = useRouter();
  const [status, setStatus] = useState<AutoCompletionStatus>(
    alreadyCompleted ? "completed" : "watching",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const [revisados, setRevisados] = useState<Set<string>>(() => new Set());
  const [abiertos, setAbiertos] = useState<Set<string>>(() => new Set());
  const completionTriggeredRef = useRef(alreadyCompleted);
  const mediaStateRef = useRef(new Map<string, MediaConsumptionState>());
  const lessonKey = `${courseId}:${enrollmentId}:${lessonId}`;
  const lessonKeyRef = useRef(lessonKey);

  useEffect(() => {
    if (lessonKeyRef.current !== lessonKey) {
      lessonKeyRef.current = lessonKey;
      mediaStateRef.current.clear();
      completionTriggeredRef.current = alreadyCompleted;
      setErrorMessage(null);
      setJustCompleted(false);
      setStatus(alreadyCompleted ? "completed" : "watching");
    } else if (alreadyCompleted) {
      completionTriggeredRef.current = true;
      setStatus("completed");
    }
    setRevisados(leerRegistro("elementos-revisados", enrollmentId, lessonId));
    setAbiertos(leerRegistro("apartados-abiertos", enrollmentId, lessonId));
  }, [alreadyCompleted, enrollmentId, lessonId, lessonKey]);

  useEffect(() => {
    if (!justCompleted) return undefined;
    const timeoutId = window.setTimeout(() => setJustCompleted(false), 800);
    return () => window.clearTimeout(timeoutId);
  }, [justCompleted]);

  const resumen = useMemo(() => evaluarApartados(elementos, revisados), [elementos, revisados]);

  /**
   * Respaldo manual: si el autocompletado falla, el botón "Marcar como
   * completada" aparece cuando el estudiante ya abrió TODOS los apartados de
   * la lección (y por tanto la mayoría). No exige haber llegado a los umbrales.
   */
  const respaldoManualDisponible =
    resumen.apartados.length > 0 &&
    resumen.apartados.every((a) => a.completo || abiertos.has(a.apartado));

  const registerApartadoAbierto = useCallback(
    (apartado: TabContenido) => {
      if (!enabled || alreadyCompleted) return;
      setAbiertos((actual) => {
        if (actual.has(apartado)) return actual;
        const siguiente = new Set(actual).add(apartado);
        guardarRegistro("apartados-abiertos", enrollmentId, lessonId, siguiente);
        if (depuracionActiva()) console.debug(`[autocompletado] apartado abierto: ${apartado}`);
        return siguiente;
      });
    },
    [alreadyCompleted, enabled, enrollmentId, lessonId],
  );

  const requestCompletion = useCallback(async () => {
    if (!enabled || alreadyCompleted || completionTriggeredRef.current) return;

    completionTriggeredRef.current = true;
    setStatus("saving");
    setErrorMessage(null);

    try {
      const result = await marcarLeccionCompletada(courseId, enrollmentId, lessonId);
      if (!result.ok) {
        setStatus("error");
        setErrorMessage(result.mensaje ?? "No se pudo guardar el progreso.");
        return;
      }

      setStatus("completed");
      setJustCompleted(true);
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("No se pudo guardar el progreso. Revisa tu conexion.");
    }
  }, [alreadyCompleted, courseId, enabled, enrollmentId, lessonId, router]);

  // La lección solo se marca cuando se cumple la regla de apartados.
  useEffect(() => {
    if (!enabled || alreadyCompleted || completionTriggeredRef.current) return;
    if (depuracionActiva()) {
      console.debug("[autocompletado] apartados", {
        detalle: resumen.apartados,
        completos: `${resumen.completos}/${resumen.apartados.length}`,
        requeridos: resumen.requeridos,
        obligatoriosCompletos: resumen.obligatoriosCompletos,
        cumple: resumen.cumple,
      });
    }
    if (resumen.cumple) void requestCompletion();
  }, [alreadyCompleted, enabled, requestCompletion, resumen]);

  const registerReviewed = useCallback(
    (clave: string) => {
      if (!enabled || alreadyCompleted) return;
      setRevisados((actual) => {
        if (actual.has(clave)) return actual;
        const siguiente = new Set(actual).add(clave);
        guardarRegistro("elementos-revisados", enrollmentId, lessonId, siguiente);
        if (depuracionActiva()) console.debug(`[autocompletado] elemento revisado: ${clave}`);
        return siguiente;
      });
    },
    [alreadyCompleted, enabled, enrollmentId, lessonId],
  );

  const registerMediaProgress = useCallback<MediaConsumptionReporter>(
    ({ resourceId, start, end, duration }) => {
      if (!enabled || alreadyCompleted || completionTriggeredRef.current) return;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const boundedStart = Math.max(0, Math.min(start, duration));
      const boundedEnd = Math.max(0, Math.min(end, duration));
      if (boundedEnd <= boundedStart) return;

      const previous = mediaStateRef.current.get(resourceId);
      const ranges = mergeRanges([
        ...(previous?.ranges ?? []),
        [boundedStart, boundedEnd],
      ]);
      mediaStateRef.current.set(resourceId, { duration, ranges });

      const proporcion = coveredSeconds(ranges) / duration;
      if (depuracionActiva()) {
        console.debug(
          `[autocompletado] ${resourceId}: ${(proporcion * 100).toFixed(1)}% visto ` +
            `(umbral ${AUTO_COMPLETION_THRESHOLD * 100}%)`,
        );
      }

      if (proporcion >= AUTO_COMPLETION_THRESHOLD) {
        registerReviewed(resourceId);
      }
    },
    [alreadyCompleted, enabled, registerReviewed],
  );

  const retry = useCallback(() => {
    if (status !== "error" || alreadyCompleted) return;
    completionTriggeredRef.current = false;
    void requestCompletion();
  }, [alreadyCompleted, requestCompletion, status]);

  return {
    status,
    errorMessage,
    justCompleted,
    resumen,
    respaldoManualDisponible,
    trackingEnabled: enabled && !alreadyCompleted && status === "watching",
    registerMediaProgress,
    registerReviewed,
    registerApartadoAbierto,
    retry,
  };
}

export function useMediaRangeTracking(
  mediaRef: RefObject<HTMLMediaElement | null>,
  resourceId: string,
  enabled: boolean,
  reportProgress?: MediaConsumptionReporter,
) {
  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !enabled || !reportProgress) return undefined;
    const trackedMedia: HTMLMediaElement = media;
    const reporter = reportProgress;

    let playing = !trackedMedia.paused;
    let seeking = false;
    let lastTime: number | null = playing ? trackedMedia.currentTime : null;
    // Reloj real del último punto registrado: permite saber cuánto video
    // pudo reproducirse de verdad entre dos lecturas de currentTime.
    let lastWallTime = performance.now();

    function marcarPunto(time: number | null) {
      lastTime = time;
      lastWallTime = performance.now();
    }

    function reportCurrentRange(ended = false) {
      const currentTime = trackedMedia.currentTime;
      const duration = trackedMedia.duration;
      if (
        !playing ||
        seeking ||
        // `media.seeking` es síncrono: cubre el caso en que el navegador
        // emite timeupdate/pause con la posición nueva ANTES del evento
        // "seeking" (el tramo saltado se contaría como visto).
        trackedMedia.seeking ||
        lastTime === null ||
        !Number.isFinite(currentTime) ||
        !Number.isFinite(duration)
      ) {
        return;
      }

      const avance = currentTime - lastTime;
      const segundosReales = (performance.now() - lastWallTime) / 1000;
      const rate = trackedMedia.playbackRate > 0 ? trackedMedia.playbackRate : 1;
      const avanceMaximo = segundosReales * rate + MEDIA_JUMP_TOLERANCE_SECONDS;

      if (avance > 0 && avance <= avanceMaximo) {
        reporter({
          resourceId,
          start: lastTime,
          end: currentTime,
          duration,
          ended,
        });
      } else if (avance > avanceMaximo && depuracionActiva()) {
        // Salto (adelantar/arrastrar la barra): no se cuenta como visto.
        console.debug(
          `[autocompletado] ${resourceId}: salto de ${lastTime.toFixed(1)}s a ` +
            `${currentTime.toFixed(1)}s ignorado (no visto)`,
        );
      }
      marcarPunto(currentTime);
    }

    function handlePlay() {
      playing = true;
      seeking = false;
      marcarPunto(trackedMedia.currentTime);
    }

    function handlePause() {
      reportCurrentRange();
      playing = false;
      lastTime = null;
    }

    function handleTimeUpdate() {
      reportCurrentRange();
    }

    function handleSeeking() {
      seeking = true;
      marcarPunto(null);
    }

    function handleSeeked() {
      seeking = false;
      playing = !trackedMedia.paused;
      marcarPunto(playing ? trackedMedia.currentTime : null);
    }

    // Tras un buffering la reproducción se reanuda desde aquí: el tiempo real
    // que pasó esperando datos no debe ampliar el avance permitido.
    function handlePlaying() {
      if (!playing || trackedMedia.seeking) return;
      marcarPunto(trackedMedia.currentTime);
    }

    function handleEnded() {
      reportCurrentRange(true);
      playing = false;
      lastTime = null;
    }

    trackedMedia.addEventListener("play", handlePlay);
    trackedMedia.addEventListener("pause", handlePause);
    trackedMedia.addEventListener("timeupdate", handleTimeUpdate);
    trackedMedia.addEventListener("seeking", handleSeeking);
    trackedMedia.addEventListener("seeked", handleSeeked);
    trackedMedia.addEventListener("playing", handlePlaying);
    trackedMedia.addEventListener("ended", handleEnded);

    return () => {
      trackedMedia.removeEventListener("play", handlePlay);
      trackedMedia.removeEventListener("pause", handlePause);
      trackedMedia.removeEventListener("timeupdate", handleTimeUpdate);
      trackedMedia.removeEventListener("seeking", handleSeeking);
      trackedMedia.removeEventListener("seeked", handleSeeked);
      trackedMedia.removeEventListener("playing", handlePlaying);
      trackedMedia.removeEventListener("ended", handleEnded);
    };
  }, [enabled, mediaRef, reportProgress, resourceId]);
}
