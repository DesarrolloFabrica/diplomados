"use client";

import { useMemo, useState } from "react";
import {
  AudioLines,
  ChartNoAxesCombined,
  FileText,
  Presentation,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RecursoIncrustado } from "@/components/shared/recurso-incrustado";
import type { TipoRecurso } from "@/lib/db/schema";
import {
  ETIQUETA_TAB,
  ORDEN_TABS,
  tabDeTipo,
  type TabContenido,
} from "@/lib/contenido-leccion";

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
}

export function VistaContenidoLeccion({
  recursos,
  contenidoTexto,
}: VistaContenidoLeccionProps) {
  const tabsDisponibles = useMemo(() => {
    const presentes = new Set(recursos.map((r) => tabDeTipo(r.tipo)));
    if (contenidoTexto && !presentes.has("documento")) {
      presentes.add("documento");
    }
    const orden = TABS.filter((t) => presentes.has(t.id));
    return orden.length > 0 ? orden : TABS.filter((t) => t.id === "documento");
  }, [recursos, contenidoTexto]);

  const [tabActiva, setTabActiva] = useState<TabContenido>(
    () => tabsDisponibles[0]?.id ?? "documento",
  );

  const tabActual = tabsDisponibles.some((t) => t.id === tabActiva)
    ? tabActiva
    : (tabsDisponibles[0]?.id ?? "documento");

  const recursosFiltrados = recursos.filter((r) => tabDeTipo(r.tipo) === tabActual);
  const mostrarTexto = Boolean(contenidoTexto) && tabActual === "documento";

  return (
    <div className="space-y-6">
      {tabsDisponibles.length > 0 && (
        <div className="w-full max-w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-min justify-center sm:justify-start">
            <div
              className={cn(
                "lesson-segmented inline-flex items-center gap-1 rounded-full border border-border/80",
                "bg-white p-1.5 shadow-sm dark:bg-card",
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
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                      "sm:px-4",
                      activo
                        ? "bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-600 text-white shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                        : "text-foreground/80 hover:bg-muted/80 hover:text-foreground",
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

      <div className="lesson-content-surface rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
        {mostrarTexto && (
          <p className="mb-5 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
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
          !mostrarTexto && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
              No hay contenido de este tipo en la lección.
            </div>
          )
        )}
      </div>
    </div>
  );
}
