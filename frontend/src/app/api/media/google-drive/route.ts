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

/**
 * Cloud Run (HTTP/1) rechaza con 500 cualquier respuesta de más de 32 MiB
 * ("Response size was too large"). El <video> pide `Range: bytes=0-` (rango
 * abierto), con lo que Drive devolvería el archivo completo. Por eso cada
 * respuesta se limita a un bloque de este tamaño: el navegador recibe un 206
 * con el Content-Range real y pide los bloques siguientes por su cuenta.
 */
const MAX_BYTES_POR_RESPUESTA = 8 * 1024 * 1024;

/** Convierte el Range del navegador en uno acotado a MAX_BYTES_POR_RESPUESTA. */
function acotarRange(range: string | null): { inicio: number; fin: number } | null {
  if (!range) return { inicio: 0, fin: MAX_BYTES_POR_RESPUESTA - 1 };
  const coincidencia = /^bytes=(\d+)-(\d*)$/.exec(range.trim());
  // Rangos sufijo (bytes=-N) o múltiples: se reenvían tal cual.
  if (!coincidencia) return null;
  const inicio = Number(coincidencia[1]);
  const finPedido = coincidencia[2] ? Number(coincidencia[2]) : Number.POSITIVE_INFINITY;
  return { inicio, fin: Math.min(finPedido, inicio + MAX_BYTES_POR_RESPUESTA - 1) };
}

/** Deja pasar como máximo `limite` bytes del stream y cancela el resto. */
function truncarStream(
  stream: ReadableStream<Uint8Array>,
  limite: number,
): ReadableStream<Uint8Array> {
  const lector = stream.getReader();
  let enviados = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await lector.read();
      if (done) {
        controller.close();
        return;
      }
      const restante = limite - enviados;
      const parte = value.byteLength > restante ? value.subarray(0, restante) : value;
      enviados += parte.byteLength;
      controller.enqueue(parte);
      if (enviados >= limite) {
        controller.close();
        await lector.cancel();
      }
    },
    cancel(reason) {
      return lector.cancel(reason);
    },
  });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const id = requestUrl.searchParams.get("id")?.trim() ?? "";
  const resourceKey = requestUrl.searchParams.get("resourcekey")?.trim() ?? null;
  const rangoAcotado = acotarRange(request.headers.get("range"));
  const range = rangoAcotado
    ? `bytes=${rangoAcotado.inicio}-${rangoAcotado.fin}`
    : request.headers.get("range");

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

    let body = resultado.body;
    let status = resultado.status;
    let contentLength = resultado.contentLength;
    let contentRange = resultado.contentRange;

    // Si Drive ignoró el Range y devolvió el archivo completo (200), se
    // recorta aquí para no superar el límite de Cloud Run.
    const total = contentLength ? Number(contentLength) : NaN;
    if (status === 200 && rangoAcotado && rangoAcotado.inicio === 0) {
      if (!Number.isFinite(total) || total > MAX_BYTES_POR_RESPUESTA) {
        body = truncarStream(body, MAX_BYTES_POR_RESPUESTA);
        if (Number.isFinite(total)) {
          const fin = Math.min(rangoAcotado.fin, total - 1);
          status = 206;
          contentLength = String(fin + 1);
          contentRange = `bytes 0-${fin}/${total}`;
        } else {
          contentLength = null;
        }
      }
    }

    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }
    if (contentRange) {
      headers["Content-Range"] = contentRange;
    }

    return new Response(body, { status, headers });
  } catch (error) {
    // TEMPORAL: diagnóstico, quitar una vez confirmado el problema.
    console.error("[media-proxy] fallo al obtener el archivo multimedia", error);
    return new Response("Error al obtener el archivo multimedia.", { status: 502 });
  }
}
