"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { SelectorRecursosAventura } from "@/components/shared/selector-recursos-aventura";
import {
  PlayerType1Layout,
  PlayerType2Layout,
} from "@/components/shared/player-layouts";
import type { TipoRecurso } from "@backend/lib/db/schema";
import {
  ETIQUETA_TAB,
  ORDEN_TABS,
  tabDeTipo,
  type TabContenido,
} from "@/lib/contenido-leccion";
import type { InfografiaInteractivaLeccion } from "@/lib/embeds-prueba-leccion";
import { resolvePlayerLayoutType } from "@/lib/player-layout";
import { marcarLeccionIniciada } from "@/lib/progreso-leccion-local";
import {
  CLAVE_INFOGRAFIA_INTERACTIVA,
  CLAVE_TEXTO_LECCION,
  MIN_DOCUMENT_REVIEW_SECONDS,
  type MediaConsumptionReporter,
  type ResumenApartados,
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
    /** Marca un elemento (recurso, texto o infografía interactiva) como revisado. */
    onItemReviewed: (clave: string) => void;
    /** Registra que el estudiante abrió un apartado (pestaña) de la lección. */
    onApartadoAbierto: (apartado: TabContenido) => void;
    resumen: ResumenApartados;
  };
  /** Duración declarada de la lección (segundos), para video/audio en iframe. */
  duracionSeg?: number | null;
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
  duracionSeg,
  enrollmentId,
  lessonId,
}: VistaContenidoLeccionProps) {
  const recursosScrollRef = useRef<HTMLDivElement | null>(null);
  // Callbacks estables: DocumentoTextoObservable reinicia su observador si
  // cambia la referencia de onDocumentEnd.
  const onItemReviewed = autoCompletion?.onItemReviewed;
  const alTerminarTexto = useCallback(
    () => onItemReviewed?.(CLAVE_TEXTO_LECCION),
    [onItemReviewed],
  );
  const alRevisarInfografia = useCallback(
    () => onItemReviewed?.(CLAVE_INFOGRAFIA_INTERACTIVA),
    [onItemReviewed],
  );
  const { config } = useInterfaceVariant();
  // Se resuelve por `config.lesson.variant` (no por `config.id`) para que la
  // presentación de esta vista quede atada a la config declarativa de cada
  // interfaz (creative=immersive, business=focused, educational=study,
  // gamified=mission) en vez de un id suelto repetido por todo el archivo.
  const lessonVariant = config.lesson.variant;
  const esFocused = lessonVariant === "focused"; // business
  const esStudy = lessonVariant === "study"; // educational
  const esMission = lessonVariant === "mission"; // gamified
  const playerLayoutType = resolvePlayerLayoutType(config.id);
  const esPlayerType2 = playerLayoutType === "type-2";

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
  const apartadosCompletados = new Set(
    autoCompletion?.resumen.apartados
      .filter((apartado) => completada || apartado.completo)
      .map((apartado) => apartado.apartado) ?? [],
  );
  const totalApartados = autoCompletion?.resumen.apartados.length ?? 0;
  const cantidadCompletados = completada
    ? totalApartados
    : (autoCompletion?.resumen.completos ?? 0);
  const porcentajeProgreso = totalApartados > 0
    ? Math.round((cantidadCompletados / totalApartados) * 100)
    : completada
      ? 100
      : 0;

  // Apartados por los que pasó el estudiante: habilitan el botón manual de
  // respaldo si el autocompletado falla (ver respaldoManualDisponible).
  const onApartadoAbierto = autoCompletion?.onApartadoAbierto;
  useEffect(() => {
    onApartadoAbierto?.(tabActual);
  }, [onApartadoAbierto, tabActual]);

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

  const panelClassName = cn(
    esFocused
      ? "business-player-panel rounded-[20px] border border-[var(--business-player-border)] bg-[var(--business-player-panel)] shadow-[0_22px_55px_rgba(4,28,74,0.32)] backdrop-blur-sm"
      : esStudy
        ? "study-player-panel rounded-2xl border border-[var(--study-border)] bg-[var(--study-player-bg)] shadow-[0_20px_50px_rgba(6,17,10,0.35)] backdrop-blur-md"
        : esMission
          ? "rounded-2xl border border-white/30 bg-[#061120]/24 shadow-[0_16px_42px_rgba(6,17,32,0.2)] backdrop-blur-md"
          : cn(
              "rounded-2xl border border-white/45 bg-white/18 shadow-[0_16px_45px_rgba(3,12,28,0.2)] backdrop-blur-xl",
              CLASE_PANEL_GLASS_LEGIBLE,
            ),
  );

  const playerHeader = (
        <div
          className={cn(
            "relative overflow-hidden px-4 py-4 sm:px-6 sm:py-5",
            esStudy
              ? "border-b border-[var(--study-border)] bg-[var(--study-header-bg)] shadow-[0_8px_24px_rgba(38,28,11,0.16)] backdrop-blur-xl"
              : esFocused
                ? "border-b border-[var(--business-player-border)] bg-[linear-gradient(180deg,rgba(245,250,255,0.94),rgba(213,233,255,0.78))]"
              : esMission
                ? "border-b border-white/70 bg-white/82 shadow-[0_8px_24px_rgba(6,17,32,0.12)] backdrop-blur-xl"
                : "border-b border-white/15 bg-gradient-to-r from-[#061120]/92 via-[#0b3042]/78 to-[#0c514b]/62",
          )}
        >
          {!(esFocused || esStudy || esMission) && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/8 to-transparent"
            />
          )}
          <div className="relative z-10 max-w-3xl">
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.12em]",
                esFocused
                  ? "text-[var(--business-player-muted)]"
                  : esStudy
                  ? "text-[var(--study-accent)]"
                  : esMission
                    ? "text-[#08708a]"
                  : "text-teal-100/75",
              )}
            >
              {esMission ? `Mision actual · ${contextoLeccion}` : contextoLeccion}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
              <h1
                className={cn(
                  "font-display text-lg font-bold min-[430px]:text-xl sm:text-2xl",
                  esStudy
                    ? "text-[var(--study-header-text)]"
                    : esFocused
                      ? "text-[var(--business-player-text)]"
                    : esMission
                      ? "text-slate-950"
                      : "text-white",
                )}
              >
                {tituloLeccion}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  esFocused
                    ? completada
                      ? "border-[var(--business-player-accent)] bg-[rgba(200,255,245,0.78)] text-[var(--business-player-text)] shadow-[0_0_18px_rgba(34,212,189,0.28)]"
                      : "border-[var(--business-player-accent)] bg-[rgba(200,255,245,0.72)] text-[var(--business-player-text)] shadow-[0_0_18px_rgba(34,212,189,0.22)]"
                    : esStudy
                      ? completada
                        ? "border-[var(--study-success)] bg-[var(--study-success-bg)] text-[var(--study-success-text)] shadow-sm"
                        : "border-[var(--study-accent)] bg-[var(--study-progress-bg)] text-[var(--study-progress-text)] shadow-sm"
                      : esMission
                        ? completada
                          ? "border-emerald-600/35 bg-emerald-100/90 text-emerald-800 shadow-sm"
                          : "border-cyan-700/35 bg-cyan-50/90 text-cyan-800 shadow-sm"
                        : completada
                          ? "border-emerald-300/35 bg-emerald-300/15 text-emerald-100"
                          : "border-white/25 bg-white/10 text-white/70",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    esStudy
                      ? completada
                        ? "bg-[var(--study-success)]"
                        : "bg-[var(--study-accent)]"
                      : esFocused
                        ? "bg-[var(--business-player-accent)]"
                        : esMission
                          ? completada
                            ? "bg-emerald-600"
                            : "bg-cyan-700"
                          : completada
                            ? "bg-[#91DC00]"
                            : "bg-teal-300",
                  )}
                />
                {completada ? "Completado" : "En progreso"}
              </span>
              {esPlayerType2 && autoCompletion ? (
                <div className="flex min-w-[180px] max-w-md flex-1 items-center gap-2.5">
                  <div
                    role="progressbar"
                    aria-label={`Progreso de contenidos: ${porcentajeProgreso}%`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={porcentajeProgreso}
                    className={cn(
                      "h-2.5 min-w-24 flex-1 overflow-hidden rounded-full shadow-inner",
                      esStudy
                        ? "bg-[color-mix(in_srgb,var(--study-text)_16%,transparent)]"
                        : "bg-slate-300/80",
                    )}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none",
                        esStudy
                          ? "bg-[linear-gradient(90deg,var(--study-success),var(--interface-accent-secondary))]"
                          : "bg-[linear-gradient(90deg,#65a30d,#0891b2)]",
                      )}
                      style={{ width: `${porcentajeProgreso}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-bold tabular-nums",
                      esStudy ? "text-[var(--study-header-text)]" : "text-slate-800",
                    )}
                  >
                    {porcentajeProgreso}%
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
  );

  const playerType2ResourceSelector = tabsDisponibles.length > 0 ? (
          <div className="resource-selector px-4 py-3 sm:px-5">
            <SelectorRecursosAventura
              recursos={tabsDisponibles.map(({ id, etiqueta, Icono }) => ({
                id,
                etiqueta,
                Icono,
                completado: apartadosCompletados.has(id),
              }))}
              activoId={tabActual}
              onSeleccionar={setTabActiva}
              variante={esStudy ? "educational" : "adventure"}
            />
          </div>
        ) : null;

  const playerVisualizer = (
        <div
          className={cn(
            tabActual === "video"
              ? esPlayerType2
                ? "bg-black/45 p-1 sm:p-1.5"
                : "bg-black/90 p-1 sm:p-1.5"
              : esStudy
                ? "border-t border-[var(--study-border)] bg-[var(--study-content-bg)] p-2.5 backdrop-blur-sm sm:p-3"
                : esFocused
                  ? "bg-[rgba(245,250,255,0.76)] p-2.5 sm:p-3"
                : esMission
                  ? "bg-white/16 p-2.5 backdrop-blur-sm sm:p-3"
                  : "bg-white/76 p-2.5 sm:p-3",
          )}
        >
          {mostrarInfografiaInteractiva ? (
            <EmbedAdobeIndesign
              src={infografiaInteractiva.src}
              titulo={infografiaInteractiva.titulo}
              claveAtencion={`${lessonId ?? ""}:infografia-interactiva`}
              autoCompletionEnabled={autoCompletion?.enabled ?? false}
              onReviewed={onItemReviewed ? alRevisarInfografia : undefined}
            />
          ) : null}

          {mostrarTexto && contenidoTexto && (
            <div
              className={cn(
                "min-h-[240px] rounded-lg px-4 py-5 sm:min-h-[300px] sm:px-7 sm:py-6",
                esPlayerType2
                  ? esStudy
                    ? "border border-[var(--study-border)] bg-[var(--study-document-bg)] backdrop-blur-md"
                    : "border border-white/25 bg-white/62 backdrop-blur-md"
                  : "bg-white/70",
              )}
            >
              <DocumentoTextoObservable
                contenido={contenidoTexto}
                enabled={autoCompletion?.enabled ?? false}
                onDocumentEnd={onItemReviewed ? alTerminarTexto : undefined}
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
                  onResourceReviewed={
                    onItemReviewed ? () => onItemReviewed(recurso.id) : undefined
                  }
                  duracionSeg={duracionSeg}
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
  );

  const playerType1ResourceSelector = tabsDisponibles.length > 0 ? (
        <div className="resource-selector">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p
              className={cn(
                "text-[11px] font-semibold uppercase",
                esFocused || esStudy || esMission ? "text-[var(--interface-text-muted)]" : "text-white/65",
              )}
            >
              Recursos de la leccion
            </p>
            <div className="flex items-center gap-1 xl:hidden">
              <span
                className={cn(
                  "mr-1 text-[10px] font-medium",
                  esFocused || esStudy || esMission ? "text-[var(--interface-text-muted)]" : "text-white/50",
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
                  esFocused || esStudy || esMission
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
                  esFocused || esStudy || esMission
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
              className="grid min-w-max grid-flow-col auto-cols-[minmax(160px,200px)] gap-2.5 sm:auto-cols-[minmax(190px,230px)] xl:min-w-0 xl:grid-flow-row xl:auto-cols-auto xl:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]"
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
                      esFocused && activo
                        ? {
                            backgroundColor:
                              "rgba(205, 255, 245, 0.82)",
                          }
                        : esMission && activo
                          ? {
                              backgroundColor:
                                "color-mix(in srgb, var(--interface-accent-secondary) 14%, transparent)",
                            }
                          : undefined
                    }
                    className={cn(
                      "group grid min-h-[64px] grid-cols-[38px_minmax(0,1fr)] items-center gap-2.5 rounded-lg border px-2.5 py-2.5 text-left transition-all sm:min-h-[68px] sm:grid-cols-[42px_minmax(0,1fr)] sm:gap-3 sm:px-3",
                      esFocused
                        ? cn(
                            "rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--business-player-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05306e]",
                            activo
                              ? "border-[var(--business-player-accent)] text-[var(--business-player-text)] shadow-[0_0_0_2px_rgba(34,212,189,0.35),0_12px_24px_rgba(4,28,74,0.18)]"
                              : "border-[var(--business-player-border)] bg-[rgba(220,238,255,0.86)] text-[var(--business-player-muted)] shadow-[0_8px_18px_rgba(4,28,74,0.14)] hover:border-[var(--business-player-accent)] hover:text-[var(--business-player-text)]",
                          )
                        : esStudy
                          ? cn(
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent)] focus-visible:ring-offset-2",
                              activo
                                ? "border-[var(--interface-accent)] bg-[var(--interface-accent)] text-[var(--interface-accent-foreground)] [box-shadow:0_0_14px_color-mix(in_srgb,var(--interface-accent)_45%,transparent)]"
                                : "border-[var(--interface-border)] bg-[var(--interface-surface)] text-[var(--interface-text-muted)] hover:border-[var(--interface-accent)] hover:text-[var(--interface-text)]",
                            )
                          : esMission
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
                        "flex h-9 w-9 items-center justify-center rounded-lg border sm:h-10 sm:w-10",
                        esStudy && activo
                          ? "border-white/35 bg-white/20 text-[var(--interface-accent-foreground)]"
                          : esFocused
                            ? activo
                              ? "border-white/80 bg-white/75 text-[var(--business-player-accent)] shadow-[0_0_18px_rgba(34,212,189,0.35)]"
                              : "border-white/70 bg-[rgba(245,250,255,0.46)] text-[var(--business-player-muted)] group-hover:text-[var(--business-player-accent)]"
                          : esStudy || esMission
                            ? activo
                              ? "border-[var(--interface-accent-secondary)] bg-[var(--interface-surface-strong)] text-[var(--interface-accent-secondary)]"
                              : "border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text-muted)] group-hover:text-[var(--interface-accent-secondary)]"
                            : activo
                              ? "border-white/40 bg-white/20 text-[#b7f36b]"
                              : "border-white/15 bg-white/10 text-teal-100/80 group-hover:text-white",
                      )}
                    >
                      <Icono className="size-4 sm:size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-current">{etiqueta}</span>
                      <span
                        className={cn(
                          "mt-1 block truncate text-[11px] font-medium",
                          esStudy && activo
                            ? "text-[color-mix(in_srgb,var(--interface-accent-foreground)_80%,transparent)]"
                            : esFocused
                              ? "text-[rgba(31,63,133,0.78)]"
                            : esStudy || esMission
                              ? "text-[var(--interface-text-muted)]"
                              : "text-white/55",
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
      ) : null;

  if (esPlayerType2) {
    return (
      <PlayerType2Layout
        header={playerHeader}
        visualizer={playerVisualizer}
        resourceSelector={playerType2ResourceSelector}
        panelClassName={panelClassName}
      />
    );
  }

  return (
    <PlayerType1Layout
      header={playerHeader}
      visualizer={playerVisualizer}
      resourceSelector={playerType1ResourceSelector}
      panelClassName={panelClassName}
    />
  );
}
