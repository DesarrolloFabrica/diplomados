import { Storage } from "@google-cloud/storage";

// En Cloud Run, sin credenciales explícitas, el SDK usa la cuenta de
// servicio asociada al servicio (Application Default Credentials).
const storage = new Storage();

function bucket() {
  const nombre = process.env.GCS_BUCKET;
  if (!nombre) throw new Error("Falta GCS_BUCKET en el entorno.");
  return storage.bucket(nombre);
}

// Un solo bucket privado, organizado por carpeta (en vez de los 4 buckets
// separados que usaba Supabase Storage). Nunca se exponen enlaces
// públicos: todo acceso es vía URL firmada de corta duración.
export type CarpetaStorage = "portadas" | "recursos" | "videos" | "avatares";

export function rutaObjeto(carpeta: CarpetaStorage, nombreArchivo: string): string {
  return `${carpeta}/${nombreArchivo}`;
}

const QUINCE_MINUTOS_MS = 15 * 60 * 1000;
const UNA_HORA_MS = 60 * 60 * 1000;

// URL firmada para que el navegador suba el archivo directo a GCS (el
// binario no pasa por el servidor de Next.js).
export async function generarUrlSubida(storagePath: string, contentType: string): Promise<string> {
  const [url] = await bucket()
    .file(storagePath)
    .getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + QUINCE_MINUTOS_MS,
      contentType,
    });
  return url;
}

export async function generarUrlLectura(storagePath: string): Promise<string> {
  const [url] = await bucket()
    .file(storagePath)
    .getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + UNA_HORA_MS,
    });
  return url;
}

export async function eliminarObjeto(storagePath: string): Promise<void> {
  await bucket().file(storagePath).delete({ ignoreNotFound: true });
}
