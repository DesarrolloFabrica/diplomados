"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  PartyPopper,
  RotateCcw,
} from "lucide-react";
import { CLASE_PANEL_GLASS_LEGIBLE } from "@/config/paneles-glass";
import { useInterfaceVariant } from "@/components/providers/interface-variant-provider";
import { useAutoCompletion } from "@/hooks/use-auto-completion";
import type { InfografiaInteractivaLeccion } from "@/lib/embeds-prueba-leccion";
import type { ProximosContenidosResultado } from "@/lib/ruta-curso";
import { cn } from "@/lib/utils";
import { ProximosContenidos } from "@/components/shared/proximos-contenidos";
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
  onRetry,
}: {
  completed: boolean;
  status: ReturnType<typeof useAutoCompletion>["status"];
  errorMessage: string | null;
  justCompleted: boolean;
  onRetry: () => void;
}) {
  const isCompleted = completed || status === "completed";

  return (
    <div
      aria-live="polite"
      className={cn(
        "inline-flex min-h-10 max-w-full items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
        CLASE_PANEL_GLASS_LEGIBLE,
        isCompleted &&
          "text-emerald-700 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-700",
        status === "error" && "flex-wrap text-red-700",
        !isCompleted && status !== "error" && "text-slate-700",
      )}
    >
      {isCompleted ? (
        <CheckCircle2
          className={cn(
            "size-4 shrink-0",
            justCompleted && "drop-shadow-[0_0_8px_rgba(16,185,129,0.55)]",
          )}
          aria-hidden="true"
        />
      ) : status === "saving" ? (
        <Loader2 className="size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : status === "error" ? (
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <span className="size-2 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
      )}

      <span>
        {isCompleted
          ? justCompleted
            ? "Leccion completada automaticamente"
            : "Leccion completada"
          : status === "saving"
            ? "Guardando progreso..."
            : status === "error"
              ? errorMessage ?? "No se pudo guardar el progreso."
              : "Completado automatico activo"}
      </span>

      {status === "error" && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 rounded-full border border-red-300/70 bg-white/50 px-2.5 py-1 text-xs font-bold transition-colors hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <RotateCcw className="size-3" aria-hidden="true" />
          Reintentar
        </button>
      )}
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
  const autoCompletion = useAutoCompletion({
    enabled: automatic,
    alreadyCompleted: completed,
    courseId,
    enrollmentId,
    lessonId,
  });
  const siguiente = proximos.principal;

  const estadoCompletado = automatic ? (
    <EstadoCompletadoAutomatico
      completed={completed}
      status={autoCompletion.status}
      errorMessage={autoCompletion.errorMessage}
      justCompleted={autoCompletion.justCompleted}
      onRetry={autoCompletion.retry}
    />
  ) : (
    manualCompletionControl
  );

  return (
    <>
      {esAventura && (
        <nav
          aria-label="Navegacion de la leccion"
          className="mb-4 grid grid-cols-1 items-center gap-3 rounded-2xl border border-white/35 bg-white/24 p-3 shadow-[0_12px_32px_rgba(6,17,32,0.14)] backdrop-blur-md sm:grid-cols-[1fr_auto_1fr]"
        >
          <Link
            href={`/mis-cursos/${courseId}`}
            className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition-[transform,background-color] hover:-translate-x-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al curso
          </Link>

          <div className="flex min-w-0 justify-center sm:justify-self-center">
            {estadoCompletado}
          </div>

          <div className="flex justify-start sm:justify-end">
            {proximos.cursoCompletado ? (
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-200/80 bg-white/85 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
                <PartyPopper className="size-4" aria-hidden="true" />
                Recorrido completado
              </span>
            ) : siguiente?.bloqueado ? (
              <span className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-full border border-white/45 bg-white/55 px-4 py-2 text-sm font-bold text-slate-500 opacity-75">
                <LockKeyhole className="size-4" aria-hidden="true" />
                {siguiente.tipo === "evaluacion" ? "Siguiente desafio" : "Siguiente leccion"}
              </span>
            ) : siguiente ? (
              <Link
                href={siguiente.href}
                className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition-[transform,background-color] hover:translate-x-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]"
              >
                {siguiente.tipo === "evaluacion" ? "Siguiente desafio" : "Siguiente leccion"}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </div>
        </nav>
      )}

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
                onDocumentEnd: autoCompletion.registerDocumentEnd,
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
