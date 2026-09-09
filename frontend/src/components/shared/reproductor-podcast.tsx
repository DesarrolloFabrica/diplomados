"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type IframeHTMLAttributes,
} from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { candidatosRecursoDrive } from "@/lib/images/google-drive";
import {
  useMediaRangeTracking,
  type MediaConsumptionReporter,
} from "@/hooks/use-auto-completion";
import { claveReanudacion, usePlaybackResume } from "@/hooks/use-playback-resume";

interface ReproductorPodcastProps {
  nombre: string;
  url: string;
  onFallo?: () => void;
  resourceId?: string;
  autoCompletionEnabled?: boolean;
  onConsumptionProgress?: MediaConsumptionReporter;
  enrollmentId?: string;
  lessonId?: string;
}

function formatearTiempo(segundos: number) {
  if (!Number.isFinite(segundos) || segundos < 0) return "0:00";
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const BARRAS = [
  28, 48, 36, 62, 44, 72, 40, 58, 34, 66, 50, 78, 42, 60, 38, 70, 46, 64, 32, 56, 40, 68,
  52, 74, 36, 60, 44, 72, 48, 66, 38, 58, 42, 70, 50, 64,
];

const TIMEOUT_CARGA_MS = 45_000;

export function ReproductorPodcast({
  nombre,
  url,
  onFallo,
  resourceId,
  autoCompletionEnabled = false,
  onConsumptionProgress,
  enrollmentId,
  lessonId,
}: ReproductorPodcastProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pistaRef = useRef<HTMLDivElement | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [actual, setActual] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [listo, setListo] = useState(false);

  useMediaRangeTracking(
    audioRef,
    resourceId ?? url,
    autoCompletionEnabled,
    onConsumptionProgress,
  );
  const resume = usePlaybackResume(
    audioRef,
    enrollmentId && lessonId && resourceId
      ? claveReanudacion(enrollmentId, lessonId, resourceId)
      : null,
    Boolean(enrollmentId && lessonId && resourceId),
  );

  useEffect(() => {
    setCargando(true);
    setListo(false);
    setActual(0);
    setDuracion(0);
    setReproduciendo(false);
  }, [url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let resuelto = false;

    const marcarFallo = () => {
      if (resuelto) return;
      resuelto = true;
      window.clearTimeout(timeout);
      setCargando(false);
      setListo(false);
      onFallo?.();
    };

    const marcarListo = () => {
      if (resuelto) return;
      resuelto = true;
      window.clearTimeout(timeout);
      setCargando(false);
      setListo(true);
      setDuracion(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const timeout = window.setTimeout(() => {
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
        marcarListo();
        return;
      }
      marcarFallo();
    }, TIMEOUT_CARGA_MS);

    const onTime = () => setActual(audio.currentTime);
    const onMeta = () => {
      setDuracion(Number.isFinite(audio.duration) ? audio.duration : 0);
      marcarListo();
    };
    const onCanPlay = () => marcarListo();
    const onEnded = () => setReproduciendo(false);
    const onPlay = () => setReproduciendo(true);
    const onPause = () => setReproduciendo(false);
    const onError = () => marcarFallo();

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      window.clearTimeout(timeout);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [url, onFallo]);

  const seekDesdeClienteX = useCallback(
    (clientX: number) => {
      const audio = audioRef.current;
      const pista = pistaRef.current;
      if (!audio || !pista || !duracion || !listo) return;

      const rect = pista.getBoundingClientRect();
      if (rect.width <= 0) return;

      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const tiempo = ratio * duracion;
      audio.currentTime = tiempo;
      setActual(tiempo);
    },
    [duracion, listo],
  );

  function alternar() {
    const audio = audioRef.current;
    if (!audio || !listo) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  const progreso = duracion > 0 ? (actual / duracion) * 100 : 0;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{nombre}</p>

      <div
        className={cn(
          "lesson-podcast relative overflow-hidden rounded-2xl border border-emerald-300/40",
          "bg-gradient-to-br from-[#071f1d] via-[#0b3b35] to-[#061a18]",
          "px-5 py-9 shadow-[0_0_55px_rgba(16,185,129,0.28)] sm:px-8 sm:py-11",
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(45,212,191,0.16),transparent_55%)]"
        />

        {!cargando && resume.posicionPendiente !== null ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 text-center">
            <div className="w-full max-w-xs space-y-4 rounded-2xl border border-emerald-400/25 bg-[#0a2f2a] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.4)]">
              <p className="text-sm font-medium text-emerald-50">
                ¿Quieres continuar desde donde lo dejaste (
                {formatearTiempo(resume.posicionPendiente)})?
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={resume.continuar}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#06201c] transition-colors hover:bg-emerald-300"
                >
                  Sí, continuar
                </button>
                <button
                  type="button"
                  onClick={resume.descartar}
                  className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10"
                >
                  No, desde el inicio
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {cargando ? (
          <div className="relative z-20 flex flex-col items-center gap-4 py-2">
            <div className="flex h-20 w-full max-w-2xl items-end justify-center gap-[3px] sm:h-24 sm:gap-1">
              {BARRAS.map((alto, i) => (
                <span
                  key={i}
                  className="w-1 animate-pulse rounded-full bg-emerald-300/70 sm:w-1.5"
                  style={{
                    height: `${alto}%`,
                    animationDelay: `${(i % 8) * 90}ms`,
                    animationDuration: "1.1s",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-100/80">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
              Cargando audio…
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            "relative z-10 flex flex-col items-center gap-6",
            cargando && "pointer-events-none invisible absolute inset-0 opacity-0",
          )}
        >
          <div
            className={cn(
              "flex h-20 w-full max-w-2xl items-end justify-center gap-[3px] sm:h-24 sm:gap-1",
              listo && duracion > 0 && "cursor-pointer",
            )}
            onPointerDown={(event) => {
              if (!listo || !duracion) return;
              seekDesdeClienteX(event.clientX);
            }}
            onKeyDown={(event) => {
              if (!listo || !duracion) return;
              const paso = event.shiftKey ? 10 : 5;
              const audio = audioRef.current;
              if (!audio) return;
              if (event.key === "ArrowRight") {
                event.preventDefault();
                audio.currentTime = Math.min(duracion, audio.currentTime + paso);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                audio.currentTime = Math.max(0, audio.currentTime - paso);
              }
            }}
            role={listo && duracion > 0 ? "slider" : undefined}
            tabIndex={listo && duracion > 0 ? 0 : undefined}
            aria-label={listo && duracion > 0 ? "Posición en el audio" : undefined}
            aria-valuemin={0}
            aria-valuemax={duracion || 0}
            aria-valuenow={actual}
          >
            {BARRAS.map((alto, i) => {
              const activo = (i / BARRAS.length) * 100 <= progreso;
              return (
                <span
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-colors duration-300 sm:w-1.5",
                    activo
                      ? "bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.55)]"
                      : "bg-emerald-100/25",
                    reproduciendo && "animate-pulse",
                  )}
                  style={{
                    height: `${alto}%`,
                    animationDelay: `${(i % 8) * 80}ms`,
                  }}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={alternar}
            disabled={!listo}
            aria-label={reproduciendo ? "Pausar" : "Reproducir"}
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full",
              "bg-gradient-to-b from-emerald-300 to-teal-500 text-[#06201c]",
              "shadow-[0_0_0_8px_rgba(16,185,129,0.18),0_0_28px_rgba(52,211,153,0.45)]",
              "transition-transform hover:scale-105 active:scale-95",
              !listo && "cursor-not-allowed opacity-60",
            )}
          >
            {reproduciendo ? (
              <Pause className="h-7 w-7 fill-current" />
            ) : (
              <Play className="ml-0.5 h-7 w-7 fill-current" />
            )}
          </button>

          <div className="w-full max-w-2xl space-y-2">
            <div
              ref={pistaRef}
              role="slider"
              tabIndex={listo && duracion > 0 ? 0 : -1}
              aria-label="Barra de progreso del audio"
              aria-valuemin={0}
              aria-valuemax={duracion || 0}
              aria-valuenow={actual}
              aria-disabled={!listo || !duracion}
              className={cn(
                "group relative h-2 rounded-full bg-emerald-100/15",
                listo && duracion > 0 ? "cursor-pointer" : "cursor-default",
              )}
              onPointerDown={(event) => {
                if (!listo || !duracion) return;
                setArrastrando(true);
                event.currentTarget.setPointerCapture(event.pointerId);
                seekDesdeClienteX(event.clientX);
              }}
              onPointerMove={(event) => {
                if (!arrastrando || !listo || !duracion) return;
                seekDesdeClienteX(event.clientX);
              }}
              onPointerUp={(event) => {
                setArrastrando(false);
                event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onPointerCancel={() => {
                setArrastrando(false);
              }}
              onKeyDown={(event) => {
                if (!listo || !duracion) return;
                const audio = audioRef.current;
                if (!audio) return;
                const paso = event.shiftKey ? 10 : 5;
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  audio.currentTime = Math.min(duracion, audio.currentTime + paso);
                } else if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  audio.currentTime = Math.max(0, audio.currentTime - paso);
                }
              }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-emerald-300/80 transition-[width] duration-75"
                style={{ width: `${progreso}%` }}
              />
              <div
                className={cn(
                  "absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full",
                  "border-2 border-emerald-200 bg-emerald-300",
                  "shadow-[0_0_10px_rgba(110,231,183,0.55)]",
                  "opacity-0 transition-opacity group-hover:opacity-100",
                  arrastrando && "opacity-100",
                )}
                style={{ left: `calc(${progreso}% - 7px)` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-emerald-100/70">
              <span>{formatearTiempo(actual)}</span>
              <span>{formatearTiempo(duracion)}</span>
            </div>
          </div>
        </div>

        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
      </div>
    </div>
  );
}

const MARCO_PODCAST = cn(
  "lesson-podcast relative overflow-hidden rounded-2xl border border-emerald-500/20",
  "bg-gradient-to-br from-[#0a2f2a] via-[#0d3d36] to-[#082820]",
  "px-5 py-6 shadow-[0_0_40px_rgba(16,185,129,0.18)] sm:px-7 sm:py-7",
);

// Evita reenviar cookies de sesión de Google del navegador del usuario (ver
// misma nota en drive-recurso-embed.tsx): una sesión obsoleta/en conflicto
// puede romper la carga incluso fuera de esta app; con esto cada carga del
// iframe se comporta como incógnito automáticamente.
const IFRAME_SIN_CREDENCIALES = {
  credentialless: "",
} as unknown as IframeHTMLAttributes<HTMLIFrameElement>;

function PodcastIframeFallback({ nombre, src }: { nombre: string; src: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{nombre}</p>
      <div className={MARCO_PODCAST}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(45,212,191,0.16),transparent_55%)]"
        />
        <iframe
          {...IFRAME_SIN_CREDENCIALES}
          src={src}
          title={nombre}
          className="relative z-10 h-[min(36vh,320px)] min-h-[220px] w-full border-0"
          allow="autoplay; encrypted-media; fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}

interface ReproductorPodcastDriveProps {
  nombre: string;
  url: string;
  resourceId?: string;
  autoCompletionEnabled?: boolean;
  onConsumptionProgress?: MediaConsumptionReporter;
  enrollmentId?: string;
  lessonId?: string;
}

/** Reproductor de podcast para archivos en Google Drive con reintentos y fallback embebido. */
export function ReproductorPodcastDrive({
  nombre,
  url,
  resourceId,
  autoCompletionEnabled = false,
  onConsumptionProgress,
  enrollmentId,
  lessonId,
}: ReproductorPodcastDriveProps) {
  const candidatos = useMemo(
    () =>
      candidatosRecursoDrive(url, "audio").filter(
        (candidato) => candidato.modo === "audio" || candidato.modo === "iframe",
      ),
    [url],
  );
  const [indiceCandidato, setIndiceCandidato] = useState(0);

  useEffect(() => {
    setIndiceCandidato(0);
  }, [url]);

  const candidatoActual = candidatos[indiceCandidato] ?? candidatos[candidatos.length - 1];

  if (!candidatoActual) {
    return <PodcastIframeFallback nombre={nombre} src={url} />;
  }

  if (candidatoActual.modo === "iframe") {
    return <PodcastIframeFallback nombre={nombre} src={candidatoActual.url} />;
  }

  return (
    <ReproductorPodcast
      key={`${indiceCandidato}-${candidatoActual.url}`}
      resourceId={resourceId}
      nombre={nombre}
      url={candidatoActual.url}
      autoCompletionEnabled={autoCompletionEnabled}
      onConsumptionProgress={onConsumptionProgress}
      enrollmentId={enrollmentId}
      lessonId={lessonId}
      onFallo={() => {
        setIndiceCandidato((actual) => {
          const siguiente = actual + 1;
          return siguiente < candidatos.length ? siguiente : actual;
        });
      }}
    />
  );
}
