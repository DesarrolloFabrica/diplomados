"use client";

import { useState } from "react";
import { Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecursoIncrustado } from "@/components/shared/recurso-incrustado";
import { cn } from "@/lib/utils";
import type { PreviewCursoConfig } from "./preview-config";

interface PreviewCursoDialogProps {
  cursoId: string;
  preview: PreviewCursoConfig;
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
}

/** Dialog reutilizado tanto por el boton "Ver intro" del hero como por la seccion "Vista previa". */
export function PreviewCursoDialog({
  cursoId,
  preview,
  abierto,
  onOpenChange,
}: PreviewCursoDialogProps) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{preview.previewTitle}</DialogTitle>
          <DialogDescription>Recurso de muestra del curso.</DialogDescription>
        </DialogHeader>
        <RecursoIncrustado
          resourceId={`preview-${cursoId}`}
          nombre={preview.previewTitle}
          tipo={preview.previewType}
          url={preview.previewResourceUrl}
          autoCompletionEnabled={false}
        />
      </DialogContent>
    </Dialog>
  );
}

interface PreviewCursoProps {
  cursoId: string;
  preview: PreviewCursoConfig;
}

export function PreviewCurso({ cursoId, preview }: PreviewCursoProps) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <article className="grid overflow-hidden rounded-[28px] border border-[var(--interface-border)] bg-[var(--interface-surface)] text-[var(--interface-text)] shadow-[var(--interface-shadow)] backdrop-blur-xl lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]">
        <div className="relative min-h-[260px] overflow-hidden bg-[#061120]">
          {preview.previewThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.previewThumbnail}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_28%,rgba(45,212,191,0.22),transparent_34%),linear-gradient(135deg,#071B30,#061120)]">
              <FileText className="size-16 text-white/54" aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(6,17,32,0.68))]" />
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--interface-accent-secondary)]">
            Vista previa
          </p>
          <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
            Conoce una clase antes de comenzar
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--interface-text-muted)]">
            {preview.previewTitle}
          </p>
          <div className="mt-6">
            <Button
              type="button"
              onClick={() => setAbierto(true)}
              className={cn(
                "min-h-11 rounded-full bg-[var(--interface-accent)] px-5 font-extrabold text-[var(--interface-accent-foreground)]",
                "hover:bg-[var(--interface-accent)]/90",
              )}
            >
              <Eye className="size-4" aria-hidden="true" />
              Ver intro
            </Button>
          </div>
        </div>
      </article>

      <PreviewCursoDialog
        cursoId={cursoId}
        preview={preview}
        abierto={abierto}
        onOpenChange={setAbierto}
      />
    </>
  );
}
