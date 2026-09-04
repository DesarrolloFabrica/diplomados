export const DRIVE_FILE_ID = /^[a-zA-Z0-9_-]{5,200}$/;

export const HEADERS_NAVEGADOR = {
  Accept: "*/*",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://drive.google.com/",
};

const LH3_URL = /https:\/\/lh3\.googleusercontent\.com\/[^"'\\s<>]+/i;
const CONFIRM_TOKEN = /confirm=([0-9A-Za-z_-]+)/;
const CONFIRM_HREF = /href="([^"]*confirm=[^"]+)"/i;

function agregarResourceKey(url: URL, resourceKey: string | null) {
  if (resourceKey) {
    url.searchParams.set("resourcekey", resourceKey);
  }
}

function pareceHtml(bytes: Uint8Array): boolean {
  const inicio = new TextDecoder().decode(bytes.slice(0, 128)).trimStart().toLowerCase();
  return inicio.startsWith("<!doctype") || inicio.startsWith("<html") || inicio.includes("<head");
}

function pareceMedia(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;

  if (
    bytes.length >= 8 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return true;
  }

  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return true;
  }

  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return true;
  }

  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return true;
  }

  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0) {
    return true;
  }

  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return true;
  }

  return false;
}

async function leerStreamCompleto(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const lector = stream.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await lector.read();
    if (done) break;
    if (!value) continue;
    partes.push(value);
    total += value.byteLength;
  }

  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const parte of partes) {
    buffer.set(parte, offset);
    offset += parte.byteLength;
  }

  return buffer;
}

/** URLs de descarga/visualización que el proxy puede intentar en orden. */
export function construirFuentesDescarga(id: string, resourceKey: string | null): URL[] {
  const userContentUrl = new URL("https://drive.usercontent.google.com/download");
  userContentUrl.searchParams.set("export", "download");
  userContentUrl.searchParams.set("id", id);
  userContentUrl.searchParams.set("authuser", "0");
  userContentUrl.searchParams.set("confirm", "t");
  agregarResourceKey(userContentUrl, resourceKey);

  const downloadUrl = new URL("https://drive.google.com/uc");
  downloadUrl.searchParams.set("export", "download");
  downloadUrl.searchParams.set("id", id);
  downloadUrl.searchParams.set("confirm", "t");
  agregarResourceKey(downloadUrl, resourceKey);

  const streamUrl = new URL("https://drive.google.com/uc");
  streamUrl.searchParams.set("export", "stream");
  streamUrl.searchParams.set("id", id);
  agregarResourceKey(streamUrl, resourceKey);

  const viewUrl = new URL("https://drive.google.com/uc");
  viewUrl.searchParams.set("export", "view");
  viewUrl.searchParams.set("id", id);
  agregarResourceKey(viewUrl, resourceKey);

  const lh3Url = new URL(`https://lh3.googleusercontent.com/d/${id}=w2000`);

  return [userContentUrl, downloadUrl, streamUrl, viewUrl, lh3Url];
}

function extraerUrlsDesdeHtml(html: string, id: string, resourceKey: string | null): URL[] {
  const urls: URL[] = [];
  const confirmados = new Set<string>();

  for (const coincidencia of html.matchAll(/confirm=([0-9A-Za-z_-]+)/g)) {
    const confirm = coincidencia[1];
    if (!confirm || confirmados.has(confirm)) continue;
    confirmados.add(confirm);

    const confirmUrl = new URL("https://drive.google.com/uc");
    confirmUrl.searchParams.set("export", "download");
    confirmUrl.searchParams.set("confirm", confirm);
    confirmUrl.searchParams.set("id", id);
    agregarResourceKey(confirmUrl, resourceKey);
    urls.push(confirmUrl);

    const userConfirmUrl = new URL("https://drive.usercontent.google.com/download");
    userConfirmUrl.searchParams.set("export", "download");
    userConfirmUrl.searchParams.set("confirm", confirm);
    userConfirmUrl.searchParams.set("id", id);
    userConfirmUrl.searchParams.set("authuser", "0");
    agregarResourceKey(userConfirmUrl, resourceKey);
    urls.push(userConfirmUrl);
  }

  const hrefConfirm = html.match(CONFIRM_HREF)?.[1];
  if (hrefConfirm) {
    try {
      const absoluta = hrefConfirm.startsWith("http")
        ? new URL(hrefConfirm)
        : new URL(hrefConfirm, "https://drive.google.com");
      urls.push(absoluta);
    } catch {
      // Ignorar href mal formado.
    }
  }

  const confirmLegacy = html.match(CONFIRM_TOKEN)?.[1];
  if (confirmLegacy && !confirmados.has(confirmLegacy)) {
    const confirmUrl = new URL("https://drive.google.com/uc");
    confirmUrl.searchParams.set("export", "download");
    confirmUrl.searchParams.set("confirm", confirmLegacy);
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

export interface RespuestaDriveUpstream {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength: string | null;
  contentRange: string | null;
  status: number;
}

export async function obtenerRecursoDrive(
  id: string,
  resourceKey: string | null,
  range: string | null,
  aceptar: (contentType: string) => boolean,
): Promise<RespuestaDriveUpstream | null> {
  const sources = construirFuentesDescarga(id, resourceKey);
  const visitados = new Set<string>();

  for (const source of sources) {
    const resultado = await intentarFuente(source, id, resourceKey, range, visitados, aceptar);
    if (resultado) {
      return resultado;
    }
  }

  return null;
}

async function intentarFuente(
  url: URL,
  id: string,
  resourceKey: string | null,
  range: string | null,
  visitados: Set<string>,
  aceptar: (contentType: string) => boolean,
): Promise<RespuestaDriveUpstream | null> {
  if (visitados.has(url.toString())) {
    return null;
  }
  visitados.add(url.toString());

  const headers: Record<string, string> = { ...HEADERS_NAVEGADOR };
  if (range) {
    headers.Range = range;
  }

  const upstream = await fetch(url, {
    headers,
    redirect: "follow",
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return null;
  }

  if (!upstream.body) {
    return null;
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const normalizado = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  const esVideoOAudio =
    normalizado.startsWith("video/") || normalizado.startsWith("audio/");

  if (esVideoOAudio) {
    return {
      body: upstream.body,
      contentType: normalizado,
      contentLength: upstream.headers.get("content-length"),
      contentRange: upstream.headers.get("content-range"),
      status: upstream.status,
    };
  }

  // Con Range no bufferizamos respuestas ambiguas (evita romper streaming).
  if (range) {
    return null;
  }

  const buffer = await leerStreamCompleto(upstream.body);

  if (buffer.byteLength === 0) {
    return null;
  }

  if (pareceHtml(buffer) || normalizado.includes("html")) {
    const html = new TextDecoder().decode(buffer);
    const derivadas = extraerUrlsDesdeHtml(html, id, resourceKey);
    for (const derivada of derivadas) {
      const resultado = await intentarFuente(
        derivada,
        id,
        resourceKey,
        range,
        visitados,
        aceptar,
      );
      if (resultado) {
        return resultado;
      }
    }
    return null;
  }

  if (pareceMedia(buffer)) {
    const tipo = normalizado.startsWith("audio/") ? normalizado : "video/mp4";
    return {
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(buffer);
          controller.close();
        },
      }),
      contentType: tipo,
      contentLength: String(buffer.byteLength),
      contentRange: upstream.headers.get("content-range"),
      status: upstream.status,
    };
  }

  if (aceptar(normalizado) || aceptar(contentType)) {
    return {
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(buffer);
          controller.close();
        },
      }),
      contentType: normalizado || contentType,
      contentLength: String(buffer.byteLength),
      contentRange: upstream.headers.get("content-range"),
      status: upstream.status,
    };
  }

  return null;
}
