"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marcarLeccionCompletada } from "@/server/actions/progreso";

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

  if (completada) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-success">
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
      toast.success("Lección completada");
      router.refresh();
    });
  }

  return (
    <Button onClick={completar} disabled={enviando}>
      {enviando && <Loader2 className="animate-spin" />}
      Marcar como completada
    </Button>
  );
}
