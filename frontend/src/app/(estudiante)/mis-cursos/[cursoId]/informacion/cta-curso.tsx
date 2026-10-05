"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { inscribirme } from "@backend/server/actions/inscripciones";
import type { PreviewCursoConfig } from "./preview-config";
import { PreviewCursoDialog } from "./preview-curso";

interface CtaCursoProps {
  cursoId: string;
  inscrito: boolean;
  completado?: boolean;
  hrefContinuar?: string;
  className?: string;
  /** Vista previa real del curso (infografía de muestra), si existe. */
  preview?: PreviewCursoConfig | null;
  /**
   * El hero se apoya en una portada con scrim oscuro fijo (texto blanco
   * siempre, sin importar la interfaz) — la sección de CTA final en cambio
   * se apoya en --interface-surface, que sí cambia de claro a oscuro por
   * interfaz. El botón "Ver intro" necesita dos estilos distintos según
   * dónde se use para no perder contraste en ninguno de los dos casos.
   */
  sobreImagen?: boolean;
}

const claseBase =
  "inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[var(--interface-accent)] px-6 text-sm font-extrabold text-[var(--interface-accent-foreground)] shadow-[0_12px_32px_rgba(66,162,149,0.25)] transition-[transform,opacity] hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-65 sm:w-auto";

const claseSecundaria =
  "inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border-2 px-6 text-sm font-extrabold transition-[transform,background-color] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto";

export function CtaCurso({
  cursoId,
  inscrito,
  completado = false,
  hrefContinuar,
  className,
  preview,
  sobreImagen = false,
}: CtaCursoProps) {
  const router = useRouter();
  const [enviando, iniciarTransicion] = useTransition();
  const [previewAbierto, setPreviewAbierto] = useState(false);
  const hrefCurso = hrefContinuar ?? `/mis-cursos/${cursoId}`;

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

  const botonVerIntro = !inscrito && preview && (
    <>
      <button
        type="button"
        onClick={() => setPreviewAbierto(true)}
        className={cn(
          claseSecundaria,
          sobreImagen
            ? "border-white/50 text-white hover:bg-white/10 focus-visible:ring-white"
            : "border-[var(--interface-border)] text-[var(--interface-text)] hover:bg-[color-mix(in_srgb,var(--interface-text)_8%,transparent)] focus-visible:ring-[var(--interface-accent-secondary)]",
        )}
      >
        <Eye className="size-4" aria-hidden="true" />
        Ver intro
      </button>
      <PreviewCursoDialog
        cursoId={cursoId}
        preview={preview}
        abierto={previewAbierto}
        onOpenChange={setPreviewAbierto}
      />
    </>
  );

  if (inscrito) {
    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <Link href={hrefCurso} className={claseBase}>
          <Play className="size-4 fill-current" aria-hidden="true" />
          {completado ? "Revisar curso" : "Continuar"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {botonVerIntro}
      <button type="button" disabled={enviando} onClick={inscribir} className={claseBase}>
        {enviando ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Play className="size-4 fill-current" aria-hidden="true" />
        )}
        {enviando ? "Inscribiendo..." : "Inscribirme"}
        {!enviando && <ArrowRight className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
