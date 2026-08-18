import { extraerMetaGoogleDrive, urlProxyDrive } from "@/lib/images/google-drive";

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
  const meta = extraerMetaGoogleDrive(cleanUrl);
  if (meta) {
    return urlProxyDrive(meta);
  }

  try {
    new URL(cleanUrl);
  } catch {
    return cleanUrl;
  }

  return cleanUrl;
}
