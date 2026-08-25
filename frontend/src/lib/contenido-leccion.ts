import type { TipoRecurso } from "@backend/lib/db/schema";

export type TabContenido =
  | "video"
  | "podcast"
  | "documento"
  | "infografia"
  | "infografia_interactiva"
  | "presentacion";

export const ORDEN_TABS: TabContenido[] = [
  "video",
  "podcast",
  "documento",
  "infografia",
  "infografia_interactiva",
  "presentacion",
];

export const ETIQUETA_TAB: Record<TabContenido, string> = {
  video: "Video",
  podcast: "Pódcast",
  documento: "Documento",
  infografia: "Infografía",
  infografia_interactiva: "Infografía interactiva",
  presentacion: "Presentación",
};

/** Mapeo determinístico: tipo de recurso en BD → pestaña del visor. */
export function tabDeTipo(tipo: TipoRecurso): TabContenido {
  switch (tipo) {
    case "video":
      return "video";
    case "audio":
      return "podcast";
    case "imagen":
      return "infografia";
    case "presentacion":
      return "presentacion";
    case "pdf":
    case "enlace":
    case "archivo":
      return "documento";
    default: {
      const _exhaustive: never = tipo;
      return _exhaustive;
    }
  }
}

export function categoriasDeRecursos(tipos: TipoRecurso[]): TabContenido[] {
  const presentes = new Set(tipos.map(tabDeTipo));
  return ORDEN_TABS.filter((tab) => presentes.has(tab));
}
