import { urlMiniaturaDrive, type DriveImagenMeta } from "@/lib/images/google-drive";

const DRIVE_FILE_ID = /^[a-zA-Z0-9_-]{5,200}$/;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const LH3_URL = /https:\/\/lh3\.googleusercontent\.com\/[^"'\\s<>]+/i;
const CONFIRM_TOKEN = /confirm=([0-9A-Za-z_-]+)/;

const HEADERS_NAVEGADOR = {
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://drive.google.com/",
};

function agregarResourceKey(url: URL, resourceKey: string | null) {
  if (resourceKey) {
    url.searchParams.set("resourcekey", resourceKey);
  }
}

function construirFuentes(id: string, resourceKey: string | null): URL[] {
  const meta: DriveImagenMeta = { id, resourceKey };

  const thumbnailUrl = new URL(urlMiniaturaDrive(meta));
  agregarResourceKey(thumbnailUrl, resourceKey);

  const userContentUrl = new URL("https://drive.usercontent.google.com/download");
  userContentUrl.searchParams.set("export", "download");
  userContentUrl.searchParams.set("id", id);
  userContentUrl.searchParams.set("authuser", "0");
  agregarResourceKey(userContentUrl, resourceKey);

  const viewUrl = new URL("https://drive.google.com/uc");
  viewUrl.searchParams.set("export", "view");
  viewUrl.searchParams.set("id", id);
  agregarResourceKey(viewUrl, resourceKey);

  const downloadUrl = new URL("https://drive.google.com/uc");
  downloadUrl.searchParams.set("export", "download");
  downloadUrl.searchParams.set("id", id);
  agregarResourceKey(downloadUrl, resourceKey);

  const lh3Url = new URL(`https://lh3.googleusercontent.com/d/${id}=w2000`);

  return [thumbnailUrl, userContentUrl, lh3Url, viewUrl, downloadUrl];
}

function detectarTipoImagen(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

function resolverTipoImagen(contentType: string, buffer: ArrayBuffer): string | null {
  const normalizado = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (normalizado.startsWith("image/")) {
    return normalizado;
  }

  if (
    normalizado === "application/octet-stream" ||
    normalizado === "application/binary" ||
    normalizado === "binary/octet-stream"
  ) {
    return detectarTipoImagen(buffer);
  }

  return detectarTipoImagen(buffer);
}

function esHtml(contentType: string, buffer: ArrayBuffer): boolean {
  const normalizado = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (normalizado.includes("html")) {
    return true;
  }

  const bytes = new Uint8Array(buffer.slice(0, 64));
  const inicio = new TextDecoder().decode(bytes).trimStart().toLowerCase();
  return inicio.startsWith("<!doctype html") || inicio.startsWith("<html");
}

function extraerUrlsDesdeHtml(html: string, id: string, resourceKey: string | null): URL[] {
  const urls: URL[] = [];

  const confirm = html.match(CONFIRM_TOKEN)?.[1];
  if (confirm) {
    const confirmUrl = new URL("https://drive.google.com/uc");
    confirmUrl.searchParams.set("export", "download");
    confirmUrl.searchParams.set("confirm", confirm);
    confirmUrl.searchParams.set("id", id);
    agregarResourceKey(confirmUrl, resourceKey);
    urls.push(confirmUrl);
  }

  const lh3 = html.match(LH3_URL)?.[0];
  if (lh3) {
    try {
      urls.push(new URL(lh3));
    } catch {
      // Ignorar URL mal formada en el HTML de Drive.
    }
  }

  return urls;
}

async function intentarFuenteImagen(url: URL) {
  const upstream = await fetch(url, {
    headers: HEADERS_NAVEGADOR,
    redirect: "follow",
    cache: "no-store",
  });

  if (!upstream.ok) {
    return null;
  }

  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    return null;
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const tipoImagen = resolverTipoImagen(contentType, buffer);
  if (tipoImagen) {
    return { body: buffer, contentType: tipoImagen };
  }

  if (esHtml(contentType, buffer)) {
    return null;
  }

  return null;
}

async function intentarFuenteConHtml(
  url: URL,
  id: string,
  resourceKey: string | null,
  visitados: Set<string>,
) {
  if (visitados.has(url.toString())) {
    return null;
  }
  visitados.add(url.toString());

  const upstream = await fetch(url, {
    headers: HEADERS_NAVEGADOR,
    redirect: "follow",
    cache: "no-store",
  });

  if (!upstream.ok) {
    return null;
  }

  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    return null;
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const tipoImagen = resolverTipoImagen(contentType, buffer);
  if (tipoImagen) {
    return { body: buffer, contentType: tipoImagen };
  }

  if (!esHtml(contentType, buffer)) {
    return null;
  }

  const html = new TextDecoder().decode(buffer);
  const derivadas = extraerUrlsDesdeHtml(html, id, resourceKey);
  for (const derivada of derivadas) {
    const resultado = await intentarFuenteImagen(derivada);
    if (resultado) {
      return resultado;
    }
  }

  return null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const id = requestUrl.searchParams.get("id")?.trim() ?? "";
  const resourceKey = requestUrl.searchParams.get("resourcekey")?.trim() ?? null;

  if (!DRIVE_FILE_ID.test(id)) {
    return new Response("Identificador de Google Drive no válido.", { status: 400 });
  }

  const sources = construirFuentes(id, resourceKey);
  const visitados = new Set<string>();

  try {
    for (const source of sources) {
      const resultado =
        (await intentarFuenteImagen(source)) ??
        (await intentarFuenteConHtml(source, id, resourceKey, visitados));

      if (!resultado) {
        continue;
      }

      return new Response(resultado.body, {
        status: 200,
        headers: {
          "Content-Type": resultado.contentType,
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return new Response("No se pudo obtener la imagen.", { status: 404 });
  } catch {
    return new Response("Error al obtener la imagen.", { status: 502 });
  }
}
