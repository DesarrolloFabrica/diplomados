const DRIVE_FILE_PATH = /^\/file\/d\/([^/?#]+)/i;

export interface DriveImagenMeta {
  id: string;
  resourceKey: string | null;
}

export type ModoPortadaDrive = "imagen" | "iframe";

export interface CandidatoPortadaDrive {
  modo: ModoPortadaDrive;
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
