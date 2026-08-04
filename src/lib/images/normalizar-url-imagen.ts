const DRIVE_FILE_PATH = /^\/file\/d\/([^/?#]+)/i;

interface DriveImagenMeta {
  id: string;
  resourceKey: string | null;
}

function extraerMetaGoogleDrive(url: URL): DriveImagenMeta | null {
  if (url.hostname !== "drive.google.com") {
    return null;
  }

  const resourceKey = url.searchParams.get("resourcekey");

  const pathMatch = url.pathname.match(DRIVE_FILE_PATH);
  if (pathMatch?.[1]) {
    return { id: pathMatch[1], resourceKey };
  }

  if (url.pathname === "/open" || url.pathname === "/uc") {
    const id = url.searchParams.get("id");
    if (id) {
      return { id, resourceKey };
    }
  }

  return null;
}

/**
 * Normaliza URLs de imagen para renderizado.
 * Conserva URLs normales; convierte enlaces compartidos de Google Drive
 * al proxy interno. No muta el valor almacenado en base de datos.
 */
export function normalizarUrlImagen(url: string | null | undefined): string {
  if (!url?.trim()) {
    return "";
  }

  const cleanUrl = url.trim();

  try {
    const parsed = new URL(cleanUrl);
    const meta = extraerMetaGoogleDrive(parsed);
    if (meta) {
      const params = new URLSearchParams({ id: meta.id });
      if (meta.resourceKey) {
        params.set("resourcekey", meta.resourceKey);
      }
      return `/api/imagenes/google-drive?${params.toString()}`;
    }
  } catch {
    return cleanUrl;
  }

  return cleanUrl;
}
