"use client";

import { useState } from "react";
import { PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EsquemaContenidos,
  type GrupoEsquema,
} from "@/components/shared/esquema-contenidos";

interface LayoutVistaLeccionProps {
  cursoId: string;
  leccionActivaId: string;
  grupos: GrupoEsquema[];
  children: React.ReactNode;
}

export function LayoutVistaLeccion({
  cursoId,
  leccionActivaId,
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
        "mx-auto grid max-w-[1600px] grid-cols-1",
        esquemaVisible && "xl:grid-cols-[minmax(0,1fr)_300px]",
      )}
    >
      <section className="relative px-5 py-6 sm:px-6 lg:px-10 lg:py-8">
        {!esquemaVisible && (
          <button
            type="button"
            onClick={alternarEsquema}
            aria-expanded={false}
            aria-controls="esquema-contenidos-panel"
            className={cn(
              "fixed bottom-6 right-6 z-20 inline-flex items-center gap-2 rounded-full",
              "border border-border/80 bg-card px-4 py-2.5 text-sm font-medium shadow-md",
              "text-foreground transition-colors hover:bg-muted/70 xl:absolute xl:bottom-auto xl:right-0 xl:top-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
            )}
          >
            <PanelRightOpen className="h-4 w-4 shrink-0" />
            Esquema
          </button>
        )}

        {children}
      </section>

      {esquemaVisible && (
        <div
          id="esquema-contenidos-panel"
          className="border-t border-border xl:sticky xl:top-0 xl:h-[calc(100vh-4rem)] xl:border-t-0 xl:self-start"
        >
          <EsquemaContenidos
            cursoId={cursoId}
            leccionActivaId={leccionActivaId}
            grupos={grupos}
            onCerrar={alternarEsquema}
          />
        </div>
      )}
    </div>
  );
}
