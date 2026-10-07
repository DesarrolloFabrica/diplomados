"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CLASE_PANEL_GLASS_LEGIBLE } from "@/config/paneles-glass";
import { marcarLeccionCompletada } from "@backend/server/actions/progreso";

interface BotonCompletarProps {
  cursoId: string;
  inscripcionId: string;
  leccionId: string;
  completada: boolean;
}

export function BotonCompletar({
  cursoId,
  inscripcionId,
  leccionId,
  completada,
}: BotonCompletarProps) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  if (completada) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-emerald-700",
          CLASE_PANEL_GLASS_LEGIBLE,
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
        Lección completada
      </div>
    );
  }

  function completar() {
    iniciar(async () => {
      const res = await marcarLeccionCompletada(cursoId, inscripcionId, leccionId);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo marcar como completada");
        return;
      }
      setConfirmando(false);
      toast.success("Lección completada");

      router.push(
        `/mis-cursos/${cursoId}?roadmapTransition=${encodeURIComponent(leccionId)}`,
        { scroll: false },
      );
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        disabled={enviando}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold",
          "bg-white text-[#061120] shadow-[0_8px_24px_rgba(6,17,32,0.2)] transition-[transform,background-color] duration-200",
          "hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]",
        )}
      >
        {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
        Marcar como completada
      </button>

      {/* Confirmación: recuerda revisar todo el contenido antes de completar. */}
      <Dialog open={confirmando} onOpenChange={(abierto) => !enviando && setConfirmando(abierto)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Marcar la lección como completada?</DialogTitle>
            <DialogDescription>
              Asegúrate de revisar todo el contenido antes de marcar como completada la
              lección.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={enviando}
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
            >
              Seguir revisando
            </button>
            <button
              type="button"
              onClick={completar}
              disabled={enviando}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#061120] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0b2238] disabled:opacity-60"
            >
              {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
              Sí, marcar como completada
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
