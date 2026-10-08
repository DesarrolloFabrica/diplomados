"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { registrarUltimaLeccion } from "@backend/server/actions/progreso";
import { olvidarEvaluacionAbierta } from "@/lib/continuar-evaluacion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PartyPopper,
  RotateCcw,
} from "lucide-react";
import { useInterfaceVariant } from "@/components/providers/interface-variant-provider";
import {
  CLAVE_INFOGRAFIA_INTERACTIVA,
  CLAVE_TEXTO_LECCION,
  useAutoCompletion,
  type ElementoLeccion,
  type ResumenApartados,
} from "@/hooks/use-auto-completion";
import { ETIQUETA_TAB, tabDeTipo } from "@/lib/contenido-leccion";
import type { InfografiaInteractivaLeccion } from "@/lib/embeds-prueba-leccion";
import type { ProximosContenidosResultado } from "@/lib/ruta-curso";
import { cn } from "@/lib/utils";
import { ProximosContenidos } from "@/components/shared/proximos-contenidos";
import { AtajosClase } from "@/components/shared/atajos-clase";
import {
  VistaContenidoLeccion,
  type RecursoVista,
} from "@/components/shared/vista-contenido-leccion";

interface ContenidoLeccionConCompletadoProps {
  courseId: string;
  enrollmentId: string;
  lessonId: string;
  lessonTitle: string;
  lessonContext: string;
  completionMode: "automatico" | "manual";
  completed: boolean;
  /** Duración declarada de la lección en segundos (video/audio en iframe). */
  duracionSeg?: number | null;
  recursos: RecursoVista[];
  contenidoTexto?: string | null;
  infografiaInteractiva?: InfografiaInteractivaLeccion | null;
  portadaCursoUrl: string | null;
  proximos: ProximosContenidosResultado;
  manualCompletionControl?: ReactNode;
}

function EstadoCompletadoAutomatico({
  completed,
  status,
  errorMessage,
  justCompleted,
  resumen,
  onRetry,
  sinFondo = false,
}: {
  completed: boolean;
  status: ReturnType<typeof useAutoCompletion>["status"];
  errorMessage: string | null;
  justCompleted: boolean;
  resumen: ResumenApartados;
  onRetry: () => void;
  sinFondo?: boolean;
}) {
  const isCompleted = completed || status === "completed";
  const total = resumen.apartados.length;
  // El estado persistido de la lección es la fuente de verdad al volver a
  // abrirla, incluso si el detalle local de consumo ya no está disponible.
  const completos = isCompleted ? total : Math.min(resumen.completos, total);
  const porcentaje = total > 0 ? Math.round((completos / total) * 100) : 0;

  return (
    <div
      aria-live="polite"
      className={cn(
        "w-full max-w-2xl rounded-2xl border border-[var(--interface-border)] p-3",
        sinFondo
          ? "border-transparent bg-[#071f39]/80 text-white shadow-none"
          : "bg-[var(--interface-surface-strong)] text-[var(--interface-text)] shadow-[var(--interface-card-shadow)] backdrop-blur-xl",
        isCompleted &&
          "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-700",
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-3 text-sm font-semibold">
        <span className="flex min-w-0 items-center gap-2">
          {isCompleted ? (
            <CheckCircle2
              className={cn(
                "size-4 shrink-0 text-[var(--interface-accent)]",
                justCompleted && "drop-shadow-[0_0_8px_var(--interface-accent)]",
              )}
              aria-hidden="true"
            />
          ) : status === "saving" ? (
            <Loader2
              className="size-4 shrink-0 animate-spin text-[var(--interface-accent)] motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : status === "error" ? (
            <AlertCircle className="size-4 shrink-0 text-red-500" aria-hidden="true" />
          ) : (
            <span
              className="size-2 shrink-0 rounded-full bg-[var(--interface-accent)]"
              aria-hidden="true"
            />
          )}
          <span className="truncate">
            {status === "saving"
              ? "Guardando progreso..."
              : status === "error"
                ? "No se pudo guardar el progreso"
                : isCompleted
                  ? "Lección completada"
                  : "Progreso de la lección"}
          </span>
        </span>
        <span className="shrink-0 tabular-nums opacity-80">
          {completos}/{total} · {porcentaje}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={`Progreso de contenidos: ${completos} de ${total} completados`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
        className={cn(
          "mt-2.5 h-2.5 overflow-hidden rounded-full",
          sinFondo
            ? "bg-white/20"
            : "bg-[color-mix(in_srgb,var(--interface-text)_14%,transparent)]",
        )}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--interface-accent),var(--interface-accent-secondary))] transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      {resumen.apartados.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Estado de los contenidos">
          {resumen.apartados.map((apartado) => {
            const contenidoCompleto = isCompleted || apartado.completo;
            return (
              <span
                key={apartado.apartado}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold leading-none",
                  contenidoCompleto
                    ? "border-[color-mix(in_srgb,var(--interface-accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--interface-accent)_18%,transparent)]"
                    : sinFondo
                      ? "border-white/25 bg-white/10 text-white/85"
                      : "border-[var(--interface-border)] bg-[color-mix(in_srgb,var(--interface-text)_6%,transparent)] opacity-65",
                )}
              >
                {contenidoCompleto ? (
                  <CheckCircle2
                    className="size-3 text-[var(--interface-accent)]"
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    className="size-1.5 rounded-full bg-current opacity-55"
                    aria-hidden="true"
                  />
                )}
                {ETIQUETA_TAB[apartado.apartado]}
              </span>
            );
          })}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-red-500">
          <span>{errorMessage ?? "No se pudo guardar el progreso."}</span>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-full border border-red-400/60 px-2.5 py-1 font-bold transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <RotateCcw className="size-3" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ContenidoLeccionConCompletado({
  courseId,
  enrollmentId,
  lessonId,
  lessonTitle,
  lessonContext,
  completionMode,
  completed,
  duracionSeg,
  recursos,
  contenidoTexto,
  infografiaInteractiva = null,
  portadaCursoUrl,
  proximos,
  manualCompletionControl,
}: ContenidoLeccionConCompletadoProps) {
  const { config } = useInterfaceVariant();
  const esAventura = config.id === "gamified";
  const automatic = completionMode === "automatico";
  // Cada recurso disponible, el texto y la infografía interactiva son
  // elementos medibles; se agrupan por apartado (pestaña) para la regla.
  const elementos = useMemo<ElementoLeccion[]>(() => {
    const lista: ElementoLeccion[] = recursos
      .filter((recurso) => recurso.url)
      .map((recurso) => ({ clave: recurso.id, apartado: tabDeTipo(recurso.tipo) }));
    if (contenidoTexto) lista.push({ clave: CLAVE_TEXTO_LECCION, apartado: "documento" });
    if (infografiaInteractiva) {
      lista.push({ clave: CLAVE_INFOGRAFIA_INTERACTIVA, apartado: "infografia_interactiva" });
    }
    return lista;
  }, [recursos, contenidoTexto, infografiaInteractiva]);
  const autoCompletion = useAutoCompletion({
    enabled: automatic,
    alreadyCompleted: completed,
    courseId,
    enrollmentId,
    lessonId,
    elementos,
  });
  const siguiente = proximos.principal;

  // Guarda esta lección como "última clase" del estudiante: es a donde
  // llevan los botones "Continuar" del home y del mapa. Si falla (sin red),
  // la lección sigue funcionando; solo "Continuar" queda en la anterior.
  useEffect(() => {
    olvidarEvaluacionAbierta();
    registrarUltimaLeccion(courseId, enrollmentId, lessonId).catch(() => undefined);
  }, [courseId, enrollmentId, lessonId]);

  // Respaldo del autocompletado: con todos los apartados abiertos, el botón
  // manual queda disponible por si el seguimiento automático no se dispara.
  const mostrarRespaldoManual =
    automatic &&
    !completed &&
    autoCompletion.respaldoManualDisponible &&
    (autoCompletion.status === "watching" || autoCompletion.status === "error");

  const estadoCompletado = automatic ? (
    <div className="flex w-full max-w-2xl flex-wrap items-center justify-center gap-2">
      <EstadoCompletadoAutomatico
        completed={completed}
        status={autoCompletion.status}
        errorMessage={autoCompletion.errorMessage}
        justCompleted={autoCompletion.justCompleted}
        resumen={autoCompletion.resumen}
        onRetry={autoCompletion.retry}
        sinFondo={esAventura}
      />
      {mostrarRespaldoManual ? manualCompletionControl : null}
    </div>
  ) : (
    manualCompletionControl
  );

  return (
    <>
      {esAventura && (
        <nav
          aria-label="Navegacion de la leccion"
          className="mb-4 grid grid-cols-1 items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
        >
          <Link
            href={`/mis-cursos/${courseId}`}
            className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition-[transform,background-color] hover:-translate-x-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al curso
          </Link>

          <div className="flex min-w-0 justify-center sm:justify-self-center">
            {!automatic ? estadoCompletado : null}
          </div>

          {/* "Siguiente clase" vive en la barra estándar AtajosClase. */}
          <div className="flex justify-start sm:justify-end">
            {proximos.cursoCompletado ? (
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-200/80 bg-white/85 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
                <PartyPopper className="size-4" aria-hidden="true" />
                Recorrido completado
              </span>
            ) : null}
          </div>
        </nav>
      )}

      <AtajosClase anterior={proximos.anterior} siguiente={siguiente} />

      <VistaContenidoLeccion
        tituloLeccion={lessonTitle}
        contextoLeccion={lessonContext}
        completada={completed}
        recursos={recursos}
        contenidoTexto={contenidoTexto}
        infografiaInteractiva={infografiaInteractiva}
        enrollmentId={enrollmentId}
        lessonId={lessonId}
        duracionSeg={duracionSeg}
        autoCompletion={
          automatic
            ? {
                enabled: autoCompletion.trackingEnabled,
                onMediaProgress: autoCompletion.registerMediaProgress,
                onItemReviewed: autoCompletion.registerReviewed,
                onApartadoAbierto: autoCompletion.registerApartadoAbierto,
                resumen: autoCompletion.resumen,
              }
            : undefined
        }
      />

      {!esAventura && automatic && (
        <div className="mt-5">
          {estadoCompletado}
        </div>
      )}

      {!esAventura && (
        <ProximosContenidos portadaCursoUrl={portadaCursoUrl} proximos={proximos} />
      )}

      {!esAventura && !automatic && (
        <div className="mt-5">
          {manualCompletionControl}
        </div>
      )}
    </>
  );
}
