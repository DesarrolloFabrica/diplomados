import { FileText, Presentation, Link2, File, Download } from "lucide-react";
import { obtenerEmbedYoutube, obtenerEmbedGoogleDrive } from "@/lib/media";
import type { TipoRecurso } from "@/lib/db/schema";

interface RecursoIncrustadoProps {
  nombre: string;
  tipo: TipoRecurso;
  url: string | null;
}

const ICONO_DESCARGA: Record<TipoRecurso, typeof FileText> = {
  pdf: FileText,
  video: FileText,
  audio: FileText,
  imagen: FileText,
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
      <div className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
        {nombre} — no disponible
      </div>
    );
  }

  // El material subido a Google Drive (video, PDF, imagen o presentación)
  // se incrusta igual sin importar el tipo elegido: el link normal de
  // "compartir" de Drive no reproduce nada dentro de la página, solo el
  // formato /preview lo permite.
  const embedDrive = obtenerEmbedGoogleDrive(url);
  if (embedDrive) {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{nombre}</p>
        <div
          className={`w-full overflow-hidden rounded-lg border border-border bg-muted ${
            tipo === "video" ? "aspect-video" : "h-[70vh] max-h-[600px]"
          }`}
        >
          <iframe src={embedDrive} title={nombre} className="h-full w-full" allow="autoplay" />
        </div>
      </div>
    );
  }

  if (tipo === "video") {
    const embedYoutube = obtenerEmbedYoutube(url);
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{nombre}</p>
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
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
    return (
      <div className="space-y-1.5 rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium">{nombre}</p>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls src={url} className="w-full" />
      </div>
    );
  }

  if (tipo === "imagen") {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{nombre}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={nombre} className="w-full rounded-lg border border-border" />
      </div>
    );
  }

  const Icono = ICONO_DESCARGA[tipo];
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
    >
      <div className="flex items-center gap-2">
        <Icono className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{nombre}</span>
      </div>
      <Download className="h-4 w-4 text-muted-foreground" />
    </a>
  );
}
