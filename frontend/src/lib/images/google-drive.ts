const DRIVE_FILE_PATH = /^\/file\/d\/([^/?#]+)/i;

export interface DriveImagenMeta {
  id: string;
  resourceKey: string | null;
}

export type ModoPortadaDrive = "imagen" | "iframe";
export type ModoRecursoDrive = "video" | "audio" | "imagen" | "iframe";

export interface CandidatoPortadaDrive {
  modo: ModoPortadaDrive;
  url: string;
}

export interface CandidatoRecursoDrive {
  modo: ModoRecursoDrive;
  url: string;
}

function esHostGoogleDrive(hostname: string): boolean {
  return hostname === "drive.google.com" || hostname === "docs.google.com";
}

/** Extrae id y resourcekey de un enlace compartido de Google Drive. */
export function extraerMetaGoogleDrive(url: string | null | undefined): DriveImagenMeta | null {
  if (!url?.trim()) {
    return null;
  }

  try {
    const parsed = new URL(url.trim());
    if (!esHostGoogleDrive(parsed.hostname)) {
      return null;
    }

    const resourceKey = parsed.searchParams.get("resourcekey");

    const pathMatch = parsed.pathname.match(DRIVE_FILE_PATH);
    if (pathMatch?.[1]) {
      return { id: pathMatch[1], resourceKey };
    }

    if (parsed.pathname === "/open" || parsed.pathname === "/uc") {
      const id = parsed.searchParams.get("id");
      if (id) {
        return { id, resourceKey };
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function urlProxyDrive(meta: DriveImagenMeta): string {
  const params = new URLSearchParams({ id: meta.id });
  if (meta.resourceKey) {
    params.set("resourcekey", meta.resourceKey);
  }
  return `/api/imagenes/google-drive?${params.toString()}`;
}

export function urlProxyMediaDrive(meta: DriveImagenMeta): string {
  const params = new URLSearchParams({ id: meta.id });
  if (meta.resourceKey) {
    params.set("resourcekey", meta.resourceKey);
  }
  return `/api/media/google-drive?${params.toString()}`;
}

export function urlVerDrive(meta: DriveImagenMeta): string {
  const params = new URLSearchParams();
  if (meta.resourceKey) {
    params.set("resourcekey", meta.resourceKey);
  }
  const query = params.toString();
  return query
    ? `https://drive.google.com/file/d/${meta.id}/view?${query}`
    : `https://drive.google.com/file/d/${meta.id}/view`;
}

export function urlMiniaturaDrive(meta: DriveImagenMeta, ancho = 1200): string {
  const params = new URLSearchParams({
    id: meta.id,
    sz: `w${ancho}`,
  });
  if (meta.resourceKey) {
    params.set("resourcekey", meta.resourceKey);
  }
  return `https://drive.google.com/thumbnail?${params.toString()}`;
}

export function urlPreviewDrive(meta: DriveImagenMeta): string {
  const params = new URLSearchParams();
  if (meta.resourceKey) {
    params.set("resourcekey", meta.resourceKey);
  }
  const query = params.toString();
  return query
    ? `https://drive.google.com/file/d/${meta.id}/preview?${query}`
    : `https://drive.google.com/file/d/${meta.id}/preview`;
}

/** Descarga directa en el navegador (usa cookies Google del usuario si las hay). */
export function urlDescargaDirectaDrive(meta: DriveImagenMeta): string {
  const url = new URL("https://drive.google.com/uc");
  url.searchParams.set("export", "download");
  url.searchParams.set("id", meta.id);
  url.searchParams.set("confirm", "t");
  if (meta.resourceKey) {
    url.searchParams.set("resourcekey", meta.resourceKey);
  }
  return url.toString();
}

/**
 * Orden de intentos para portadas en Drive:
 * 1) proxy interno (público / descarga confirmada)
 * 2) miniatura directa (público, navegador)
 * 3) preview embebido (enlace compartido con sesión Google del usuario)
 */
export function candidatosPortadaDrive(url: string | null | undefined): CandidatoPortadaDrive[] {
  const meta = extraerMetaGoogleDrive(url);
  if (!meta) {
    const limpia = url?.trim();
    return limpia ? [{ modo: "imagen", url: limpia }] : [];
  }

  return [
    { modo: "imagen", url: urlProxyDrive(meta) },
    { modo: "imagen", url: urlMiniaturaDrive(meta) },
    { modo: "iframe", url: urlPreviewDrive(meta) },
  ];
}

type TipoRecursoDrive = "video" | "audio" | "imagen" | "pdf" | "presentacion" | "otro";

function clasificarTipoDrive(tipo: string): TipoRecursoDrive {
  switch (tipo) {
    case "video":
      return "video";
    case "audio":
      return "audio";
    case "imagen":
      return "imagen";
    case "pdf":
      return "pdf";
    case "presentacion":
      return "presentacion";
    default:
      return "otro";
  }
}

/**
 * Orden de intentos para recursos de lección en Drive:
 * - Video/audio: proxy same-origin → descarga directa (cookies del navegador) → iframe preview
 * - Imagen/infografía: proxy → miniatura → iframe
 * - PDF/presentación: iframe preview con resourcekey
 */
export function candidatosRecursoDrive(
  url: string | null | undefined,
  tipo: string,
): CandidatoRecursoDrive[] {
  const meta = extraerMetaGoogleDrive(url);
  if (!meta) {
    return [];
  }

  const preview = urlPreviewDrive(meta);
  const clasificacion = clasificarTipoDrive(tipo);

  switch (clasificacion) {
    case "video":
      return [
        { modo: "video", url: urlProxyMediaDrive(meta) },
        { modo: "video", url: urlDescargaDirectaDrive(meta) },
        { modo: "iframe", url: preview },
      ];
    case "audio":
      return [
        { modo: "audio", url: urlProxyMediaDrive(meta) },
        { modo: "audio", url: urlDescargaDirectaDrive(meta) },
        { modo: "iframe", url: preview },
      ];
    case "imagen":
      return [
        { modo: "imagen", url: urlProxyDrive(meta) },
        { modo: "imagen", url: urlMiniaturaDrive(meta) },
        { modo: "iframe", url: preview },
      ];
    case "pdf":
    case "presentacion":
    case "otro":
      return [{ modo: "iframe", url: preview }];
    default: {
      const _exhaustivo: never = clasificacion;
      return _exhaustivo;
    }
  }
}
