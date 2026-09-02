import { extraerMetaGoogleDrive, urlPreviewDrive } from "@/lib/images/google-drive";

// Detecta enlaces de YouTube para incrustarlos como <iframe>; cualquier
// otro enlace externo se maneja como tarjeta con botón "Abrir".
export function obtenerEmbedYoutube(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

// Detecta enlaces de Google Drive (el instructor sube el material a Drive
// y pega el link para compartir) y los convierte al formato /preview, que
// Drive sí permite incrustar en un <iframe> — el link normal de "ver" no
// se puede incrustar y solo abriría una página de Google, no el archivo.
// Sirve para video, PDF, imagen o presentación por igual.
export function obtenerEmbedGoogleDrive(url: string): string | null {
  const meta = extraerMetaGoogleDrive(url);
  return meta ? urlPreviewDrive(meta) : null;
}

export function esEnlaceGoogleDrive(url: string): boolean {
  return extraerMetaGoogleDrive(url) !== null;
}
