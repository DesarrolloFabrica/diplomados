const DRIVE_FILE_ID = /^[a-zA-Z0-9_-]{5,200}$/;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function agregarResourceKey(url: URL, resourceKey: string | null) {
  if (resourceKey) {
    url.searchParams.set("resourcekey", resourceKey);
  }
}

async function intentarFuenteImagen(url: URL) {
  const upstream = await fetch(url, {
    headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
    redirect: "follow",
    next: { revalidate: 3600 },
  });

  if (!upstream.ok) {
    return null;
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/") || !upstream.body) {
    return null;
  }

  const contentLength = Number(upstream.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMAGE_BYTES) {
    return null;
  }

  return { body: upstream.body, contentType };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const id = requestUrl.searchParams.get("id")?.trim() ?? "";
  const resourceKey = requestUrl.searchParams.get("resourcekey")?.trim() ?? null;

  if (!DRIVE_FILE_ID.test(id)) {
    return new Response("Identificador de Google Drive no válido.", { status: 400 });
  }

  const thumbnailUrl = new URL("https://drive.google.com/thumbnail");
  thumbnailUrl.searchParams.set("id", id);
  thumbnailUrl.searchParams.set("sz", "w2000");
  agregarResourceKey(thumbnailUrl, resourceKey);

  const downloadUrl = new URL("https://drive.google.com/uc");
  downloadUrl.searchParams.set("export", "download");
  downloadUrl.searchParams.set("id", id);
  agregarResourceKey(downloadUrl, resourceKey);

  const sources = [thumbnailUrl, downloadUrl];

  try {
    for (const source of sources) {
      const resultado = await intentarFuenteImagen(source);
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
