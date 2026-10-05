"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, FlaskConical } from "lucide-react";
import { desinscribirmePrueba } from "@backend/server/actions/inscripciones";

/**
 * TEMPORAL: botón de prueba para desinscribirse de un curso desde el
 * catálogo general, sin depender de herramientas de base de datos, y así
 * poder probar repetidamente la ficha/landing de curso
 * ("/mis-cursos/[cursoId]/informacion") en su estado "no inscrito".
 * Quitar junto con `desinscribirmePrueba` cuando ya no haga falta.
 */
export function BotonDesinscribirmePrueba({ cursoId }: { cursoId: string }) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();

  function desinscribir(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    iniciar(async () => {
      const res = await desinscribirmePrueba(cursoId);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo desinscribir");
        return;
      }
      toast.success("Desinscrito (prueba)");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={desinscribir}
      disabled={enviando}
      title="Prueba: desinscribirme de este curso"
      className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-amber-950 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {enviando ? (
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      ) : (
        <FlaskConical className="size-3" aria-hidden="true" />
      )}
      Desinscribirme
    </button>
  );
}
