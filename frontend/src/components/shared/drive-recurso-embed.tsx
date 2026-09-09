"use client";

import { useEffect, useMemo, useRef, useState, type IframeHTMLAttributes } from "react";
import { ExternalLink, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReproductorPodcastDrive } from "@/components/shared/reproductor-podcast";
import { ResumePromptOverlay } from "@/components/shared/resume-prompt-overlay";
import {
  useMediaRangeTracking,
  type MediaConsumptionReporter,
} from "@/hooks/use-auto-completion";
import { claveReanudacion, usePlaybackResume } from "@/hooks/use-playback-resume";
import {
  candidatosRecursoDrive,
  extraerMetaGoogleDrive,
  urlVerDrive,
  type CandidatoRecursoDrive,
  type ModoRecursoDrive,
} from "@/lib/images/google-drive";
import type { TipoRecurso } from "@backend/lib/db/schema";

interface DriveRecursoEmbedProps {
  resourceId: string;
  nombre: string;
  tipo: TipoRecurso;
  url: string;
  className?: string;
  autoCompletionEnabled?: boolean;
  onConsumptionProgress?: MediaConsumptionReporter;
  enrollmentId?: string;
  lessonId?: string;
}

const MARCO_VISOR =
  "lesson-media w-full overflow-hidden rounded-2xl border border-border/70 shadow-[0_8px_30px_rgba(6,17,32,0.06)] ring-1 ring-emerald-500/10";

/** Alturas explícitas: h-full en iframe exige altura definida en el padre. */
function clasesContenedorVisor(tipo: TipoRecurso, modo: ModoRecursoDrive): string {
  switch (modo) {
    case "iframe":
      if (tipo === "audio") {
        return cn(MARCO_VISOR, "relative h-[min(40vh,400px)] min-h-[280px] bg-muted");
      }
      return cn(
        MARCO_VISOR,
        "relative h-[58dvh] min-h-[360px] max-h-[720px] bg-muted sm:h-[64dvh] sm:min-h-[460px] lg:h-[70dvh]",
      );
    case "video":
      return cn(MARCO_VISOR, "relative aspect-video bg-black");
    case "audio":
      return "w-full";
    case "imagen":
      return cn(
        MARCO_VISOR,
        "relative flex min-h-[min(42vh,440px)] max-h-[68vh] w-full items-center justify-center bg-muted/40 p-2",
      );
    default: {
      const _exhaustivo: never = modo;
      return _exhaustivo;
    }
  }
}

/**
 * `credentialless` evita que el iframe reenvíe las cookies de sesión de
 * Google del navegador del usuario. Una sesión de Google obsoleta o en
 * conflicto (multi-cuenta, token vencido) puede hacer que Drive falle al
 * cargar el video incluso abriendo el enlace directo fuera de esta app —
 * "borrar cookies" lo soluciona porque elimina esa sesión. Con
 * `credentialless` cada carga del iframe se comporta como una ventana de
 * incógnito automáticamente, sin que el usuario tenga que hacer nada.
 * Soportado en navegadores basados en Chromium; en el resto el atributo se
 * ignora sin efecto (no rompe nada, solo no aporta el beneficio).
 */
const IFRAME_SIN_CREDENCIALES = {
  credentialless: "",
} as unknown as IframeHTMLAttributes<HTMLIFrameElement>;

function DriveIframe({ src, titulo }: { src: string; titulo: string }) {
  return (
    <iframe
      {...IFRAME_SIN_CREDENCIALES}
      src={src}
      title={titulo}
      className="absolute inset-0 h-full w-full border-0"
      allow="autoplay; encrypted-media; fullscreen"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}

function DriveImagen({
  src,
  alt,
  onFallo,
}: {
  src: string;
  alt: string;
  onFallo: () => void;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      decoding="async"
      referrerPolicy="no-referrer"
      className="max-h-[calc(85vh-2rem)] w-full object-contain"
      onError={onFallo}
    />
  );
}

const TIMEOUT_CARGA_MEDIA_MS = 45_000;

function DriveVideo({
  resourceId,
  src,
  titulo,
  onFallo,
  autoCompletionEnabled,
  onConsumptionProgress,
  enrollmentId,
  lessonId,
}: {
  resourceId: string;
  src: string;
  titulo: string;
  onFallo: () => void;
  autoCompletionEnabled: boolean;
  onConsumptionProgress?: MediaConsumptionReporter;
  enrollmentId?: string;
  lessonId?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cargando, setCargando] = useState(true);

  useMediaRangeTracking(
    videoRef,
    resourceId,
    autoCompletionEnabled,
    onConsumptionProgress,
  );
  const resume = usePlaybackResume(
    videoRef,
    enrollmentId && lessonId ? claveReanudacion(enrollmentId, lessonId, resourceId) : null,
    Boolean(enrollmentId && lessonId),
  );

  useEffect(() => {
    setCargando(true);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let resuelto = false;
    const marcarFallo = () => {
      if (resuelto) return;
      resuelto = true;
      setCargando(false);
      onFallo();
    };

    const marcarListo = () => {
      if (resuelto) return;
      resuelto = true;
      window.clearTimeout(timeout);
      setCargando(false);
    };

    const timeout = window.setTimeout(() => {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        marcarListo();
        return;
      }
      marcarFallo();
    }, TIMEOUT_CARGA_MEDIA_MS);

    video.addEventListener("loadeddata", marcarListo);
    video.addEventListener("canplay", marcarListo);

    return () => {
      window.clearTimeout(timeout);
      video.removeEventListener("loadeddata", marcarListo);
      video.removeEventListener("canplay", marcarListo);
    };
  }, [src, onFallo]);

  return (
    <>
      {cargando ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 text-sm text-white/80">
          Cargando video…
        </div>
      ) : null}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        src={src}
        title={titulo}
        className="absolute inset-0 h-full w-full bg-black"
        onError={() => {
          setCargando(false);
          onFallo();
        }}
      />
      {resume.posicionPendiente !== null ? (
        <ResumePromptOverlay
          segundos={resume.posicionPendiente}
          onContinuar={resume.continuar}
          onDescartar={resume.descartar}
        />
      ) : null}
    </>
  );
}

export function DriveRecursoEmbed({
  resourceId,
  nombre,
  tipo,
  url,
  className,
  autoCompletionEnabled = false,
  onConsumptionProgress,
  enrollmentId,
  lessonId,
}: DriveRecursoEmbedProps) {
  const candidatos = useMemo(() => candidatosRecursoDrive(url, tipo), [url, tipo]);
  const enlaceDrive = useMemo(() => {
    const meta = extraerMetaGoogleDrive(url);
    return meta ? urlVerDrive(meta) : url;
  }, [url]);

  const [indiceCandidato, setIndiceCandidato] = useState(0);
  const [agotado, setAgotado] = useState(false);
  const [intentoManual, setIntentoManual] = useState(0);
  const avanzandoRef = useRef(false);

  useEffect(() => {
    setIndiceCandidato(0);
    setAgotado(false);
    setIntentoManual(0);
    avanzandoRef.current = false;
  }, [url, tipo]);

  useEffect(() => {
    avanzandoRef.current = false;
  }, [indiceCandidato]);

  const candidatoActual: CandidatoRecursoDrive | undefined = candidatos[indiceCandidato];

  function avanzarCandidato() {
    if (avanzandoRef.current) return;
    avanzandoRef.current = true;

    setIndiceCandidato((actual) => {
      const siguiente = actual + 1;
      if (siguiente >= candidatos.length) {
        setAgotado(true);
        return actual;
      }
      return siguiente;
    });
  }

  // Reintento manual: vuelve al primer candidato y fuerza un remount con una
  // URL distinta (evita servir una respuesta ya cacheada por el navegador),
  // igual que "borrar cookies y volver a intentar" pero sin que el usuario
  // tenga que hacerlo a mano.
  function reintentarManualmente() {
    avanzandoRef.current = false;
    setAgotado(false);
    setIndiceCandidato(0);
    setIntentoManual((actual) => actual + 1);
  }

  function conCacheBust(src: string): string {
    if (!intentoManual) return src;
    const separador = src.includes("?") ? "&" : "?";
    return `${src}${separador}cb=${intentoManual}`;
  }

  const modoActual = candidatoActual?.modo ?? "iframe";
  const contenedorClase = cn(clasesContenedorVisor(tipo, modoActual), className);

  function renderContenido() {
    if (!candidatoActual || agotado) {
      if (tipo === "audio") {
        return (
          <ReproductorPodcastDrive
            resourceId={resourceId}
            nombre={nombre}
            url={url}
            autoCompletionEnabled={autoCompletionEnabled}
            onConsumptionProgress={onConsumptionProgress}
            enrollmentId={enrollmentId}
            lessonId={lessonId}
          />
        );
      }

      const esVideo = tipo === "video";
      return (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {esVideo
              ? "No se pudo reproducir el video aquí. Puedes verlo directamente en Google Drive."
              : "No se pudo reproducir el contenido embebido. Ábrelo directamente en Google Drive."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={reintentarManualmente}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-700 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reintentar
            </button>
            <a
              href={enlaceDrive}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir en Google Drive
            </a>
          </div>
        </div>
      );
    }

    switch (candidatoActual.modo) {
      case "iframe":
        return (
          <DriveIframe
            key={`${indiceCandidato}-${intentoManual}-${candidatoActual.url}`}
            src={conCacheBust(candidatoActual.url)}
            titulo={nombre}
          />
        );
      case "video":
        return (
          <DriveVideo
            key={`${indiceCandidato}-${intentoManual}-${candidatoActual.url}`}
            resourceId={resourceId}
            src={conCacheBust(candidatoActual.url)}
            titulo={nombre}
            onFallo={avanzarCandidato}
            autoCompletionEnabled={autoCompletionEnabled}
            onConsumptionProgress={onConsumptionProgress}
            enrollmentId={enrollmentId}
            lessonId={lessonId}
          />
        );
      case "audio":
        return (
          <ReproductorPodcastDrive
            key={`${intentoManual}-${url}`}
            resourceId={resourceId}
            nombre={nombre}
            url={url}
            autoCompletionEnabled={autoCompletionEnabled}
            onConsumptionProgress={onConsumptionProgress}
            enrollmentId={enrollmentId}
            lessonId={lessonId}
          />
        );
      case "imagen":
        return (
          <DriveImagen
            key={`${indiceCandidato}-${intentoManual}-${candidatoActual.url}`}
            src={conCacheBust(candidatoActual.url)}
            alt={nombre}
            onFallo={avanzarCandidato}
          />
        );
      default: {
        const _exhaustivo: never = candidatoActual.modo;
        return _exhaustivo;
      }
    }
  }

  const usaMarcoExterno =
    (modoActual !== "audio" || agotado || !candidatoActual) && tipo !== "audio";

  return (
    <div className="space-y-2">
      {modoActual !== "audio" && tipo !== "video" ? (
        <p className="text-sm font-medium text-foreground">{nombre}</p>
      ) : null}

      {usaMarcoExterno ? (
        <div className={contenedorClase}>{renderContenido()}</div>
      ) : (
        renderContenido()
      )}

      {!agotado &&
      (candidatoActual?.modo === "iframe" ||
        candidatoActual?.modo === "video" ||
        candidatoActual?.modo === "audio") ? (
        <p className="text-center text-xs text-muted-foreground">
          Si no se reproduce o tarda mucho,{" "}
          <button
            type="button"
            onClick={reintentarManualmente}
            className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            vuelve a intentarlo
          </button>{" "}
          o{" "}
          <a
            href={enlaceDrive}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            abre el archivo en Google Drive
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
