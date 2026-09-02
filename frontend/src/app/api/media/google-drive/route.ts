import {
  DRIVE_FILE_ID,
  obtenerRecursoDrive,
} from "@/lib/images/google-drive-fetch";

const TIPOS_MEDIA = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/ogg",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/aac",
  "audio/x-m4a",
  "application/octet-stream",
]);

function esTipoMedia(contentType: string): boolean {
  const normalizado = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return (
    TIPOS_MEDIA.has(normalizado) ||
    normalizado.startsWith("video/") ||
    normalizado.startsWith("audio/")
  );
}

function contentTypeRespuesta(contentType: string): string {
  const normalizado = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (normalizado.startsWith("video/") || normalizado.startsWith("audio/")) {
    return normalizado;
  }
  return "application/octet-stream";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const id = requestUrl.searchParams.get("id")?.trim() ?? "";
  const resourceKey = requestUrl.searchParams.get("resourcekey")?.trim() ?? null;
  const range = request.headers.get("range");

  if (!DRIVE_FILE_ID.test(id)) {
    return new Response("Identificador de Google Drive no válido.", { status: 400 });
  }

  try {
    const resultado = await obtenerRecursoDrive(id, resourceKey, range, esTipoMedia);
    if (!resultado) {
      return new Response("No se pudo obtener el archivo multimedia.", { status: 404 });
    }

    const headers: Record<string, string> = {
      "Content-Type": contentTypeRespuesta(resultado.contentType),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    };

    if (resultado.contentLength) {
      headers["Content-Length"] = resultado.contentLength;
    }
    if (resultado.contentRange) {
      headers["Content-Range"] = resultado.contentRange;
    }

    return new Response(resultado.body, {
      status: resultado.status,
      headers,
    });
  } catch {
    return new Response("Error al obtener el archivo multimedia.", { status: 502 });
  }
}
