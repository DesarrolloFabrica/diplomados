"use client";

import { useState } from "react";
import { PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASE_PANEL_GLASS } from "@/config/paneles-glass";
import {
  EsquemaContenidos,
  type GrupoEsquema,
} from "@/components/shared/esquema-contenidos";

interface LayoutVistaLeccionProps {
  cursoId: string;
  leccionActivaId?: string;
  evaluacionActivaId?: string;
  grupos: GrupoEsquema[];
  children: React.ReactNode;
}

export function LayoutVistaLeccion({
  cursoId,
  leccionActivaId,
  evaluacionActivaId,
  grupos,
  children,
}: LayoutVistaLeccionProps) {
  const [esquemaVisible, setEsquemaVisible] = useState(true);

  function alternarEsquema() {
    setEsquemaVisible((prev) => !prev);
  }

  return (
    <div
      className={cn(
        "grid min-h-full w-full grid-cols-1",
        esquemaVisible && "xl:grid-cols-[minmax(0,1fr)_320px]",
      )}
    >
      <section className="relative min-w-0 px-5 py-6 sm:px-6 lg:px-10 lg:py-8">
        {!esquemaVisible && (
          <button
            type="button"
            onClick={alternarEsquema}
            aria-expanded={false}
            aria-controls="esquema-contenidos-panel"
            className={cn(
              "fixed bottom-6 right-6 z-20 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white",
              CLASE_PANEL_GLASS,
              "transition-colors hover:bg-white/32 xl:absolute xl:bottom-auto xl:right-0 xl:top-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]",
            )}
          >
            <PanelRightOpen className="h-4 w-4 shrink-0" />
            Esquema
          </button>
        )}

        {children}
      </section>

      {esquemaVisible && (
        <aside
          id="esquema-contenidos-panel"
          className={cn(
            "min-w-0 rounded-none border-t border-white/25 xl:sticky xl:top-0 xl:h-[calc(100vh-4rem)] xl:self-start xl:border-l xl:border-t-0",
            CLASE_PANEL_GLASS,
            "bg-white/16 shadow-none xl:rounded-l-none",
          )}
        >
          <EsquemaContenidos
            cursoId={cursoId}
            leccionActivaId={leccionActivaId}
            evaluacionActivaId={evaluacionActivaId}
            grupos={grupos}
            onCerrar={alternarEsquema}
          />
        </aside>
      )}
    </div>
  );
}
