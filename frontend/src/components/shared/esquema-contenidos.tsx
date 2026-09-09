"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AudioLines,
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  Circle,
  CircleCheck,
  CircleDashed,
  ClipboardCheck,
  FileText,
  Layers2,
  Lightbulb,
  LockKeyhole,
  MousePointerClick,
  PanelRightClose,
  PlayCircle,
  Presentation,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgresoCursoLeccion } from "@/components/shared/progreso-curso-leccion";
import {
  ORDEN_TABS,
  type TabContenido,
} from "@/lib/contenido-leccion";

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

const ICONOS_CATEGORIA: Record<TabContenido, LucideIcon> = {
  video: Video,
  podcast: AudioLines,
  documento: FileText,
  infografia: ChartNoAxesCombined,
  infografia_interactiva: MousePointerClick,
  presentacion: Presentation,
};

const ICONOS_POR_TIPO: Record<ItemEsquemaLeccion["tipoContenido"], LucideIcon> = {
  texto: BookOpen,
  video: PlayCircle,
  archivo: FileText,
  mixto: Layers2,
};

/** Iconos alternos cuando varias lecciones comparten el mismo tipo (p. ej. solo video). */
const ICONOS_VARIACION: LucideIcon[] = [
  PlayCircle,
  BookOpen,
  FileText,
  AudioLines,
  Presentation,
  ChartNoAxesCombined,
  MousePointerClick,
  Lightbulb,
];

function resolverIconoLeccion(
  categorias: TabContenido[] | undefined,
  tipoContenido: ItemEsquemaLeccion["tipoContenido"],
  indice: number,
): LucideIcon {
  const cats = ORDEN_TABS.filter((tab) => categorias?.includes(tab));

  if (cats.length > 1) {
    const preferida = cats.find((tab) => tab !== "video") ?? cats[0]!;
    return ICONOS_CATEGORIA[preferida];
  }

  if (cats.length === 1 && cats[0] !== "video") {
    return ICONOS_CATEGORIA[cats[0]!];
  }

  if (tipoContenido !== "video") {
    return ICONOS_POR_TIPO[tipoContenido];
  }

  return ICONOS_VARIACION[indice % ICONOS_VARIACION.length]!;
}

function IconoLeccion({
  categorias,
  tipoContenido,
  indice,
  completada,
  bloqueada,
}: {
  categorias?: TabContenido[];
  tipoContenido: ItemEsquemaLeccion["tipoContenido"];
  indice: number;
  completada: boolean;
  bloqueada: boolean;
}) {
  if (bloqueada) return <LockKeyhole className="h-4 w-4 shrink-0" />;
  if (completada) return <CircleCheck className="h-4 w-4 shrink-0" />;

  const Icono = resolverIconoLeccion(categorias, tipoContenido, indice);
  return <Icono className="h-4 w-4 shrink-0" />;
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
  activa: boolean,
  bloqueada: boolean,
) {
  if (bloqueada) return "Bloqueado";
  if (completada) return "Completado";
  if (activa) return "En progreso";
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
      <Circle className="h-3.5 w-3.5" />
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
  return <Circle className="h-4 w-4 shrink-0 text-white/45" />;
}

export function EsquemaContenidos({
  cursoId,
  leccionActivaId,
  evaluacionActivaId,
  grupos,
  progresoCurso,
  onCerrar,
}: EsquemaContenidosProps) {
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

  function alternar(id: string) {
    setAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function alternarQuices(id: string) {
    setQuicesAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <aside className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-white/20 px-4 py-3.5">
        <h2 className="text-sm font-semibold text-white">
          Esquema de contenidos
        </h2>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Ocultar esquema de contenidos"
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-md p-1.5",
              "text-white/70 transition-colors hover:bg-white/15 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00]",
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
          const { porcentaje, estado } = calcularProgresoModulo(grupo);

          return (
            <div key={grupo.id} className="border-b border-white/12 pb-2 last:border-b-0">
              <div className="space-y-2 px-0.5">
                <button
                  type="button"
                  onClick={() => alternar(grupo.id)}
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-white/10"
                >
                  <ChevronDown
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 text-white/55 transition-transform",
                      !abierto && "-rotate-90",
                    )}
                  />
                  <IconoEstadoModulo estado={estado} />
                  <span className="min-w-0 flex-1 whitespace-normal break-words text-[13px] font-semibold leading-snug text-white">
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
                  className="mx-2 h-1 overflow-hidden rounded-full bg-white/20"
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
                <div className="mb-1 ml-2 mt-1 space-y-1 border-l border-white/20 pl-2">
                  <ul className="space-y-0.5">
                    {grupo.lecciones.map((leccion, indiceLeccion) => {
                      const activa = leccion.id === leccionActivaId;
                      const bloqueada = Boolean(leccion.bloqueado);
                      const contenido = (
                        <>
                          <span
                            className={cn(
                              "mt-0.5",
                              bloqueada
                                ? "text-white/40"
                                : leccion.completada
                                  ? "text-emerald-300"
                                  : activa
                                    ? "text-[#91DC00]"
                                    : "text-white/55 group-hover:text-white/85",
                            )}
                          >
                            <IconoLeccion
                              categorias={leccion.categoriasContenido}
                              tipoContenido={leccion.tipoContenido}
                              indice={indiceLeccion}
                              completada={leccion.completada}
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
                                  ? "text-white/40"
                                  : leccion.completada
                                    ? "text-emerald-300"
                                    : activa
                                      ? "text-teal-200"
                                      : "text-white/45",
                              )}
                            >
                              {etiquetaEstadoLeccion(
                                leccion.completada,
                                activa,
                                bloqueada,
                              )}
                            </span>
                          </span>
                        </>
                      );
                      const clases = cn(
                        "group flex items-start gap-2.5 rounded-lg border-l-2 px-2.5 py-2.5 text-sm transition-colors",
                        activa
                          ? "border-[#91DC00] bg-white/22 font-medium text-white"
                          : bloqueada
                            ? "cursor-not-allowed border-transparent text-white/45"
                            : "border-transparent text-white/75 hover:bg-white/12 hover:text-white",
                      );

                      return (
                        <li key={leccion.id}>
                          {bloqueada ? (
                            <div className={clases} aria-disabled="true">
                              {contenido}
                            </div>
                          ) : (
                            <Link
                              href={`/mis-cursos/${cursoId}/lecciones/${leccion.id}`}
                              className={clases}
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
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-white transition-colors hover:bg-white/12"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-white/55 transition-transform",
                            !quicesAbiertosModulo && "-rotate-90",
                          )}
                        />
                        <ClipboardCheck className="h-4 w-4 shrink-0 text-white/55" />
                        <span>Quices ({grupo.evaluaciones.length})</span>
                      </button>

                      {quicesAbiertosModulo && (
                        <div id={`quices-${grupo.id}`}>
                          <ul className="ml-2 space-y-0.5 border-l border-white/20 pl-2">
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
                                            ? "text-teal-200"
                                            : "text-white/45",
                                      )}
                                    >
                                      {etiquetaEstadoQuiz(estadoQuizItem)}
                                    </span>
                                  </span>
                                </>
                              );
                              const clases = cn(
                                "group flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-sm transition-colors",
                                activa
                                  ? "border-l-2 border-[#91DC00] bg-white/22 font-medium text-white"
                                  : "border-l-2 border-transparent text-white/75 hover:bg-white/12 hover:text-white",
                                evaluacion.completada &&
                                  !activa &&
                                  "text-emerald-300/90",
                                estadoQuizItem === "bloqueado" && "cursor-not-allowed opacity-70",
                              );

                              return (
                                <li key={evaluacion.id}>
                                  {estadoQuizItem === "bloqueado" ? (
                                    <div className={clases}>{contenido}</div>
                                  ) : (
                                    <Link
                                      href={`/mis-cursos/${cursoId}/evaluaciones/${evaluacion.id}`}
                                      className={clases}
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
          <p className="px-2 py-4 text-sm text-white/65">
            No hay contenidos disponibles.
          </p>
        )}
      </nav>
    </aside>
  );
}
