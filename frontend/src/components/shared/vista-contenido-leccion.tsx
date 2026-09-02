"use client";

import { useMemo, useState } from "react";
import {
  AudioLines,
  ChartNoAxesCombined,
  FileText,
  MousePointerClick,
  Presentation,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASE_HERO_PANEL, CLASE_PANEL_GLASS } from "@/config/paneles-glass";
import { RecursoIncrustado } from "@/components/shared/recurso-incrustado";
import { EmbedAdobeIndesign } from "@/components/shared/embed-adobe-indesign";
import type { TipoRecurso } from "@backend/lib/db/schema";
import {
  ETIQUETA_TAB,
  ORDEN_TABS,
  tabDeTipo,
  type TabContenido,
} from "@/lib/contenido-leccion";
import type { InfografiaInteractivaLeccion } from "@/lib/embeds-prueba-leccion";

export interface RecursoVista {
  id: string;
  nombre: string;
  tipo: TipoRecurso;
  url: string | null;
}

const ICONOS_TAB: Record<TabContenido, LucideIcon> = {
  video: Video,
  podcast: AudioLines,
  documento: FileText,
  infografia: ChartNoAxesCombined,
  infografia_interactiva: MousePointerClick,
  presentacion: Presentation,
};

const TABS = ORDEN_TABS.map((id) => ({
  id,
  etiqueta: ETIQUETA_TAB[id],
  Icono: ICONOS_TAB[id],
}));

interface VistaContenidoLeccionProps {
  recursos: RecursoVista[];
  contenidoTexto?: string | null;
  infografiaInteractiva?: InfografiaInteractivaLeccion | null;
}

export function VistaContenidoLeccion({
  recursos,
  contenidoTexto,
  infografiaInteractiva = null,
}: VistaContenidoLeccionProps) {
  const tabsDisponibles = useMemo(() => {
    const presentes = new Set(recursos.map((r) => tabDeTipo(r.tipo)));
    if (contenidoTexto && !presentes.has("documento")) {
      presentes.add("documento");
    }
    if (infografiaInteractiva) {
      presentes.add("infografia_interactiva");
    }
    const orden = TABS.filter((t) => presentes.has(t.id));
    return orden.length > 0 ? orden : TABS.filter((t) => t.id === "documento");
  }, [recursos, contenidoTexto, infografiaInteractiva]);

  const [tabActiva, setTabActiva] = useState<TabContenido>(
    () => infografiaInteractiva?.src
      ? "infografia_interactiva"
      : (tabsDisponibles[0]?.id ?? "documento"),
  );

  const tabActual = tabsDisponibles.some((t) => t.id === tabActiva)
    ? tabActiva
    : (tabsDisponibles[0]?.id ?? "documento");

  const recursosFiltrados = recursos.filter((r) => tabDeTipo(r.tipo) === tabActual);
  const mostrarTexto = Boolean(contenidoTexto) && tabActual === "documento";
  const mostrarInfografiaInteractiva =
    tabActual === "infografia_interactiva" && infografiaInteractiva !== null;

  return (
    <div className="space-y-6">
      {tabsDisponibles.length > 0 && (
        <div className="w-full max-w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-min justify-center sm:justify-start">
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full p-1.5",
                CLASE_HERO_PANEL,
              )}
              role="tablist"
              aria-label="Tipo de contenido"
            >
              {tabsDisponibles.map(({ id, etiqueta, Icono }) => {
                const activo = id === tabActual;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    tabIndex={activo ? 0 : -1}
                    onClick={() => setTabActiva(id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]",
                      "sm:px-4",
                      activo
                        ? "bg-white text-[#061120] shadow-[0_4px_14px_rgba(6,17,32,0.18)]"
                        : "text-white/85 hover:bg-white/18 hover:text-white",
                    )}
                  >
                    <Icono className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{etiqueta}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className={cn("rounded-[24px] p-4 sm:p-6", CLASE_PANEL_GLASS)}>
        {mostrarInfografiaInteractiva ? (
          <EmbedAdobeIndesign
            src={infografiaInteractiva.src}
            titulo={infografiaInteractiva.titulo}
          />
        ) : null}

        {mostrarTexto && (
          <p className="mb-5 whitespace-pre-wrap text-base leading-relaxed text-white/88">
            {contenidoTexto}
          </p>
        )}

        {recursosFiltrados.length > 0 ? (
          <div className="space-y-5">
            {recursosFiltrados.map((recurso) => (
              <RecursoIncrustado
                key={recurso.id}
                nombre={recurso.nombre}
                tipo={recurso.tipo}
                url={recurso.url}
              />
            ))}
          </div>
        ) : (
          !mostrarTexto &&
          !mostrarInfografiaInteractiva && (
            <div className="rounded-xl border border-dashed border-white/35 bg-white/10 px-4 py-10 text-center text-sm text-white/70">
              No hay contenido de este tipo en la lección.
            </div>
          )
        )}
      </div>
    </div>
  );
}
