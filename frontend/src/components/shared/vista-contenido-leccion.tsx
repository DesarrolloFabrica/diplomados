"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  FileText,
  MousePointerClick,
  Presentation,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASE_PANEL_GLASS_LEGIBLE } from "@/config/paneles-glass";
import { useInterfaceVariant } from "@/components/providers/interface-variant-provider";
import { RecursoIncrustado } from "@/components/shared/recurso-incrustado";
import { EmbedAdobeIndesign } from "@/components/shared/embed-adobe-indesign";
import type { TipoRecurso } from "@backend/lib/db/schema";
import {
  ETIQUETA_TAB,
  ORDEN_TABS,
  tabDeTipo,
  type TabContenido,
} from "@/lib/contenido-leccion";
import type { InfografiaInteractivaLeccion } from "@/lib/embeds-prueba-leccion";
import { marcarLeccionIniciada } from "@/lib/progreso-leccion-local";
import {
  MIN_DOCUMENT_REVIEW_SECONDS,
  type MediaConsumptionReporter,
} from "@/hooks/use-auto-completion";

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
  infografia_interactiva: MousePointerClick,
  presentacion: Presentation,
};

const TABS = ORDEN_TABS.map((id) => ({
  id,
  etiqueta: ETIQUETA_TAB[id],
  Icono: ICONOS_TAB[id],
}));

interface VistaContenidoLeccionProps {
  tituloLeccion: string;
  contextoLeccion: string;
  completada: boolean;
  recursos: RecursoVista[];
  contenidoTexto?: string | null;
  infografiaInteractiva?: InfografiaInteractivaLeccion | null;
  autoCompletion?: {
    enabled: boolean;
    onMediaProgress: MediaConsumptionReporter;
    onDocumentEnd: () => void;
  };
  enrollmentId?: string;
  lessonId?: string;
}

function leerTabGuardada(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function DocumentoTextoObservable({
  contenido,
  enabled,
  onDocumentEnd,
}: {
  contenido: string;
  enabled: boolean;
  onDocumentEnd?: () => void;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const endOfDocumentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const content = contentRef.current;
    const end = endOfDocumentRef.current;
    if (!enabled || !onDocumentEnd || !content || !end) return undefined;

    let reviewStartedAt: number | null = null;
    let endVisible = false;
    let completionSent = false;
    let timeoutId: number | undefined;

    function clearPendingTimeout() {
      if (timeoutId === undefined) return;
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    function tryComplete() {
      clearPendingTimeout();
      if (completionSent || !endVisible || reviewStartedAt === null) return;

      const requiredMs = MIN_DOCUMENT_REVIEW_SECONDS * 1000;
      const remainingMs = requiredMs - (performance.now() - reviewStartedAt);
      if (remainingMs <= 0) {
        completionSent = true;
        onDocumentEnd?.();
        return;
      }

      timeoutId = window.setTimeout(tryComplete, remainingMs);
    }

    const contentObserver = new IntersectionObserver((entries) => {
      if (reviewStartedAt !== null || !entries.some((entry) => entry.isIntersecting)) return;
      reviewStartedAt = performance.now();
      tryComplete();
    });

    const endObserver = new IntersectionObserver(
      (entries) => {
        endVisible = entries.some((entry) => entry.isIntersecting);
        if (endVisible) {
          tryComplete();
        } else {
          clearPendingTimeout();
        }
      },
      { threshold: 0.8 },
    );

    contentObserver.observe(content);
    endObserver.observe(end);

    return () => {
      clearPendingTimeout();
      contentObserver.disconnect();
      endObserver.disconnect();
    };
  }, [enabled, onDocumentEnd]);

  return (
    <div ref={contentRef}>
      <p className="mb-5 whitespace-pre-wrap text-base leading-relaxed text-slate-700">
        {contenido}
      </p>
      <div
        ref={endOfDocumentRef}
        data-document-end
        aria-hidden="true"
        className="h-px w-full"
      />
    </div>
  );
}

export function VistaContenidoLeccion({
  tituloLeccion,
  contextoLeccion,
  completada,
  recursos,
  contenidoTexto,
  infografiaInteractiva = null,
  autoCompletion,
  enrollmentId,
  lessonId,
}: VistaContenidoLeccionProps) {
  const recursosScrollRef = useRef<HTMLDivElement | null>(null);
  const { config } = useInterfaceVariant();
  const esEducational = config.id === "educational";
  const esGamified = config.id === "gamified";

  useEffect(() => {
    if (!enrollmentId || !lessonId) return;
    marcarLeccionIniciada(enrollmentId, lessonId);
  }, [enrollmentId, lessonId]);

  const tabsDisponibles = useMemo(() => {
    const presentes = new Set(recursos.map((r) => tabDeTipo(r.tipo)));
    if (contenidoTexto && !presentes.has("documento")) {
      presentes.add("documento");
    }
    if (infografiaInteractiva) {
      presentes.add("infografia_interactiva");
    }
    const orden = TABS.filter((t) => presentes.has(t.id));
    return orden.length > 0 ? orden : TABS.filter((t) => t.id === "documento");
  }, [recursos, contenidoTexto, infografiaInteractiva]);

  // Clave para recordar la última pestaña abierta: sirve tanto de atajo de
  // UX como de "resume" mínimo para recursos embebidos vía iframe (YouTube,
  // Adobe InDesign, fallback de Google Drive) donde no se puede leer/escribir
  // currentTime — al menos se reabre el mismo recurso/pestaña de la lección.
  const tabStorageKey =
    enrollmentId && lessonId ? `leccion:tab-activa:v1:${enrollmentId}:${lessonId}` : null;

  const [tabActiva, setTabActiva] = useState<TabContenido>(() => {
    const guardada = tabStorageKey ? leerTabGuardada(tabStorageKey) : null;
    if (guardada && tabsDisponibles.some((t) => t.id === guardada)) {
      return guardada as TabContenido;
    }
    return infografiaInteractiva?.src
      ? "infografia_interactiva"
      : (tabsDisponibles[0]?.id ?? "documento");
  });

  const tabActual = tabsDisponibles.some((t) => t.id === tabActiva)
    ? tabActiva
    : (tabsDisponibles[0]?.id ?? "documento");

  useEffect(() => {
    if (!tabStorageKey) return;
    try {
      window.localStorage.setItem(tabStorageKey, tabActual);
    } catch {
      // ignorar: localStorage puede no estar disponible
    }
  }, [tabActual, tabStorageKey]);

  const recursosFiltrados = recursos.filter((r) => tabDeTipo(r.tipo) === tabActual);
  const mostrarTexto = Boolean(contenidoTexto) && tabActual === "documento";
  const mostrarInfografiaInteractiva =
    tabActual === "infografia_interactiva" && infografiaInteractiva !== null;

  function detalleTab(tab: TabContenido) {
    if (tab === "infografia_interactiva" && infografiaInteractiva) {
      return infografiaInteractiva.titulo ?? "Experiencia interactiva";
    }

    const recursosTab = recursos.filter((recurso) => tabDeTipo(recurso.tipo) === tab);
    if (recursosTab.length === 1) return recursosTab[0]?.nombre ?? "Recurso disponible";
    if (recursosTab.length > 1) return `${recursosTab.length} recursos disponibles`;
    if (tab === "documento" && contenidoTexto) return "Lectura de la leccion";
    return "Recurso disponible";
  }

  function desplazarRecursos(direccion: -1 | 1) {
    recursosScrollRef.current?.scrollBy({
      left: direccion * 240,
      behavior: "smooth",
    });
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "overflow-hidden rounded-2xl",
          esEducational
            ? "border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] shadow-[var(--interface-shadow)]"
            : cn(
                "border border-white/45 bg-white/18 shadow-[0_16px_45px_rgba(3,12,28,0.2)] backdrop-blur-xl",
                CLASE_PANEL_GLASS_LEGIBLE,
              ),
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden px-5 py-4 sm:px-6 sm:py-5",
            esEducational
              ? "border-b border-[var(--interface-border)] bg-[var(--interface-surface)]"
              : "border-b border-white/15 bg-gradient-to-r from-[#061120]/92 via-[#0b3042]/78 to-[#0c514b]/62",
          )}
        >
          {!esEducational && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/8 to-transparent"
            />
          )}
          <div className="relative z-10 max-w-3xl">
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.12em]",
                esEducational
                  ? "text-[var(--interface-accent-secondary)]"
                  : esGamified
                    ? "text-[var(--interface-accent-secondary)]"
                    : "text-teal-100/75",
              )}
            >
              {esGamified ? `Mision actual · ${contextoLeccion}` : contextoLeccion}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
              <h1
                className={cn(
                  "font-display text-xl font-bold sm:text-2xl",
                  esEducational ? "text-[var(--interface-text)]" : "text-white",
                )}
              >
                {tituloLeccion}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  esEducational
                    ? completada
                      ? "border-emerald-400/35 bg-emerald-400/12 text-emerald-600 dark:text-emerald-300"
                      : "border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text-muted)]"
                    : esGamified
                      ? completada
                        ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                        : "border-[color-mix(in_srgb,var(--interface-accent-secondary)_40%,transparent)] bg-[color-mix(in_srgb,var(--interface-accent-secondary)_12%,transparent)] text-[var(--interface-accent-secondary)] shadow-[0_0_10px_rgba(103,232,249,0.25)]"
                      : completada
                        ? "border-emerald-300/35 bg-emerald-300/15 text-emerald-100"
                        : "border-white/25 bg-white/10 text-white/70",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    completada
                      ? esEducational
                        ? "bg-emerald-500"
                        : "bg-[#91DC00]"
                      : esEducational
                        ? "bg-[var(--interface-accent-secondary)]"
                        : "bg-teal-300",
                  )}
                />
                {completada ? "Completado" : "En progreso"}
              </span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            tabActual === "video"
              ? "bg-black/90 p-1 sm:p-1.5"
              : esEducational
                ? "bg-[var(--interface-surface)] p-2.5 sm:p-3"
                : "bg-white/76 p-2.5 sm:p-3",
          )}
        >
          {mostrarInfografiaInteractiva ? (
            <EmbedAdobeIndesign
              src={infografiaInteractiva.src}
              titulo={infografiaInteractiva.titulo}
            />
          ) : null}

          {mostrarTexto && contenidoTexto && (
            <div className="min-h-[300px] rounded-lg bg-white/70 px-5 py-6 sm:px-7">
              <DocumentoTextoObservable
                contenido={contenidoTexto}
                enabled={autoCompletion?.enabled ?? false}
                onDocumentEnd={autoCompletion?.onDocumentEnd}
              />
            </div>
          )}

          {recursosFiltrados.length > 0 ? (
            <div className={cn("space-y-4", mostrarTexto && "mt-3")}>
              {recursosFiltrados.map((recurso) => (
                <RecursoIncrustado
                  key={recurso.id}
                  resourceId={recurso.id}
                  nombre={recurso.nombre}
                  tipo={recurso.tipo}
                  url={recurso.url}
                  autoCompletionEnabled={autoCompletion?.enabled ?? false}
                  onConsumptionProgress={autoCompletion?.onMediaProgress}
                  enrollmentId={enrollmentId}
                  lessonId={lessonId}
                />
              ))}
            </div>
          ) : (
            !mostrarTexto &&
            !mostrarInfografiaInteractiva && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white/65 px-4 py-10 text-center text-sm text-slate-600">
                No hay contenido de este tipo en la leccion.
              </div>
            )
          )}
        </div>
      </div>

      {tabsDisponibles.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p
              className={cn(
                "text-[11px] font-semibold uppercase",
                esEducational ? "text-[var(--interface-text-muted)]" : "text-white/65",
              )}
            >
              Recursos de la leccion
            </p>
            <div className="flex items-center gap-1 xl:hidden">
              <span
                className={cn(
                  "mr-1 text-[10px] font-medium",
                  esEducational ? "text-[var(--interface-text-muted)]" : "text-white/50",
                )}
              >
                Desliza
              </span>
              <button
                type="button"
                onClick={() => desplazarRecursos(-1)}
                aria-label="Ver recursos anteriores"
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-md transition-colors",
                  esEducational
                    ? "border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text-muted)] hover:text-[var(--interface-text)]"
                    : "border-white/25 bg-white/12 text-white/75 hover:bg-white/25 hover:text-white",
                )}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => desplazarRecursos(1)}
                aria-label="Ver mas recursos"
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-md transition-colors",
                  esEducational
                    ? "border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text-muted)] hover:text-[var(--interface-text)]"
                    : "border-white/25 bg-white/12 text-white/75 hover:bg-white/25 hover:text-white",
                )}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div
            ref={recursosScrollRef}
            className="w-full max-w-full overflow-x-auto pb-3 [scrollbar-color:rgba(255,255,255,0.5)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/45 [&::-webkit-scrollbar-track]:bg-transparent"
          >
            <div
              className="grid min-w-max grid-flow-col auto-cols-[minmax(190px,230px)] gap-2.5 xl:min-w-0 xl:grid-flow-row xl:auto-cols-auto xl:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]"
              role="tablist"
              aria-label="Recursos de la leccion"
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
                    style={
                      esEducational && activo
                        ? {
                            backgroundColor:
                              "color-mix(in srgb, var(--interface-accent-secondary) 12%, transparent)",
                          }
                        : esGamified && activo
                          ? {
                              backgroundColor:
                                "color-mix(in srgb, var(--interface-accent-secondary) 14%, transparent)",
                            }
                          : undefined
                    }
                    className={cn(
                      "group grid min-h-[68px] grid-cols-[42px_minmax(0,1fr)] items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                      esEducational
                        ? cn(
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] focus-visible:ring-offset-2",
                            activo
                              ? "border-[var(--interface-accent-secondary)] text-[var(--interface-text)] shadow-[var(--interface-shadow)]"
                              : "border-[var(--interface-border)] bg-[var(--interface-surface)] text-[var(--interface-text-muted)] hover:border-[var(--interface-accent-secondary)] hover:text-[var(--interface-text)]",
                          )
                        : esGamified
                          ? cn(
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] focus-visible:ring-offset-2",
                              activo
                                ? "border-[var(--interface-accent-secondary)] text-[var(--interface-text)] shadow-[0_0_18px_rgba(103,232,249,0.35)]"
                                : "border-[var(--interface-border)] bg-[var(--interface-surface)] text-[var(--interface-text-muted)] hover:border-[var(--interface-accent-secondary)] hover:text-[var(--interface-text)]",
                            )
                          : cn(
                              "backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]",
                              activo
                                ? "border-white/65 bg-white/30 text-white shadow-[0_8px_24px_rgba(3,12,28,0.18)]"
                                : "border-white/25 bg-[#061120]/26 text-white/75 hover:border-white/45 hover:bg-white/18 hover:text-white",
                            ),
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg border",
                        esEducational
                          ? activo
                            ? "border-[var(--interface-accent-secondary)] bg-[var(--interface-surface-strong)] text-[var(--interface-accent-secondary)]"
                            : "border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text-muted)] group-hover:text-[var(--interface-accent-secondary)]"
                          : esGamified
                            ? activo
                              ? "border-[var(--interface-accent-secondary)] bg-[var(--interface-surface-strong)] text-[var(--interface-accent-secondary)]"
                              : "border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text-muted)] group-hover:text-[var(--interface-accent-secondary)]"
                            : activo
                              ? "border-white/40 bg-white/20 text-[#b7f36b]"
                              : "border-white/15 bg-white/10 text-teal-100/80 group-hover:text-white",
                      )}
                    >
                      <Icono className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-current">{etiqueta}</span>
                      <span
                        className={cn(
                          "mt-1 block truncate text-[11px] font-medium",
                          esEducational ? "text-[var(--interface-text-muted)]" : "text-white/55",
                        )}
                      >
                        {detalleTab(id)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
