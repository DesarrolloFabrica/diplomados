"use client";

import { useRef } from "react";
import {
  Download,
  File,
  FileText,
  Image as ImageIcon,
  Link2,
  Music,
  Presentation,
  Video,
} from "lucide-react";
import { obtenerEmbedYoutube, esEnlaceGoogleDrive } from "@/lib/media";
import { DriveRecursoEmbed } from "@/components/shared/drive-recurso-embed";
import { ImagenRecurso } from "@/components/shared/imagen-recurso";
import { ReproductorPodcast } from "@/components/shared/reproductor-podcast";
import { ResumePromptOverlay } from "@/components/shared/resume-prompt-overlay";
import {
  useMediaRangeTracking,
  type MediaConsumptionReporter,
} from "@/hooks/use-auto-completion";
import { claveReanudacion, usePlaybackResume } from "@/hooks/use-playback-resume";
import type { TipoRecurso } from "@backend/lib/db/schema";

interface RecursoIncrustadoProps {
  resourceId: string;
  nombre: string;
  tipo: TipoRecurso;
  url: string | null;
  autoCompletionEnabled?: boolean;
  onConsumptionProgress?: MediaConsumptionReporter;
  enrollmentId?: string;
  lessonId?: string;
}

const ICONO_DESCARGA: Record<TipoRecurso, typeof FileText> = {
  pdf: FileText,
  video: Video,
  audio: Music,
  imagen: ImageIcon,
  presentacion: Presentation,
  enlace: Link2,
  archivo: File,
};

function VideoNativo({
  resourceId,
  nombre,
  url,
  autoCompletionEnabled,
  onConsumptionProgress,
  enrollmentId,
  lessonId,
}: {
  resourceId: string;
  nombre: string;
  url: string;
  autoCompletionEnabled: boolean;
  onConsumptionProgress?: MediaConsumptionReporter;
  enrollmentId?: string;
  lessonId?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
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

  return (
    <div className="relative h-full w-full">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        src={url}
        title={nombre}
        className="h-full w-full"
      />
      {resume.posicionPendiente !== null ? (
        <ResumePromptOverlay
          segundos={resume.posicionPendiente}
          onContinuar={resume.continuar}
          onDescartar={resume.descartar}
        />
      ) : null}
    </div>
  );
}

// Cada tipo de recurso se muestra en su formato nativo (reproductor de
// video/audio, imagen inline) en vez de una fila de tabla con un link
// "Abrir" genérico. Documentos y enlaces quedan como tarjeta con botón.
export function RecursoIncrustado({
  resourceId,
  nombre,
  tipo,
  url,
  autoCompletionEnabled = false,
  onConsumptionProgress,
  enrollmentId,
  lessonId,
}: RecursoIncrustadoProps) {
  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-600">
        {nombre} — no disponible
      </div>
    );
  }

  // Google Drive: proxy same-origin + cadena de fallback (resourcekey, cookies).
  if (esEnlaceGoogleDrive(url)) {
    return (
      <DriveRecursoEmbed
        resourceId={resourceId}
        nombre={nombre}
        tipo={tipo}
        url={url}
        autoCompletionEnabled={autoCompletionEnabled}
        onConsumptionProgress={onConsumptionProgress}
        enrollmentId={enrollmentId}
        lessonId={lessonId}
      />
    );
  }

  if (tipo === "video") {
    const embedYoutube = obtenerEmbedYoutube(url);
    return (
      <div className="lesson-media aspect-video w-full overflow-hidden rounded-2xl border border-border/70 bg-black shadow-[0_8px_30px_rgba(6,17,32,0.08)] ring-1 ring-emerald-500/15">
        {embedYoutube ? (
          // La API JS de YouTube no se carga aquí: sin `enablejsapi`, este
          // iframe no expone currentTime, así que no se puede reanudar el
          // segundo exacto. Solo se recuerda la pestaña/lección (ver
          // VistaContenidoLeccion).
          <iframe
            src={embedYoutube}
            title={nombre}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <VideoNativo
            resourceId={resourceId}
            nombre={nombre}
            url={url}
            autoCompletionEnabled={autoCompletionEnabled}
            onConsumptionProgress={onConsumptionProgress}
            enrollmentId={enrollmentId}
            lessonId={lessonId}
          />
        )}
      </div>
    );
  }

  if (tipo === "audio") {
    return (
      <ReproductorPodcast
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

  if (tipo === "imagen") {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-800">{nombre}</p>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm ring-1 ring-slate-100">
          <ImagenRecurso url={url} nombre={nombre} />
        </div>
      </div>
    );
  }

  if (tipo === "presentacion") {
    const Icono = ICONO_DESCARGA.presentacion;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-t-2xl border border-b-0 border-slate-200 bg-slate-100/80 px-4 py-2.5">
          <Icono className="h-4 w-4 text-emerald-700" />
          <span className="text-sm font-medium text-slate-800">{nombre}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-b-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-white"
        >
          <div className="flex items-center gap-2">
            <Icono className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600">Abrir presentación</span>
          </div>
          <Download className="h-4 w-4 text-slate-500" />
        </a>
      </div>
    );
  }

  const Icono = ICONO_DESCARGA[tipo];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-t-2xl border border-b-0 border-slate-200 bg-slate-100/80 px-4 py-2.5">
        <Icono className="h-4 w-4 text-emerald-700" />
        <span className="text-sm font-medium text-slate-800">{nombre}</span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded-b-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-white"
      >
        <div className="flex items-center gap-2">
          <Icono className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-600">Abrir documento</span>
        </div>
        <Download className="h-4 w-4 text-slate-500" />
      </a>
    </div>
  );
}
