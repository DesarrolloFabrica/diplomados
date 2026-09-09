"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { CLASE_PANEL_GLASS_LEGIBLE } from "@/config/paneles-glass";
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
  recursos,
  contenidoTexto,
  infografiaInteractiva = null,
  portadaCursoUrl,
  proximos,
  manualCompletionControl,
}: ContenidoLeccionConCompletadoProps) {
  const automatic = completionMode === "automatico";
  const autoCompletion = useAutoCompletion({
    enabled: automatic,
    alreadyCompleted: completed,
    courseId,
    enrollmentId,
    lessonId,
  });

  return (
    <>
      <VistaContenidoLeccion
        tituloLeccion={lessonTitle}
        contextoLeccion={lessonContext}
        completada={completed}
        recursos={recursos}
        contenidoTexto={contenidoTexto}
        infografiaInteractiva={infografiaInteractiva}
        enrollmentId={enrollmentId}
        lessonId={lessonId}
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

      {automatic && (
        <div className="mt-5">
          <EstadoCompletadoAutomatico
            completed={completed}
            status={autoCompletion.status}
            errorMessage={autoCompletion.errorMessage}
            justCompleted={autoCompletion.justCompleted}
            onRetry={autoCompletion.retry}
          />
        </div>
      )}

      <ProximosContenidos portadaCursoUrl={portadaCursoUrl} proximos={proximos} />

      {!automatic && (
        <div className="mt-5">
          {manualCompletionControl}
        </div>
      )}
    </>
  );
}
