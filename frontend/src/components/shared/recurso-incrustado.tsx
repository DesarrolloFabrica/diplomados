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
import type { TipoRecurso } from "@backend/lib/db/schema";

interface RecursoIncrustadoProps {
  nombre: string;
  tipo: TipoRecurso;
  url: string | null;
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

// Cada tipo de recurso se muestra en su formato nativo (reproductor de
// video/audio, imagen inline) en vez de una fila de tabla con un link
// "Abrir" genérico. Documentos y enlaces quedan como tarjeta con botón.
export function RecursoIncrustado({ nombre, tipo, url }: RecursoIncrustadoProps) {
  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-white/35 bg-white/10 p-4 text-sm text-white/70">
        {nombre} — no disponible
      </div>
    );
  }

  // Google Drive: proxy same-origin + cadena de fallback (resourcekey, cookies).
  if (esEnlaceGoogleDrive(url)) {
    return <DriveRecursoEmbed nombre={nombre} tipo={tipo} url={url} />;
  }

  if (tipo === "video") {
    const embedYoutube = obtenerEmbedYoutube(url);
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-white/90">{nombre}</p>
        <div className="lesson-media aspect-video w-full overflow-hidden rounded-2xl border border-border/70 bg-black shadow-[0_8px_30px_rgba(6,17,32,0.08)] ring-1 ring-emerald-500/15">
          {embedYoutube ? (
            <iframe
              src={embedYoutube}
              title={nombre}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video controls src={url} className="h-full w-full" />
          )}
        </div>
      </div>
    );
  }

  if (tipo === "audio") {
    return <ReproductorPodcast nombre={nombre} url={url} />;
  }

  if (tipo === "imagen") {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-white/90">{nombre}</p>
        <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/10 p-2 shadow-sm ring-1 ring-white/10">
          <ImagenRecurso url={url} nombre={nombre} />
        </div>
      </div>
    );
  }

  if (tipo === "presentacion") {
    const Icono = ICONO_DESCARGA.presentacion;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-t-2xl border border-b-0 border-white/30 bg-white/12 px-4 py-2.5">
          <Icono className="h-4 w-4 text-emerald-300" />
          <span className="text-sm font-medium text-white/90">{nombre}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-b-2xl border border-white/30 bg-white/10 p-4 shadow-sm transition-colors hover:border-white/45 hover:bg-white/18"
        >
          <div className="flex items-center gap-2">
            <Icono className="h-4 w-4 text-white/60" />
            <span className="text-sm text-white/75">Abrir presentación</span>
          </div>
          <Download className="h-4 w-4 text-white/60" />
        </a>
      </div>
    );
  }

  const Icono = ICONO_DESCARGA[tipo];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-t-2xl border border-b-0 border-white/30 bg-white/12 px-4 py-2.5">
        <Icono className="h-4 w-4 text-emerald-300" />
        <span className="text-sm font-medium text-white/90">{nombre}</span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded-b-2xl border border-white/30 bg-white/10 p-4 shadow-sm transition-colors hover:border-white/45 hover:bg-white/18"
      >
        <div className="flex items-center gap-2">
          <Icono className="h-4 w-4 text-white/60" />
          <span className="text-sm text-white/75">Abrir documento</span>
        </div>
        <Download className="h-4 w-4 text-white/60" />
      </a>
    </div>
  );
}
