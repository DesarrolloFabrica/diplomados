const ADOBE_INDESIGN_ID = "fde03240-8dbd-40a0-b733-2173941d8084";

/**
 * URL /view/ de Publish Online: carga directa sin "Read Now", con flechas
 * y barra inferior del visor dentro del iframe (no solo en pantalla completa).
 * @see https://creativepro.com/using-adobe-publish-online/
 */
export const ADOBE_INDESIGN_EMBED_COMPONENTES_PAZ = `https://indd.adobe.com/view/${ADOBE_INDESIGN_ID}`;

/** @deprecated Usar ADOBE_INDESIGN_EMBED_COMPONENTES_PAZ */
export const ADOBE_INDESIGN_EMBED_PRUEBA = ADOBE_INDESIGN_EMBED_COMPONENTES_PAZ;

/** Normaliza un enlace /embed/ al modo visor embebido /view/. */
export function urlAdobeIndesignViewer(urlEmbed: string): string {
  try {
    const url = new URL(urlEmbed);
    url.pathname = url.pathname.replace(/^\/embed\//, "/view/");
    url.searchParams.delete("allowFullscreen");
    return url.toString();
  } catch {
    return urlEmbed.replace("/embed/", "/view/").replace(/\?allowFullscreen=true/i, "");
  }
}

export interface InfografiaInteractivaLeccion {
  src: string;
  titulo: string;
}

function esCursoComponentesDeLaPaz(tituloCurso: string): boolean {
  const titulo = tituloCurso
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    titulo.includes("construccion de paz") ||
    titulo.includes("componentes de la paz")
  );
}

export function esPrimeraLeccionConstruccionPaz(
  tituloCurso: string,
  leccionId: string,
  primeraLeccionId: string | undefined,
): boolean {
  return (
    esCursoComponentesDeLaPaz(tituloCurso) &&
    primeraLeccionId !== undefined &&
    leccionId === primeraLeccionId
  );
}

export function obtenerInfografiaInteractivaLeccion(
  tituloCurso: string,
  leccionId: string,
  primeraLeccionId: string | undefined,
): InfografiaInteractivaLeccion | null {
  if (!esPrimeraLeccionConstruccionPaz(tituloCurso, leccionId, primeraLeccionId)) {
    return null;
  }

  return {
    src: ADOBE_INDESIGN_EMBED_COMPONENTES_PAZ,
    titulo: "Componentes de la paz",
  };
}
