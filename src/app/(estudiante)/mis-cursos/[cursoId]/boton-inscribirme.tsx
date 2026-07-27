"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inscribirme } from "@/server/actions/inscripciones";

export function BotonInscribirme({ cursoId }: { cursoId: string }) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();

  function inscribir() {
    iniciar(async () => {
      const res = await inscribirme(cursoId);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo inscribir");
        return;
      }
      toast.success("Inscripción exitosa");
      router.refresh();
    });
  }

  return (
    <Button onClick={inscribir} disabled={enviando}>
      {enviando && <Loader2 className="animate-spin" />}
      Inscribirme en este curso
    </Button>
  );
}
