"use client";

import { useEffect, useRef } from "react";
import { Check, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabContenido } from "@/lib/contenido-leccion";

interface RecursoSelectorAventura {
  id: TabContenido;
  etiqueta: string;
  Icono: LucideIcon;
  completado?: boolean;
}

interface SelectorRecursosAventuraProps {
  recursos: RecursoSelectorAventura[];
  activoId: TabContenido;
  onSeleccionar: (id: TabContenido) => void;
  variante?: "adventure" | "educational";
}

export function SelectorRecursosAventura({
  recursos,
  activoId,
  onSeleccionar,
  variante = "adventure",
}: SelectorRecursosAventuraProps) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const indiceActivo = Math.max(0, recursos.findIndex((item) => item.id === activoId));
  const esEducational = variante === "educational";

  function enfocarRecurso(id: TabContenido) {
    window.requestAnimationFrame(() => {
      const elemento = contenedorRef.current?.querySelector<HTMLElement>(
        `[data-recurso-aventura="${id}"]`,
      );
      elemento?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      elemento?.focus({ preventScroll: true });
    });
  }

  function seleccionarIndice(indice: number) {
    const recurso = recursos[indice];
    if (!recurso) return;
    onSeleccionar(recurso.id);
    enfocarRecurso(recurso.id);
  }

  useEffect(() => {
    const elemento = contenedorRef.current?.querySelector<HTMLElement>(
      `[data-recurso-aventura="${activoId}"]`,
    );
    elemento?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activoId]);

  return (
    <section className="resource-selector mx-auto w-fit max-w-full" data-player-layout="type-2">
      <div className="flex max-w-full items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => seleccionarIndice(indiceActivo - 1)}
          disabled={indiceActivo === 0}
          aria-label="Seleccionar recurso anterior"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full border shadow-[0_4px_12px_rgba(15,23,42,0.2)] transition-[transform,background-color,opacity] duration-200 hover:-translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none",
            esEducational
              ? "border-[var(--study-border)] bg-[var(--study-control-bg)] text-[var(--study-control-text)] hover:bg-[var(--study-control-bg-hover)]"
              : "border-white/75 bg-white/85 text-slate-700 hover:bg-white",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <div
          ref={contenedorRef}
          className="min-w-0 max-w-[calc(100vw-8rem)] overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:max-w-[min(68vw,42rem)]"
        >
          <div
            role="tablist"
            aria-label="Recursos de la lección"
            className="flex min-w-max snap-x snap-mandatory items-stretch justify-center gap-2 px-1 py-1"
          >
            {recursos.map(({ id, etiqueta, Icono, completado = false }, indice) => {
              const activo = id === activoId;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  aria-label={`${etiqueta}${completado ? ", completado" : ""}`}
                  tabIndex={activo ? 0 : -1}
                  data-recurso-aventura={id}
                  onClick={() => seleccionarIndice(indice)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowLeft") {
                      event.preventDefault();
                      seleccionarIndice(Math.max(0, indice - 1));
                    } else if (event.key === "ArrowRight") {
                      event.preventDefault();
                      seleccionarIndice(Math.min(recursos.length - 1, indice + 1));
                    } else if (event.key === "Home") {
                      event.preventDefault();
                      seleccionarIndice(0);
                    } else if (event.key === "End") {
                      event.preventDefault();
                      seleccionarIndice(recursos.length - 1);
                    }
                  }}
                  className={cn(
                    "group flex w-20 snap-center flex-col items-center gap-2 rounded-xl px-1 py-1.5 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] motion-reduce:transition-none sm:w-24",
                    esEducational
                      ? "text-[var(--study-text-muted)]"
                      : "text-[var(--interface-text-muted)]",
                    activo &&
                      (esEducational
                        ? "font-bold text-[var(--study-text)]"
                        : "font-bold text-[var(--interface-text)]"),
                    completado &&
                      (esEducational
                        ? "font-bold text-[var(--study-success-text)]"
                        : "font-bold text-emerald-700"),
                  )}
                >
                  <span
                    className={cn(
                      "grid size-12 shrink-0 place-items-center rounded-full border shadow-[0_4px_12px_rgba(15,23,42,0.18)] transition-[transform,border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none",
                      completado
                        ? esEducational
                          ? cn(
                              "border-[var(--study-success)] bg-[var(--study-success-bg)] text-[var(--study-success)] shadow-[0_4px_12px_rgba(15,23,42,0.14),0_0_16px_color-mix(in_srgb,var(--study-success)_30%,transparent)]",
                              activo
                                ? "scale-110 ring-2 ring-[var(--study-success)]/35"
                                : "group-hover:scale-105",
                            )
                          : cn(
                              "border-emerald-500 bg-emerald-50/95 text-emerald-600 shadow-[0_4px_12px_rgba(15,23,42,0.18),0_0_18px_rgba(34,197,94,0.34)]",
                              activo
                                ? "scale-110 ring-2 ring-emerald-400/45"
                                : "group-hover:scale-105",
                            )
                        : activo
                          ? esEducational
                            ? "scale-110 border-[var(--interface-accent-secondary)] bg-[var(--study-control-bg-hover)] text-[var(--interface-accent-secondary)] shadow-[0_4px_12px_rgba(15,23,42,0.18),var(--interface-glow)]"
                            : "scale-110 border-[var(--interface-accent-secondary)] bg-white/95 text-[var(--interface-accent-secondary)] shadow-[0_4px_12px_rgba(15,23,42,0.18),0_0_18px_rgba(103,232,249,0.34)]"
                          : esEducational
                            ? "border-[var(--study-border)] bg-[var(--study-control-bg)] text-[var(--study-control-text)] group-hover:scale-105 group-hover:border-[var(--interface-accent-secondary)] group-hover:bg-[var(--study-control-bg-hover)] group-hover:text-[var(--interface-accent-secondary)] group-focus-visible:scale-105"
                            : "border-white/60 bg-white/70 text-slate-700 group-hover:scale-105 group-hover:border-[var(--interface-accent-secondary)] group-hover:bg-white/90 group-hover:text-[var(--interface-accent-secondary)] group-focus-visible:scale-105",
                    )}
                  >
                    {completado ? (
                      <Check className="size-7 stroke-[2.5]" aria-hidden="true" />
                    ) : (
                      <Icono className="size-5" aria-hidden="true" />
                    )}
                  </span>
                  <span className="block max-w-full truncate text-[11px] font-semibold">{etiqueta}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => seleccionarIndice(indiceActivo + 1)}
          disabled={indiceActivo === recursos.length - 1}
          aria-label="Seleccionar recurso siguiente"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full border shadow-[0_4px_12px_rgba(15,23,42,0.2)] transition-[transform,background-color,opacity] duration-200 hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none",
            esEducational
              ? "border-[var(--study-border)] bg-[var(--study-control-bg)] text-[var(--study-control-text)] hover:bg-[var(--study-control-bg-hover)]"
              : "border-white/75 bg-white/85 text-slate-700 hover:bg-white",
          )}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
