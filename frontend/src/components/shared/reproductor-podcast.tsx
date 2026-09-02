"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReproductorPodcastProps {
  nombre: string;
  url: string;
  onFallo?: () => void;
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

export function ReproductorPodcast({ nombre, url, onFallo }: ReproductorPodcastProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [actual, setActual] = useState(0);
  const [duracion, setDuracion] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setActual(audio.currentTime);
    const onMeta = () => setDuracion(audio.duration || 0);
    const onEnded = () => setReproduciendo(false);
    const onPlay = () => setReproduciendo(true);
    const onPause = () => setReproduciendo(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  function alternar() {
    const audio = audioRef.current;
    if (!audio) return;
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
          "lesson-podcast relative overflow-hidden rounded-2xl border border-emerald-500/20",
          "bg-gradient-to-br from-[#0a2f2a] via-[#0d3d36] to-[#082820]",
          "px-5 py-8 shadow-[0_0_40px_rgba(16,185,129,0.18)] sm:px-8 sm:py-10",
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(45,212,191,0.16),transparent_55%)]"
        />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="flex h-16 w-full max-w-xl items-end justify-center gap-[3px] sm:h-20 sm:gap-1">
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
            aria-label={reproduciendo ? "Pausar" : "Reproducir"}
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full",
              "bg-gradient-to-b from-emerald-300 to-teal-500 text-[#06201c]",
              "shadow-[0_0_0_8px_rgba(16,185,129,0.18),0_0_28px_rgba(52,211,153,0.45)]",
              "transition-transform hover:scale-105 active:scale-95",
            )}
          >
            {reproduciendo ? (
              <Pause className="h-7 w-7 fill-current" />
            ) : (
              <Play className="ml-0.5 h-7 w-7 fill-current" />
            )}
          </button>

          <div className="flex w-full max-w-xl items-center justify-between text-xs font-medium text-emerald-100/70">
            <span>{formatearTiempo(actual)}</span>
            <span>{formatearTiempo(duracion)}</span>
          </div>
        </div>

        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          className="hidden"
          onError={() => onFallo?.()}
        />
      </div>
    </div>
  );
}
