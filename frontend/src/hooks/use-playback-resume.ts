"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const PREFIJO_ALMACENAMIENTO = "leccion:resume:v1";
const INTERVALO_GUARDADO_MS = 5000;
const MARGEN_FIN_SEGUNDOS = 3;
const POSICION_MINIMA_SEGUNDOS = 5;

/**
 * Clave de reanudación: usuario + curso quedan codificados en `enrollmentId`
 * (única por inscripción, ver `uq_inscripcion` en el schema), y se completa
 * con la lección y el recurso puntual.
 */
export function claveReanudacion(
  enrollmentId: string,
  lessonId: string,
  resourceId: string,
): string {
  return `${PREFIJO_ALMACENAMIENTO}:${enrollmentId}:${lessonId}:${resourceId}`;
}

function leerPosicionGuardada(clave: string): number | null {
  try {
    const crudo = window.localStorage.getItem(clave);
    if (!crudo) return null;
    const valor = Number(crudo);
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

function guardarPosicion(clave: string, segundos: number) {
  try {
    window.localStorage.setItem(clave, String(segundos));
  } catch {
    // localStorage puede no estar disponible (modo privado, cuota agotada).
  }
}

function limpiarPosicion(clave: string) {
  try {
    window.localStorage.removeItem(clave);
  } catch {
    // ignorar
  }
}

/** Formatea segundos como m:ss o h:mm:ss, para mostrar en el aviso de reanudación. */
export function formatearSegundosResumen(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return "0:00";
  const totales = Math.floor(segundos);
  const horas = Math.floor(totales / 3600);
  const minutos = Math.floor((totales % 3600) / 60);
  const s = totales % 60;
  const ss = String(s).padStart(2, "0");
  if (horas > 0) {
    return `${horas}:${String(minutos).padStart(2, "0")}:${ss}`;
  }
  return `${minutos}:${ss}`;
}

export interface PlaybackResumeState {
  /** Segundos guardados pendientes de confirmar con el usuario, o null si no hay ninguno (o ya se resolvió). */
  posicionPendiente: number | null;
  /** El usuario eligió continuar: salta al segundo guardado. */
  continuar: () => void;
  /** El usuario eligió empezar de nuevo: descarta el aviso y borra la posición guardada. */
  descartar: () => void;
}

/**
 * Detecta si hay una posición guardada para un <video>/<audio> nativo y deja
 * que el usuario decida si continuar desde ahí o empezar de nuevo (en vez de
 * saltar en silencio). Persiste la posición actual periódicamente, y en
 * pause/ended/cambio de pestaña/antes de salir/desmontaje. Solo funciona
 * sobre elementos con `currentTime` controlable: no aplica a iframes
 * (YouTube sin `enablejsapi`, Drive-preview, Adobe InDesign).
 */
export function usePlaybackResume(
  mediaRef: RefObject<HTMLMediaElement | null>,
  storageKey: string | null,
  enabled: boolean,
): PlaybackResumeState {
  const [posicionPendiente, setPosicionPendiente] = useState<number | null>(null);
  const resueltoRef = useRef(false);
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;

  useEffect(() => {
    resueltoRef.current = false;
    setPosicionPendiente(null);

    const media = mediaRef.current;
    // TEMPORAL: diagnóstico. Quitar una vez confirmado el problema en
    // producción (ver DEBUGGING.md / conversación con el usuario).
    console.debug("[resume] efecto montado", { hayMedia: !!media, enabled, storageKey });
    if (!media || !enabled || !storageKey) return undefined;
    const trackedMedia: HTMLMediaElement = media;

    let ultimoGuardado = 0;

    function persistir(origen: string) {
      const actual = trackedMedia.currentTime;
      const duracion = trackedMedia.duration;
      if (!Number.isFinite(actual)) {
        console.debug("[resume] persistir: currentTime no finito, se ignora", { origen, actual });
        return;
      }

      if (Number.isFinite(duracion) && actual >= duracion - MARGEN_FIN_SEGUNDOS) {
        console.debug("[resume] persistir: cerca del final, se limpia", { origen, actual, duracion });
        limpiarPosicion(storageKey!);
        return;
      }

      // Un currentTime cercano a 0 no siempre significa que el usuario
      // reinició el video (puede ser una llamada temprana antes de que el
      // usuario decida, o un remount de desarrollo). Nunca se borra una
      // posición ya guardada por estar cerca de 0 — solo se deja de
      // sobrescribir.
      if (actual < POSICION_MINIMA_SEGUNDOS) {
        console.debug("[resume] persistir: currentTime aun muy bajo, no se guarda", { origen, actual });
        return;
      }

      console.debug("[resume] persistir: guardando", { origen, actual, storageKey });
      guardarPosicion(storageKey!, actual);
    }

    function detectarPendiente(origen: string) {
      if (resueltoRef.current) return;

      const duracion = trackedMedia.duration;
      // Con `preload="metadata"` algunos streams (sobre todo los que pasan
      // por el proxy de Drive, cuyo Content-Length puede llegar tarde o no
      // llegar) reportan `duration` NaN/Infinity en el primer evento y solo
      // obtienen un valor real un poco después via `durationchange`. No se
      // marca como resuelto hasta tener una duración utilizable o hasta que
      // el video ya pueda reproducirse (`canplay`), para no perder la
      // detección por una carrera con ese evento tardío.
      const duracionUtilizable = Number.isFinite(duracion) && duracion > 0;
      if (!duracionUtilizable && trackedMedia.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        console.debug("[resume] detectarPendiente: aun sin duracion/datos utilizables, se espera", {
          origen,
          duracion,
          readyState: trackedMedia.readyState,
        });
        return;
      }

      resueltoRef.current = true;

      const guardada = leerPosicionGuardada(storageKey!);
      console.debug("[resume] detectarPendiente: leido de localStorage", {
        origen,
        storageKey,
        guardada,
        duracion,
      });
      if (guardada === null) return;

      if (duracionUtilizable && guardada >= duracion - MARGEN_FIN_SEGUNDOS) {
        console.debug("[resume] detectarPendiente: guardada muy cerca del final, se limpia", {
          guardada,
          duracion,
        });
        limpiarPosicion(storageKey!);
        return;
      }

      console.debug("[resume] detectarPendiente: hay posicion pendiente", { guardada });
      setPosicionPendiente(guardada);
    }

    function handleTimeUpdate() {
      const ahora = Date.now();
      if (ahora - ultimoGuardado < INTERVALO_GUARDADO_MS) return;
      ultimoGuardado = ahora;
      persistir("timeupdate");
    }

    function handlePause() {
      persistir("pause");
    }

    function handleEnded() {
      console.debug("[resume] ended: se limpia la posicion");
      limpiarPosicion(storageKey!);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") persistir("visibilitychange");
    }

    function handleUnload() {
      persistir("unload");
    }

    const alDetectarLoadedmetadata = () => detectarPendiente("loadedmetadata");
    const alDetectarDurationchange = () => detectarPendiente("durationchange");
    const alDetectarCanplay = () => detectarPendiente("canplay");

    detectarPendiente("mount");

    trackedMedia.addEventListener("loadedmetadata", alDetectarLoadedmetadata);
    trackedMedia.addEventListener("durationchange", alDetectarDurationchange);
    trackedMedia.addEventListener("canplay", alDetectarCanplay);
    trackedMedia.addEventListener("timeupdate", handleTimeUpdate);
    trackedMedia.addEventListener("pause", handlePause);
    trackedMedia.addEventListener("ended", handleEnded);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      console.debug("[resume] efecto desmontado, persistiendo por ultima vez");
      persistir("cleanup");
      trackedMedia.removeEventListener("loadedmetadata", alDetectarLoadedmetadata);
      trackedMedia.removeEventListener("durationchange", alDetectarDurationchange);
      trackedMedia.removeEventListener("canplay", alDetectarCanplay);
      trackedMedia.removeEventListener("timeupdate", handleTimeUpdate);
      trackedMedia.removeEventListener("pause", handlePause);
      trackedMedia.removeEventListener("ended", handleEnded);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [enabled, mediaRef, storageKey]);

  const continuar = useCallback(() => {
    const media = mediaRef.current;
    const objetivo = posicionPendiente;
    if (media && objetivo !== null) {
      const aplicar = () => {
        try {
          media.currentTime = objetivo;
        } catch {
          // el navegador puede rechazar la asignación puntualmente
        }
      };
      if (media.readyState >= HTMLMediaElement.HAVE_METADATA) {
        aplicar();
      } else {
        media.addEventListener("loadedmetadata", aplicar, { once: true });
      }
    }
    setPosicionPendiente(null);
  }, [mediaRef, posicionPendiente]);

  const descartar = useCallback(() => {
    const clave = storageKeyRef.current;
    if (clave) limpiarPosicion(clave);
    setPosicionPendiente(null);
  }, []);

  return { posicionPendiente, continuar, descartar };
}
