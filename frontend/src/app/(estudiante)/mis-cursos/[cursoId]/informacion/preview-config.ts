import type { TipoRecurso } from "@backend/lib/db/schema";

export interface PreviewCursoConfig {
  previewResourceUrl: string;
  previewType: TipoRecurso;
  previewTitle: string;
  previewThumbnail?: string | null;
}

const DIACRITICOS_COMBINANTES = /[\u0300-\u036f]/g;

function normalizarTitulo(titulo: string): string {
  return titulo.normalize("NFD").replace(DIACRITICOS_COMBINANTES, "").toLowerCase();
}

const PREVIEWS_POR_TITULO: Array<{
  coincide: (tituloNormalizado: string) => boolean;
  preview: PreviewCursoConfig;
}> = [
  {
    coincide: (titulo) => titulo.includes("gerencia social"),
    preview: {
      previewResourceUrl: encodeURI("/images/infografia/D_Gerencia Social.png"),
      previewType: "imagen",
      previewTitle: "Diplomado en Gerencia Social - vista previa",
    },
  },
  {
    coincide: (titulo) => titulo.includes("construccion de paz"),
    preview: {
      previewResourceUrl: encodeURI("/images/infografia/D_Construcción de Paz.png"),
      previewType: "imagen",
      previewTitle: "Construcción de Paz - vista previa",
    },
  },
];

export function obtenerPreviewCursoPorTitulo(tituloCurso: string): PreviewCursoConfig | null {
  const normalizado = normalizarTitulo(tituloCurso);
  return PREVIEWS_POR_TITULO.find((item) => item.coincide(normalizado))?.preview ?? null;
}
