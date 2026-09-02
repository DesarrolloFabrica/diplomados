export const DRIVE_FILE_ID = /^[a-zA-Z0-9_-]{5,200}$/;

export const HEADERS_NAVEGADOR = {
  Accept: "*/*",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://drive.google.com/",
};

const LH3_URL = /https:\/\/lh3\.googleusercontent\.com\/[^"'\\s<>]+/i;
const CONFIRM_TOKEN = /confirm=([0-9A-Za-z_-]+)/;

function agregarResourceKey(url: URL, resourceKey: string | null) {
  if (resourceKey) {
    url.searchParams.set("resourcekey", resourceKey);
  }
}

/** URLs de descarga/visualización que el proxy puede intentar en orden. */
export function construirFuentesDescarga(id: string, resourceKey: string | null): URL[] {
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

  return [userContentUrl, viewUrl, downloadUrl, lh3Url];
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

  if (aceptar(normalizado) || aceptar(contentType)) {
    return {
      body: upstream.body,
      contentType: normalizado || contentType,
      contentLength: upstream.headers.get("content-length"),
      contentRange: upstream.headers.get("content-range"),
      status: upstream.status,
    };
  }

  if (!normalizado.includes("html")) {
    return null;
  }

  const html = await upstream.text();
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
