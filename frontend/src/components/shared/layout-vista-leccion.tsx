"use client";

import { useState } from "react";
import { PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASE_PANEL_GLASS } from "@/config/paneles-glass";
import { useInterfaceVariant } from "@/components/providers/interface-variant-provider";
import {
  EsquemaContenidos,
  type GrupoEsquema,
} from "@/components/shared/esquema-contenidos";

interface LayoutVistaLeccionProps {
  cursoId: string;
  enrollmentId: string;
  leccionActivaId?: string;
  evaluacionActivaId?: string;
  grupos: GrupoEsquema[];
  progresoCurso: {
    porcentaje: number;
    completados: number;
    total: number;
  };
  children: React.ReactNode;
}

export function LayoutVistaLeccion({
  cursoId,
  enrollmentId,
  leccionActivaId,
  evaluacionActivaId,
  grupos,
  progresoCurso,
  children,
}: LayoutVistaLeccionProps) {
  const { config } = useInterfaceVariant();
  const esEducational = config.id === "educational";
  const esGamified = config.id === "gamified";
  // Educational/Gamified dan protagonismo al índice de contenidos/objetivos:
  // el esquema queda visible por defecto (70/30) en vez de requerir abrirlo.
  const [esquemaVisible, setEsquemaVisible] = useState(esEducational || esGamified);

  function alternarEsquema() {
    setEsquemaVisible((prev) => !prev);
  }

  return (
    <div
      data-lesson-variant={config.lesson.variant}
      className={cn(
        "grid min-h-full w-full grid-cols-1",
        esquemaVisible &&
          (esEducational || esGamified
            ? "xl:grid-cols-[minmax(0,1fr)_380px]"
            : "xl:grid-cols-[minmax(0,1fr)_304px]"),
      )}
    >
      <section className="relative min-w-0 px-3 py-4 sm:px-4 lg:px-6 lg:py-5">
        {!esquemaVisible && (
          <button
            type="button"
            onClick={alternarEsquema}
            aria-expanded={false}
            aria-controls="esquema-contenidos-panel"
            className={cn(
              "fixed bottom-6 right-6 z-20 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold",
              esEducational
                ? "border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] shadow-[var(--interface-shadow)] transition-colors hover:bg-[var(--interface-surface)] xl:absolute xl:bottom-auto xl:right-0 xl:top-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] focus-visible:ring-offset-2"
                : esGamified
                  ? "border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] shadow-[0_0_20px_rgba(103,232,249,0.2)] transition-colors hover:border-[var(--interface-accent-secondary)] xl:absolute xl:bottom-auto xl:right-0 xl:top-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] focus-visible:ring-offset-2"
                  : cn(
                      "text-white",
                      CLASE_PANEL_GLASS,
                      "transition-colors hover:bg-white/32 xl:absolute xl:bottom-auto xl:right-0 xl:top-0",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]",
                    ),
            )}
          >
            <PanelRightOpen className="h-4 w-4 shrink-0" />
            {esGamified ? "Objetivos" : "Esquema"}
          </button>
        )}

        <div className="mx-auto w-full max-w-[1520px]">{children}</div>
      </section>

      {esquemaVisible && (
        <aside
          id="esquema-contenidos-panel"
          className={cn(
            "min-w-0 rounded-none xl:sticky xl:top-0 xl:h-full xl:max-h-dvh xl:self-start xl:border-t-0",
            esEducational
              ? "border-t border-[var(--interface-border)] bg-[var(--interface-surface)] shadow-none xl:border-l xl:border-t-0"
              : esGamified
                ? "border-t border-[var(--interface-border)] bg-[var(--interface-surface)] shadow-none xl:border-l xl:border-t-0"
                : cn(
                    "border-t border-white/25 xl:border-l",
                    CLASE_PANEL_GLASS,
                    "bg-white/20 shadow-none xl:rounded-l-none",
                  ),
          )}
        >
          <EsquemaContenidos
            cursoId={cursoId}
            enrollmentId={enrollmentId}
            leccionActivaId={leccionActivaId}
            evaluacionActivaId={evaluacionActivaId}
            grupos={grupos}
            progresoCurso={progresoCurso}
            onCerrar={alternarEsquema}
          />
        </aside>
      )}
    </div>
  );
}
