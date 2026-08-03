"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  Circle,
  CircleCheck,
  CircleDashed,
  FileText,
  Headphones,
  PanelRightClose,
  PlayCircle,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ItemEsquemaLeccion {
  id: string;
  titulo: string;
  tipoContenido: "texto" | "video" | "archivo" | "mixto";
  completada: boolean;
}

export interface ItemEsquemaEvaluacion {
  id: string;
  titulo: string;
  completada: boolean;
}

export interface GrupoEsquema {
  id: string;
  titulo: string;
  lecciones: ItemEsquemaLeccion[];
  evaluaciones: ItemEsquemaEvaluacion[];
}

type EstadoModulo = "no-iniciado" | "en-progreso" | "completado";

interface EsquemaContenidosProps {
  cursoId: string;
  leccionActivaId: string;
  grupos: GrupoEsquema[];
  onCerrar?: () => void;
}

function IconoLeccion({ tipo }: { tipo: ItemEsquemaLeccion["tipoContenido"] }) {
  if (tipo === "video") return <PlayCircle className="h-4 w-4 shrink-0" />;
  if (tipo === "archivo") return <FileText className="h-4 w-4 shrink-0" />;
  if (tipo === "mixto") return <Headphones className="h-4 w-4 shrink-0" />;
  return <BookOpen className="h-4 w-4 shrink-0" />;
}

function calcularProgresoModulo(grupo: GrupoEsquema) {
  const elementos = [
    ...grupo.lecciones.map((l) => ({ completado: l.completada })),
    ...grupo.evaluaciones.map((e) => ({ completado: e.completada })),
  ];
  const total = elementos.length;
  const completados = elementos.filter((e) => e.completado).length;
  const porcentaje = total === 0 ? 0 : Math.round((completados / total) * 100);

  const estado: EstadoModulo =
    completados === 0
      ? "no-iniciado"
      : completados === total
        ? "completado"
        : "en-progreso";

  return { total, completados, porcentaje, estado };
}

function IndicadorEstadoModulo({
  estado,
  porcentaje,
}: {
  estado: EstadoModulo;
  porcentaje: number;
}) {
  if (estado === "completado") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <CircleCheck className="h-3.5 w-3.5" />
        Completado
      </span>
    );
  }

  if (estado === "en-progreso") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400">
        <CircleDashed className="h-3.5 w-3.5" />
        {porcentaje}%
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
      <Circle className="h-3.5 w-3.5" />
      No iniciado
    </span>
  );
}

function IconoEstadoModulo({ estado }: { estado: EstadoModulo }) {
  if (estado === "completado") {
    return <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />;
  }
  if (estado === "en-progreso") {
    return <CircleDashed className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />;
  }
  return <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

export function EsquemaContenidos({
  cursoId,
  leccionActivaId,
  grupos,
  onCerrar,
}: EsquemaContenidosProps) {
  const grupoActivoId =
    grupos.find((g) => g.lecciones.some((l) => l.id === leccionActivaId))?.id ??
    grupos[0]?.id;

  const [abiertos, setAbiertos] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(grupos.map((g) => [g.id, g.id === grupoActivoId])),
  );

  function alternar(id: string) {
    setAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <aside className="lesson-outline flex h-full flex-col border-border bg-card/50 xl:border-l">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">
          Esquema de Contenidos
        </h2>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Ocultar esquema de contenidos"
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-md p-1.5",
              "text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
            )}
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {grupos.map((grupo, indice) => {
          const abierto = abiertos[grupo.id] ?? false;
          const { porcentaje, estado } = calcularProgresoModulo(grupo);

          return (
            <div key={grupo.id} className="rounded-xl">
              <div className="space-y-2 px-1">
                <button
                  type="button"
                  onClick={() => alternar(grupo.id)}
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/70"
                >
                  <ChevronDown
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      !abierto && "-rotate-90",
                    )}
                  />
                  <IconoEstadoModulo estado={estado} />
                  <span className="min-w-0 flex-1 whitespace-normal break-words text-sm font-semibold text-foreground">
                    Módulo {indice + 1}: {grupo.titulo}
                  </span>
                  <IndicadorEstadoModulo estado={estado} porcentaje={porcentaje} />
                </button>

                <div
                  role="progressbar"
                  aria-label={`Progreso de Módulo ${indice + 1}: ${grupo.titulo}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={porcentaje}
                  className="mx-2 h-1.5 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width]",
                      estado === "completado"
                        ? "bg-gradient-to-r from-teal-500 to-[#91dc00]"
                        : estado === "en-progreso"
                          ? "bg-gradient-to-r from-teal-600 to-teal-400"
                          : "bg-transparent",
                    )}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>

              {abierto && (
                <ul className="mb-2 ml-2 mt-1 space-y-0.5 border-l border-border/80 pl-2">
                  {grupo.lecciones.map((leccion) => {
                    const activa = leccion.id === leccionActivaId;
                    return (
                      <li key={leccion.id}>
                        <Link
                          href={`/mis-cursos/${cursoId}/lecciones/${leccion.id}`}
                          className={cn(
                            "group flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                            activa
                              ? "border-l-2 border-emerald-600 bg-emerald-50 font-medium text-emerald-800 dark:border-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "border-l-2 border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5",
                              activa
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-muted-foreground group-hover:text-foreground",
                            )}
                          >
                            <IconoLeccion tipo={leccion.tipoContenido} />
                          </span>
                          <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                            {leccion.titulo}
                          </span>
                        </Link>
                      </li>
                    );
                  })}

                  {grupo.evaluaciones.map((evaluacion) => (
                    <li key={evaluacion.id}>
                      <Link
                        href={`/mis-cursos/${cursoId}/evaluaciones/${evaluacion.id}`}
                        className={cn(
                          "group flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          "border-l-2 border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                          evaluacion.completada && "text-emerald-700/80 dark:text-emerald-400/90",
                        )}
                      >
                        <Trophy
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            evaluacion.completada
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                          {evaluacion.titulo}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        {grupos.length === 0 && (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            No hay contenidos disponibles.
          </p>
        )}
      </nav>
    </aside>
  );
}
