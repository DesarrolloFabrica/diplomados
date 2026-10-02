"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  ClipboardCheck,
  LockKeyhole,
  type LucideIcon,
} from "lucide-react";
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
  progresoCurso: {
    porcentaje: number;
    completados: number;
    total: number;
  };
  onExpandir?: () => void;
}

interface ItemModuloRail {
  id: string;
  tipo: "leccion" | "evaluacion";
  titulo: string;
  completada: boolean;
  bloqueado: boolean;
}

function itemsDelModulo(grupo: GrupoEsquema): ItemModuloRail[] {
  return [
    ...grupo.lecciones.map((leccion) => ({
      id: leccion.id,
      tipo: "leccion" as const,
      titulo: leccion.titulo,
      completada: leccion.completada,
      bloqueado: leccion.bloqueado ?? false,
    })),
    ...grupo.evaluaciones.map((evaluacion) => ({
      id: evaluacion.id,
      tipo: "evaluacion" as const,
      titulo: evaluacion.titulo,
      completada: evaluacion.completada,
      bloqueado: evaluacion.bloqueado ?? false,
    })),
  ];
}

function moduloDisponible(grupo: GrupoEsquema): boolean {
  return itemsDelModulo(grupo).some((item) => !item.bloqueado);
}

function hrefItem(cursoId: string, item: ItemModuloRail): string {
  return item.tipo === "leccion"
    ? `/mis-cursos/${cursoId}/lecciones/${item.id}`
    : `/mis-cursos/${cursoId}/evaluaciones/${item.id}`;
}

function iconoItem(item: ItemModuloRail, activo: boolean): LucideIcon | null {
  if (item.bloqueado) return LockKeyhole;
  if (item.tipo === "evaluacion") return item.completada ? CircleCheck : ClipboardCheck;
  if (item.completada) return CircleCheck;
  if (activo) return CircleDashed;
  return null;
}

/** Fondo plateado para distinguir los quices de las lecciones en la lista del flyout. */
function claseEstadoItemFlyout(item: ItemModuloRail, activo: boolean): string {
  if (item.bloqueado) {
    return "border-[var(--interface-border)] text-[var(--interface-text-muted)] opacity-60";
  }
  if (item.tipo === "evaluacion") {
    return "border-[#64748B] bg-gradient-to-br from-[#E2E8F0] to-[#94A3B8] text-[#1E293B]";
  }
  if (item.completada) {
    return "border-[var(--interface-accent)] bg-[var(--interface-accent)] text-[var(--interface-accent-foreground)]";
  }
  if (activo) {
    return "border-[var(--interface-accent-secondary)] bg-[var(--interface-accent-secondary)] text-[var(--interface-accent-foreground)]";
  }
  return "border-[var(--interface-border)] text-[var(--interface-text-muted)]";
}

/** Misma idea que `claseEstadoItemFlyout`, pero para el circulo grande del rail colapsado (fondo neutro + borde de color en vez de relleno solido, salvo quices/completadas). */
function claseEstadoItemRail(item: ItemModuloRail, activo: boolean): string {
  if (item.tipo === "evaluacion" && !item.bloqueado) {
    return "border-[#64748B] bg-gradient-to-br from-[#E2E8F0] to-[#94A3B8] text-[#1E293B]";
  }
  if (item.completada) {
    return "border-[var(--interface-accent)] bg-[var(--interface-accent)] text-[var(--interface-accent-foreground)]";
  }
  if (activo) {
    return "border-[var(--interface-accent-secondary)] bg-[var(--interface-surface-strong)] text-[var(--interface-accent-secondary)]";
  }
  return "border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text-muted)]";
}

export function RailModulosAventura({
  cursoId,
  grupos,
  leccionActivaId,
  evaluacionActivaId,
  progresoCurso,
  onExpandir,
}: RailModulosAventuraProps) {
  const indiceModuloActivo = Math.max(
    0,
    grupos.findIndex(
      (grupo) =>
        grupo.lecciones.some((leccion) => leccion.id === leccionActivaId) ||
        grupo.evaluaciones.some((evaluacion) => evaluacion.id === evaluacionActivaId),
    ),
  );
  const [indiceVisible, setIndiceVisible] = useState(indiceModuloActivo);
  const [flyoutAbierto, setFlyoutAbierto] = useState(false);
  const disparadorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIndiceVisible(indiceModuloActivo);
  }, [indiceModuloActivo]);

  useEffect(() => {
    if (!flyoutAbierto) return;

    function alHacerClickFuera(event: MouseEvent) {
      if (disparadorRef.current && !disparadorRef.current.contains(event.target as Node)) {
        setFlyoutAbierto(false);
      }
    }

    document.addEventListener("mousedown", alHacerClickFuera);
    return () => document.removeEventListener("mousedown", alHacerClickFuera);
  }, [flyoutAbierto]);

  const grupoVisible = grupos[indiceVisible] ?? grupos[0];
  if (!grupoVisible) return null;

  const items = itemsDelModulo(grupoVisible);

  let indicePrevio: number | null = null;
  for (let indice = indiceVisible - 1; indice >= 0; indice -= 1) {
    if (moduloDisponible(grupos[indice]!)) {
      indicePrevio = indice;
      break;
    }
  }

  let indiceSiguiente: number | null = null;
  for (let indice = indiceVisible + 1; indice < grupos.length; indice += 1) {
    if (moduloDisponible(grupos[indice]!)) {
      indiceSiguiente = indice;
      break;
    }
  }

  const contenidoFlyout = (
    <div className="absolute right-full top-1/2 z-50 mr-3 w-80 max-w-[min(88vw,320px)] -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] shadow-[0_20px_48px_rgba(6,17,32,0.28)] backdrop-blur-md">
      <div className="border-b border-[var(--interface-border)] px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold">
          <span className="text-[var(--interface-text-muted)]">Progreso del curso</span>
          <span className="tabular-nums">{progresoCurso.porcentaje}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--interface-border)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--interface-accent),var(--interface-accent-secondary))]"
            style={{ width: `${progresoCurso.porcentaje}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--interface-text-muted)]">
          {progresoCurso.completados} de {progresoCurso.total} contenidos completados
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-[var(--interface-border)] px-3 py-2.5">
        <button
          type="button"
          onClick={() => indicePrevio !== null && setIndiceVisible(indicePrevio)}
          disabled={indicePrevio === null}
          aria-label="Modulo anterior"
          className="grid size-7 shrink-0 place-items-center rounded-full border border-[var(--interface-border)] text-[var(--interface-text-muted)] transition-colors hover:border-[var(--interface-accent-secondary)] hover:text-[var(--interface-accent-secondary)] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-xs font-bold">
          Modulo {indiceVisible + 1}: {grupoVisible.titulo}
          <span className="ml-1.5 font-semibold text-[var(--interface-text-muted)]">
            {calcularProgresoModulo(grupoVisible).porcentaje}%
          </span>
        </p>
        <button
          type="button"
          onClick={() => indiceSiguiente !== null && setIndiceVisible(indiceSiguiente)}
          disabled={indiceSiguiente === null}
          aria-label="Modulo siguiente"
          className="grid size-7 shrink-0 place-items-center rounded-full border border-[var(--interface-border)] text-[var(--interface-text-muted)] transition-colors hover:border-[var(--interface-accent-secondary)] hover:text-[var(--interface-accent-secondary)] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[50vh] space-y-1 overflow-y-auto px-2 py-2.5">
        {items.map((item, indice) => {
          const activo =
            item.tipo === "leccion"
              ? item.id === leccionActivaId
              : item.id === evaluacionActivaId;
          const Icono = iconoItem(item, activo);

          const contenido = (
            <>
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                  claseEstadoItemFlyout(item, activo),
                )}
              >
                {Icono ? <Icono className="size-3.5" aria-hidden="true" /> : indice + 1}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-left text-xs font-semibold",
                  activo ? "text-[var(--interface-text)]" : "text-[var(--interface-text-muted)]",
                )}
              >
                {item.titulo}
              </span>
            </>
          );

          return item.bloqueado ? (
            <div key={item.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 opacity-70">
              {contenido}
            </div>
          ) : (
            <Link
              key={item.id}
              href={hrefItem(cursoId, item)}
              onClick={() => setFlyoutAbierto(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[color-mix(in_srgb,var(--interface-accent-secondary)_10%,transparent)]",
                activo && "bg-[color-mix(in_srgb,var(--interface-accent-secondary)_12%,transparent)]",
              )}
            >
              {contenido}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="relative flex h-full min-h-dvh w-20 flex-col items-center px-2 py-4">
      <nav
        className="flex flex-1 flex-col items-center justify-center gap-2.5"
        aria-label="Lecciones del modulo actual"
      >
        {items.map((item, indice) => {
          const activo =
            item.tipo === "leccion"
              ? item.id === leccionActivaId
              : item.id === evaluacionActivaId;
          const Icono = iconoItem(item, activo);

          const nodo = (
            <span
              className={cn(
                "grid place-items-center rounded-full border text-xs font-extrabold tabular-nums transition-[transform,box-shadow,border-color] duration-200 motion-reduce:transition-none",
                activo ? "size-11" : "size-8",
                claseEstadoItemRail(item, activo),
                activo &&
                  "shadow-[0_0_0_5px_color-mix(in_srgb,var(--interface-accent-secondary)_14%,transparent),0_0_20px_rgba(103,232,249,0.3)]",
                item.bloqueado && "opacity-50",
              )}
            >
              {Icono ? <Icono className="size-4" aria-hidden="true" /> : indice + 1}
            </span>
          );

          if (item.bloqueado) {
            return (
              <button
                key={item.id}
                type="button"
                aria-disabled="true"
                aria-label={`${item.titulo}. Bloqueado`}
                onClick={(event) => event.preventDefault()}
                className="grid h-12 w-12 cursor-not-allowed place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] focus-visible:ring-offset-2"
              >
                {nodo}
              </button>
            );
          }

          if (activo) {
            const tooltipId = `rail-aventura-activo-${item.id}`;
            return (
              <div key={item.id} ref={disparadorRef} className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    setFlyoutAbierto((valor) => !valor);
                    onExpandir?.();
                  }}
                  aria-haspopup="true"
                  aria-expanded={flyoutAbierto}
                  aria-describedby={tooltipId}
                  aria-label={`${item.titulo}. Abrir esquema de contenidos`}
                  className="grid h-12 w-12 place-items-center rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] focus-visible:ring-offset-2"
                >
                  {nodo}
                </button>

                {!flyoutAbierto && (
                  <span
                    id={tooltipId}
                    role="tooltip"
                    className="pointer-events-none absolute right-[calc(100%+0.75rem)] top-1/2 z-40 w-56 -translate-y-1/2 rounded-xl border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] p-3 text-left text-[var(--interface-text)] opacity-0 shadow-[0_16px_36px_rgba(3,16,36,0.3)] transition-[opacity,transform] duration-200 group-hover:-translate-x-1 group-hover:opacity-100 group-focus-within:-translate-x-1 group-focus-within:opacity-100 motion-reduce:transition-none"
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--interface-accent-secondary)]">
                      Leccion actual
                    </span>
                    <span className="mt-1 block text-sm font-bold leading-snug">{item.titulo}</span>
                    <span className="mt-2 block text-xs text-[var(--interface-text-muted)]">
                      Clic para ver el esquema de contenidos
                    </span>
                  </span>
                )}

                {flyoutAbierto && contenidoFlyout}
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={hrefItem(cursoId, item)}
              aria-label={item.titulo}
              className="grid h-12 w-12 place-items-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] focus-visible:ring-offset-2"
            >
              {nodo}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
