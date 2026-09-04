"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReproductorPodcast } from "@/components/shared/reproductor-podcast";
import {
  candidatosRecursoDrive,
  extraerMetaGoogleDrive,
  urlVerDrive,
  type CandidatoRecursoDrive,
  type ModoRecursoDrive,
} from "@/lib/images/google-drive";
import type { TipoRecurso } from "@backend/lib/db/schema";

interface DriveRecursoEmbedProps {
  nombre: string;
  tipo: TipoRecurso;
  url: string;
  className?: string;
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
      return cn(MARCO_VISOR, "relative h-[min(80vh,900px)] min-h-[480px] bg-muted");
    case "video":
      return cn(MARCO_VISOR, "relative aspect-video bg-black");
    case "audio":
      return "w-full";
    case "imagen":
      return cn(
        MARCO_VISOR,
        "relative flex min-h-[min(50vh,520px)] max-h-[85vh] w-full items-center justify-center bg-muted/40 p-2",
      );
    default: {
      const _exhaustivo: never = modo;
      return _exhaustivo;
    }
  }
}

function DriveIframe({ src, titulo }: { src: string; titulo: string }) {
  return (
    <iframe
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

const TIMEOUT_CARGA_MEDIA_MS = 18_000;

function DriveVideo({
  src,
  titulo,
  onFallo,
}: {
  src: string;
  titulo: string;
  onFallo: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let resuelto = false;
    const marcarFallo = () => {
      if (resuelto) return;
      resuelto = true;
      onFallo();
    };

    const timeout = window.setTimeout(marcarFallo, TIMEOUT_CARGA_MEDIA_MS);
    const onListo = () => {
      resuelto = true;
      window.clearTimeout(timeout);
    };

    video.addEventListener("loadeddata", onListo);
    video.addEventListener("canplay", onListo);

    return () => {
      window.clearTimeout(timeout);
      video.removeEventListener("loadeddata", onListo);
      video.removeEventListener("canplay", onListo);
    };
  }, [src, onFallo]);

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      ref={videoRef}
      controls
      playsInline
      preload="metadata"
      src={src}
      title={titulo}
      className="absolute inset-0 h-full w-full bg-black"
      onError={onFallo}
    />
  );
}

export function DriveRecursoEmbed({ nombre, tipo, url, className }: DriveRecursoEmbedProps) {
  const candidatos = useMemo(() => candidatosRecursoDrive(url, tipo), [url, tipo]);
  const enlaceDrive = useMemo(() => {
    const meta = extraerMetaGoogleDrive(url);
    return meta ? urlVerDrive(meta) : url;
  }, [url]);

  const [indiceCandidato, setIndiceCandidato] = useState(0);
  const [agotado, setAgotado] = useState(false);

  useEffect(() => {
    setIndiceCandidato(0);
    setAgotado(false);
  }, [url, tipo]);

  const candidatoActual: CandidatoRecursoDrive | undefined = candidatos[indiceCandidato];

  function avanzarCandidato() {
    setIndiceCandidato((actual) => {
      const siguiente = actual + 1;
      if (siguiente >= candidatos.length) {
        setAgotado(true);
        return actual;
      }
      return siguiente;
    });
  }

  const modoActual = candidatoActual?.modo ?? "iframe";
  const contenedorClase = cn(clasesContenedorVisor(tipo, modoActual), className);

  function renderContenido() {
    if (!candidatoActual || agotado) {
      const esVideoOAudio = tipo === "video" || tipo === "audio";
      return (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {esVideoOAudio
              ? "No se pudo cargar el video en este dispositivo. Suele ocurrir en equipos con poca memoria, navegadores con cookies de terceros bloqueadas o formatos no soportados. Ábrelo en Google Drive para verlo allí."
              : "No se pudo reproducir el contenido embebido. Ábrelo directamente en Google Drive."}
          </p>
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
      );
    }

    switch (candidatoActual.modo) {
      case "iframe":
        return (
          <DriveIframe
            key={`${indiceCandidato}-${candidatoActual.url}`}
            src={candidatoActual.url}
            titulo={nombre}
          />
        );
      case "video":
        return (
          <DriveVideo
            key={`${indiceCandidato}-${candidatoActual.url}`}
            src={candidatoActual.url}
            titulo={nombre}
            onFallo={avanzarCandidato}
          />
        );
      case "audio":
        return (
          <ReproductorPodcast
            key={`${indiceCandidato}-${candidatoActual.url}`}
            nombre={nombre}
            url={candidatoActual.url}
            onFallo={avanzarCandidato}
          />
        );
      case "imagen":
        return (
          <DriveImagen
            key={`${indiceCandidato}-${candidatoActual.url}`}
            src={candidatoActual.url}
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

  const usaMarcoExterno = modoActual !== "audio" || agotado || !candidatoActual;

  return (
    <div className="space-y-2">
      {modoActual !== "audio" ? (
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
