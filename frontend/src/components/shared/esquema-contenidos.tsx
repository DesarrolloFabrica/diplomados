"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  CircleCheck,
  CircleDashed,
  ClipboardCheck,
  LockKeyhole,
  PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgresoCursoLeccion } from "@/components/shared/progreso-curso-leccion";
import { useInterfaceVariant } from "@/components/providers/interface-variant-provider";
import type { TabContenido } from "@/lib/contenido-leccion";
import {
  EVENTO_LECCION_INICIADA,
  obtenerLeccionesIniciadas,
} from "@/lib/progreso-leccion-local";

const TINTE_ACTIVO_EDUCATIONAL = {
  backgroundColor: "color-mix(in srgb, var(--interface-accent-secondary) 14%, transparent)",
};
const TINTE_BLOQUEADO_EDUCATIONAL = {
  backgroundColor: "color-mix(in srgb, var(--interface-text) 6%, transparent)",
};

export interface ItemEsquemaLeccion {
  id: string;
  titulo: string;
  tipoContenido: "texto" | "video" | "archivo" | "mixto";
  completada: boolean;
  bloqueado?: boolean;
  categoriasContenido?: TabContenido[];
}

export interface ItemEsquemaEvaluacion {
  id: string;
  titulo: string;
  completada: boolean;
  intentosUsados?: number;
  bloqueado?: boolean;
}

export interface GrupoEsquema {
  id: string;
  titulo: string;
  lecciones: ItemEsquemaLeccion[];
  evaluaciones: ItemEsquemaEvaluacion[];
}

type EstadoModulo = "no-iniciado" | "en-progreso" | "completado";
type EstadoQuiz = "pendiente" | "en-progreso" | "completado" | "bloqueado";

interface EsquemaContenidosProps {
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
  onCerrar?: () => void;
}

function IconoLeccion({
  completada,
  iniciada,
  bloqueada,
}: {
  completada: boolean;
  iniciada: boolean;
  bloqueada: boolean;
}) {
  if (bloqueada) return <LockKeyhole className="h-4 w-4 shrink-0" />;
  if (completada) return <CircleCheck className="h-4 w-4 shrink-0" />;
  if (iniciada) return <CircleDashed className="h-4 w-4 shrink-0" />;
  return <LockKeyhole className="h-4 w-4 shrink-0" />;
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

function estadoQuiz(evaluacion: ItemEsquemaEvaluacion): EstadoQuiz {
  if (evaluacion.bloqueado) return "bloqueado";
  if (evaluacion.completada) return "completado";
  if ((evaluacion.intentosUsados ?? 0) > 0) return "en-progreso";
  return "pendiente";
}

function IconoEstadoQuiz({ estado }: { estado: EstadoQuiz }) {
  if (estado === "bloqueado") {
    return <LockKeyhole className="h-4 w-4 shrink-0 text-white/45" />;
  }
  return (
    <ClipboardCheck
      className={cn(
        "h-4 w-4 shrink-0",
        estado === "completado"
          ? "text-emerald-400"
          : estado === "en-progreso"
            ? "text-teal-300"
            : "text-white/45",
      )}
    />
  );
}

function etiquetaEstadoLeccion(
  completada: boolean,
  iniciada: boolean,
  bloqueada: boolean,
) {
  if (bloqueada) return "Bloqueado";
  if (completada) return "Completado";
  if (iniciada) return "En progreso";
  return "No iniciado";
}

function etiquetaEstadoQuiz(estado: EstadoQuiz) {
  if (estado === "completado") return "Completado";
  if (estado === "en-progreso") return "En progreso";
  if (estado === "bloqueado") return "Bloqueado";
  return "No iniciado";
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
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-300">
        <CircleCheck className="h-3.5 w-3.5" />
        Completado
      </span>
    );
  }

  if (estado === "en-progreso") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-teal-200">
        <CircleDashed className="h-3.5 w-3.5" />
        {porcentaje}%
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-white/55">
      <LockKeyhole className="h-3.5 w-3.5" />
      No iniciado
    </span>
  );
}

function IconoEstadoModulo({ estado }: { estado: EstadoModulo }) {
  if (estado === "completado") {
    return <CircleCheck className="h-4 w-4 shrink-0 text-emerald-400" />;
  }
  if (estado === "en-progreso") {
    return <CircleDashed className="h-4 w-4 shrink-0 text-teal-300" />;
  }
  return <LockKeyhole className="h-4 w-4 shrink-0 text-white/45" />;
}

export function EsquemaContenidos({
  cursoId,
  enrollmentId,
  leccionActivaId,
  evaluacionActivaId,
  grupos,
  progresoCurso,
  onCerrar,
}: EsquemaContenidosProps) {
  const { config } = useInterfaceVariant();
  const esEducational = config.id === "educational";
  const esGamified = config.id === "gamified";

  const claseTextoPrincipal = esEducational ? "text-[var(--interface-text)]" : "text-white";
  const claseTextoMuted = esEducational
    ? "text-[var(--interface-text-muted)]"
    : "text-white/55";
  const claseTextoMutedTenue = esEducational
    ? "text-[var(--interface-text-muted)]"
    : "text-white/45";
  const claseBordeSutil = esEducational ? "border-[var(--interface-border)]" : "border-white/20";
  const claseBordeMuyTenue = esEducational
    ? "border-[var(--interface-border)]"
    : "border-white/12";
  const claseHoverSutil = esEducational
    ? "hover:text-[var(--interface-text)]"
    : "hover:text-white";
  const claseHoverFondo = esEducational
    ? "hover:bg-[color-mix(in_srgb,var(--interface-accent)_8%,transparent)]"
    : "hover:bg-white/10";
  const claseHoverFondo12 = esEducational
    ? "hover:bg-[color-mix(in_srgb,var(--interface-accent)_10%,transparent)]"
    : "hover:bg-white/12";
  const claseTrackProgreso = esEducational ? "bg-[var(--interface-border)]" : "bg-white/20";

  const [leccionesIniciadas, setLeccionesIniciadas] = useState<Set<string>>(
    () => new Set(),
  );
  const grupoActivoId =
    grupos.find(
      (g) =>
        g.lecciones.some((l) => l.id === leccionActivaId) ||
        g.evaluaciones.some((e) => e.id === evaluacionActivaId),
    )?.id ?? grupos[0]?.id;

  const [abiertos, setAbiertos] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(grupos.map((g) => [g.id, g.id === grupoActivoId])),
  );

  const [quicesAbiertos, setQuicesAbiertos] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      grupos.map((g) => [
        g.id,
        g.evaluaciones.some((e) => e.id === evaluacionActivaId),
      ]),
    ),
  );

  useEffect(() => {
    function sincronizarLeccionesIniciadas() {
      setLeccionesIniciadas(obtenerLeccionesIniciadas(enrollmentId));
    }

    sincronizarLeccionesIniciadas();
    window.addEventListener("storage", sincronizarLeccionesIniciadas);
    window.addEventListener(EVENTO_LECCION_INICIADA, sincronizarLeccionesIniciadas);

    return () => {
      window.removeEventListener("storage", sincronizarLeccionesIniciadas);
      window.removeEventListener(
        EVENTO_LECCION_INICIADA,
        sincronizarLeccionesIniciadas,
      );
    };
  }, [enrollmentId]);

  function alternar(id: string) {
    setAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function alternarQuices(id: string) {
    setQuicesAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <aside className="flex h-full flex-col">
      <div className={cn("flex items-center justify-between gap-2 border-b px-4 py-3.5", claseBordeSutil)}>
        <h2 className={cn("text-sm font-semibold", claseTextoPrincipal)}>
          {esGamified ? "Objetivos del modulo" : "Esquema de contenidos"}
        </h2>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label={esGamified ? "Ocultar objetivos" : "Ocultar esquema de contenidos"}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-md p-1.5",
              "transition-colors",
              esEducational ? claseTextoMuted : "text-white/70",
              claseHoverFondo,
              claseHoverSutil,
              esEducational
                ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]"
                : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00]",
            )}
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <ProgresoCursoLeccion
        porcentaje={progresoCurso.porcentaje}
        completados={progresoCurso.completados}
        total={progresoCurso.total}
      />

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2.5">
        {grupos.map((grupo, indice) => {
          const abierto = abiertos[grupo.id] ?? false;
          const quicesAbiertosModulo = quicesAbiertos[grupo.id] ?? false;
          const progresoModulo = calcularProgresoModulo(grupo);
          const contieneContenidoActivo =
            grupo.lecciones.some((leccion) => leccion.id === leccionActivaId) ||
            grupo.evaluaciones.some(
              (evaluacion) => evaluacion.id === evaluacionActivaId,
            ) ||
            grupo.lecciones.some((leccion) => leccionesIniciadas.has(leccion.id));
          const estado =
            progresoModulo.estado === "no-iniciado" && contieneContenidoActivo
              ? "en-progreso"
              : progresoModulo.estado;
          const { porcentaje } = progresoModulo;

          return (
            <div key={grupo.id} className={cn("border-b pb-2 last:border-b-0", claseBordeMuyTenue)}>
              <div className="space-y-2 px-0.5">
                <button
                  type="button"
                  onClick={() => alternar(grupo.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg px-2 py-2.5 text-left transition-colors",
                    claseHoverFondo,
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 transition-transform",
                      claseTextoMuted,
                      !abierto && "-rotate-90",
                    )}
                  />
                  <IconoEstadoModulo estado={estado} />
                  <span
                    className={cn(
                      "min-w-0 flex-1 whitespace-normal break-words text-[13px] font-semibold leading-snug",
                      claseTextoPrincipal,
                    )}
                  >
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
                  className={cn("mx-2 h-1 overflow-hidden rounded-full", claseTrackProgreso)}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width]",
                      estado === "completado"
                        ? esEducational
                          ? "bg-[var(--interface-accent)]"
                          : "bg-gradient-to-r from-teal-500 to-[#91dc00]"
                        : estado === "en-progreso"
                          ? esEducational
                            ? "bg-[var(--interface-accent-secondary)]"
                            : "bg-gradient-to-r from-teal-600 to-teal-400"
                          : "bg-transparent",
                    )}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>

              {abierto && (
                <div className={cn("mb-1 ml-2 mt-1 space-y-1 border-l pl-2", claseBordeSutil)}>
                  <ul className="space-y-0.5">
                    {grupo.lecciones.map((leccion) => {
                      const activa = leccion.id === leccionActivaId;
                      const bloqueada = Boolean(leccion.bloqueado);
                      const iniciada =
                        activa || leccionesIniciadas.has(leccion.id);
                      const contenido = (
                        <>
                          <span
                            className={cn(
                              "mt-0.5",
                              bloqueada
                                ? claseTextoMutedTenue
                                : leccion.completada
                                  ? "text-emerald-300"
                                  : iniciada
                                    ? esEducational
                                      ? "text-[var(--interface-accent-secondary)]"
                                      : "text-[#91DC00]"
                                    : esEducational
                                      ? cn(claseTextoMuted, "group-hover:text-[var(--interface-text)]")
                                      : "text-white/55 group-hover:text-white/85",
                            )}
                          >
                            <IconoLeccion
                              completada={leccion.completada}
                              iniciada={iniciada}
                              bloqueada={bloqueada}
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block whitespace-normal break-words text-[13px] font-medium leading-snug">
                              {leccion.titulo}
                            </span>
                            <span
                              className={cn(
                                "mt-1 block text-[11px] leading-none",
                                bloqueada
                                  ? esEducational
                                    ? claseTextoMutedTenue
                                    : "text-white/40"
                                  : leccion.completada
                                    ? "text-emerald-300"
                                    : iniciada
                                      ? esEducational
                                        ? "text-[var(--interface-accent-secondary)]"
                                        : "text-teal-200"
                                      : claseTextoMutedTenue,
                              )}
                            >
                              {etiquetaEstadoLeccion(
                                leccion.completada,
                                iniciada,
                                bloqueada,
                              )}
                            </span>
                          </span>
                        </>
                      );
                      const clases = esEducational
                        ? cn(
                            "group flex items-start gap-2.5 rounded-lg border-l-2 px-2.5 py-2.5 text-sm transition-colors",
                            activa
                              ? "border-[var(--interface-accent-secondary)] font-semibold text-[var(--interface-text)]"
                              : bloqueada
                                ? cn("cursor-not-allowed border-transparent", claseTextoMutedTenue)
                                : cn(
                                    "border-transparent text-[var(--interface-text-muted)]",
                                    claseHoverFondo12,
                                    "hover:text-[var(--interface-text)]",
                                  ),
                          )
                        : cn(
                            "group flex items-start gap-2.5 rounded-lg border-l-2 px-2.5 py-2.5 text-sm transition-colors",
                            activa
                              ? esGamified
                                ? "border-[var(--interface-accent-secondary)] bg-[var(--interface-accent-secondary)]/[0.14] font-semibold text-white shadow-[0_0_16px_rgba(103,232,249,0.25)]"
                                : "border-[#91DC00] bg-[#91DC00]/14 font-semibold text-white shadow-[inset_0_0_18px_rgba(145,220,0,0.08)]"
                              : bloqueada
                                ? "cursor-not-allowed border-transparent bg-[#061120]/12 text-white/45"
                                : "border-transparent text-white/75 hover:bg-white/12 hover:text-white",
                          );
                      const estiloClases = !esEducational
                        ? undefined
                        : activa
                          ? TINTE_ACTIVO_EDUCATIONAL
                          : bloqueada
                            ? TINTE_BLOQUEADO_EDUCATIONAL
                            : undefined;

                      return (
                        <li key={leccion.id}>
                          {bloqueada ? (
                            <div className={clases} style={estiloClases} aria-disabled="true">
                              {contenido}
                            </div>
                          ) : (
                            <Link
                              href={`/mis-cursos/${cursoId}/lecciones/${leccion.id}`}
                              className={clases}
                              style={estiloClases}
                              aria-current={activa ? "page" : undefined}
                            >
                              {contenido}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {grupo.evaluaciones.length > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => alternarQuices(grupo.id)}
                        aria-expanded={quicesAbiertosModulo}
                        aria-controls={`quices-${grupo.id}`}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold transition-colors",
                          claseTextoPrincipal,
                          claseHoverFondo12,
                        )}
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform",
                            claseTextoMuted,
                            !quicesAbiertosModulo && "-rotate-90",
                          )}
                        />
                        <ClipboardCheck className={cn("h-4 w-4 shrink-0", claseTextoMuted)} />
                        <span>Quices ({grupo.evaluaciones.length})</span>
                      </button>

                      {quicesAbiertosModulo && (
                        <div id={`quices-${grupo.id}`}>
                          <ul className={cn("ml-2 space-y-0.5 border-l pl-2", claseBordeSutil)}>
                            {grupo.evaluaciones.map((evaluacion) => {
                              const activa = evaluacion.id === evaluacionActivaId;
                              const estadoQuizItem = estadoQuiz(evaluacion);
                              const contenido = (
                                <>
                                  <IconoEstadoQuiz estado={estadoQuizItem} />
                                  <span className="min-w-0 flex-1">
                                    <span className="block whitespace-normal break-words text-[13px] font-medium leading-snug">
                                      {evaluacion.titulo}
                                    </span>
                                    <span
                                      className={cn(
                                        "mt-1 block text-[11px] font-normal leading-none",
                                        estadoQuizItem === "completado"
                                          ? "text-emerald-300"
                                          : estadoQuizItem === "en-progreso"
                                            ? esEducational
                                              ? "text-[var(--interface-accent-secondary)]"
                                              : "text-teal-200"
                                            : claseTextoMutedTenue,
                                      )}
                                    >
                                      {etiquetaEstadoQuiz(estadoQuizItem)}
                                    </span>
                                  </span>
                                </>
                              );
                              const clases = esEducational
                                ? cn(
                                    "group flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-sm transition-colors",
                                    activa
                                      ? "border-l-2 border-[var(--interface-accent-secondary)] font-medium text-[var(--interface-text)]"
                                      : cn(
                                          "border-l-2 border-transparent text-[var(--interface-text-muted)]",
                                          claseHoverFondo12,
                                          "hover:text-[var(--interface-text)]",
                                        ),
                                    evaluacion.completada && !activa && "text-emerald-300/90",
                                    estadoQuizItem === "bloqueado" && "cursor-not-allowed opacity-70",
                                  )
                                : cn(
                                    "group flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-sm transition-colors",
                                    activa
                                      ? "border-l-2 border-[#91DC00] bg-white/22 font-medium text-white"
                                      : "border-l-2 border-transparent text-white/75 hover:bg-white/12 hover:text-white",
                                    evaluacion.completada &&
                                      !activa &&
                                      "text-emerald-300/90",
                                    estadoQuizItem === "bloqueado" && "cursor-not-allowed opacity-70",
                                  );
                              const estiloQuiz =
                                esEducational && activa ? TINTE_ACTIVO_EDUCATIONAL : undefined;

                              return (
                                <li key={evaluacion.id}>
                                  {estadoQuizItem === "bloqueado" ? (
                                    <div className={clases} style={estiloQuiz}>{contenido}</div>
                                  ) : (
                                    <Link
                                      href={`/mis-cursos/${cursoId}/evaluaciones/${evaluacion.id}`}
                                      className={clases}
                                      style={estiloQuiz}
                                    >
                                      {contenido}
                                    </Link>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {grupos.length === 0 && (
          <p className={cn("px-2 py-4 text-sm", esEducational ? claseTextoMuted : "text-white/65")}>
            No hay contenidos disponibles.
          </p>
        )}
      </nav>
    </aside>
  );
}
