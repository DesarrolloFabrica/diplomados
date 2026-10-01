"use client";

import Link from "next/link";
import { PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calcularProgresoModulo,
  type GrupoEsquema,
} from "@/components/shared/esquema-contenidos";

interface RailModulosAventuraProps {
  cursoId: string;
  grupos: GrupoEsquema[];
  leccionActivaId?: string;
  evaluacionActivaId?: string;
  onExpandir?: () => void;
}

function destinoModulo(
  cursoId: string,
  grupo: GrupoEsquema,
  leccionActivaId?: string,
  evaluacionActivaId?: string,
): string | null {
  const leccionActiva = grupo.lecciones.find((item) => item.id === leccionActivaId);
  if (leccionActiva && !leccionActiva.bloqueado) {
    return `/mis-cursos/${cursoId}/lecciones/${leccionActiva.id}`;
  }

  const evaluacionActiva = grupo.evaluaciones.find(
    (item) => item.id === evaluacionActivaId,
  );
  if (evaluacionActiva && !evaluacionActiva.bloqueado) {
    return `/mis-cursos/${cursoId}/evaluaciones/${evaluacionActiva.id}`;
  }

  const primeraLeccionDisponible = grupo.lecciones.find((item) => !item.bloqueado);
  if (primeraLeccionDisponible) {
    return `/mis-cursos/${cursoId}/lecciones/${primeraLeccionDisponible.id}`;
  }

  const primeraEvaluacionDisponible = grupo.evaluaciones.find((item) => !item.bloqueado);
  return primeraEvaluacionDisponible
    ? `/mis-cursos/${cursoId}/evaluaciones/${primeraEvaluacionDisponible.id}`
    : null;
}

export function RailModulosAventura({
  cursoId,
  grupos,
  leccionActivaId,
  evaluacionActivaId,
  onExpandir,
}: RailModulosAventuraProps) {
  return (
    <aside className="relative flex h-full min-h-dvh w-20 flex-col items-center border-l border-[var(--interface-border)] bg-[color-mix(in_srgb,var(--interface-surface)_88%,transparent)] px-2 py-4 backdrop-blur-lg">
      {onExpandir && (
        <button
          type="button"
          onClick={onExpandir}
          aria-label="Expandir esquema de contenidos"
          className="mb-5 hidden size-9 place-items-center rounded-full border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text-muted)] transition-colors hover:text-[var(--interface-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] xl:grid"
        >
          <PanelRightOpen className="size-4" aria-hidden="true" />
        </button>
      )}

      <nav className="flex flex-1 flex-col items-center justify-center gap-3" aria-label="Módulos del curso">
        {grupos.map((grupo, indice) => {
          const activo =
            grupo.lecciones.some((item) => item.id === leccionActivaId) ||
            grupo.evaluaciones.some((item) => item.id === evaluacionActivaId);
          const progreso = calcularProgresoModulo(grupo);
          const destino = destinoModulo(
            cursoId,
            grupo,
            leccionActivaId,
            evaluacionActivaId,
          );
          const tooltipId = `rail-aventura-modulo-${grupo.id}`;
          const contenidoNodo = (
            <>
              <span
                className={cn(
                  "grid place-items-center rounded-full border text-xs font-extrabold tabular-nums transition-[transform,box-shadow,border-color] duration-200 motion-reduce:transition-none",
                  activo
                    ? "size-14 border-[var(--interface-accent-secondary)] bg-[var(--interface-surface-strong)] text-[var(--interface-accent-secondary)] shadow-[0_0_0_5px_color-mix(in_srgb,var(--interface-accent-secondary)_14%,transparent),0_0_20px_rgba(103,232,249,0.3)] group-hover:scale-[1.06] group-focus-visible:scale-[1.06]"
                    : "size-8 border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text-muted)] group-hover:scale-125 group-hover:border-[var(--interface-accent-secondary)] group-focus-visible:scale-125 group-focus-visible:border-[var(--interface-accent-secondary)]",
                  !destino && "opacity-45",
                )}
              >
                {indice + 1}
              </span>
              <span
                id={tooltipId}
                role="tooltip"
                className="pointer-events-none absolute right-[calc(100%+0.75rem)] top-1/2 z-50 w-64 -translate-y-1/2 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] p-3 text-left text-[#10243f] opacity-0 shadow-[0_16px_36px_rgba(3,16,36,0.3)] transition-[opacity,transform] duration-200 group-hover:-translate-x-1 group-hover:opacity-100 group-focus-visible:-translate-x-1 group-focus-visible:opacity-100 motion-reduce:transition-none"
              >
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#08778f]">
                  Módulo {indice + 1}
                </span>
                <span className="mt-1 block text-sm font-bold leading-snug">{grupo.titulo}</span>
                <span className="mt-2 block text-xs text-[#52657d]">
                  {progreso.completados}/{progreso.total} completados · {progreso.porcentaje}%
                </span>
              </span>
            </>
          );

          return destino ? (
            <Link
              key={grupo.id}
              href={destino}
              aria-current={activo ? "page" : undefined}
              aria-describedby={tooltipId}
              aria-label={`Módulo ${indice + 1}: ${grupo.titulo}. ${progreso.completados} de ${progreso.total} completados`}
              className="group relative grid h-16 w-16 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] focus-visible:ring-offset-2"
            >
              {contenidoNodo}
            </Link>
          ) : (
            <button
              key={grupo.id}
              type="button"
              aria-disabled="true"
              aria-describedby={tooltipId}
              aria-label={`Módulo ${indice + 1}: ${grupo.titulo}. Bloqueado`}
              onClick={(event) => event.preventDefault()}
              className="group relative grid h-16 w-16 cursor-not-allowed place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] focus-visible:ring-offset-2"
            >
              {contenidoNodo}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
