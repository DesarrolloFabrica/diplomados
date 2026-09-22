"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { inscribirme } from "@backend/server/actions/inscripciones";

interface CtaCursoProps {
  cursoId: string;
  inscrito: boolean;
  completado?: boolean;
  className?: string;
}

const claseBase =
  "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-md bg-[#91DC00] px-6 text-sm font-extrabold text-[#061120] shadow-[0_12px_32px_rgba(66,162,149,0.25)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#a4e92b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120] disabled:pointer-events-none disabled:opacity-65";

export function CtaCurso({ cursoId, inscrito, completado = false, className }: CtaCursoProps) {
  const router = useRouter();
  const [enviando, iniciarTransicion] = useTransition();
  const hrefCurso = `/mis-cursos/${cursoId}`;

  if (inscrito) {
    return (
      <Link href={hrefCurso} className={cn(claseBase, className)}>
        <Play className="size-4 fill-current" aria-hidden="true" />
        {completado ? "Revisar curso" : "Continuar aprendizaje"}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    );
  }

  function inscribir() {
    if (enviando) return;

    iniciarTransicion(async () => {
      const resultado = await inscribirme(cursoId);
      if (!resultado.ok) {
        toast.error(resultado.mensaje ?? "No se pudo completar la inscripción");
        return;
      }

      toast.success("Inscripción completada");
      router.push(hrefCurso);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={enviando}
      onClick={inscribir}
      className={cn(claseBase, className)}
    >
      {enviando ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Play className="size-4 fill-current" aria-hidden="true" />
      )}
      {enviando ? "Inscribiendo..." : "Inscribirme"}
      {!enviando && <ArrowRight className="size-4" aria-hidden="true" />}
    </button>
  );
}
