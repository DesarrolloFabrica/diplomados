"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EllipsisVertical, Loader2, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { desinscribirmePrueba } from "@backend/server/actions/inscripciones";

interface MenuOpcionesCursoProps {
  cursoId: string;
  cursoTitulo: string;
  className?: string;
}

/**
 * Menú de tres puntos (esquina superior derecha) de las tarjetas de curso en
 * las 4 interfaces. Hoy ofrece "Desinscribirme del curso", con confirmación
 * porque elimina la inscripción.
 *
 * Las tarjetas suelen ser un <Link>: todo clic dentro del menú (incluido el
 * diálogo, que aunque se monte en un portal propaga eventos por el árbol de
 * React) se detiene aquí para no navegar al curso.
 */
export function MenuOpcionesCurso({ cursoId, cursoTitulo, className }: MenuOpcionesCursoProps) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, iniciar] = useTransition();
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return undefined;

    function alPresionarFuera(evento: PointerEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) setAbierto(false);
    }
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }

    document.addEventListener("pointerdown", alPresionarFuera);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("pointerdown", alPresionarFuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierto]);

  function desinscribir() {
    iniciar(async () => {
      const res = await desinscribirmePrueba(cursoId);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo cancelar la inscripción");
        return;
      }
      setConfirmando(false);
      toast.success("Te desinscribiste del curso");
      router.refresh();
    });
  }

  return (
    <div
      ref={contenedorRef}
      className={cn("absolute right-2 top-2 z-20", className)}
      onClick={(evento) => {
        // Evita navegar con el <Link> de la tarjeta (ver comentario arriba).
        evento.preventDefault();
        evento.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        aria-label={`Opciones de ${cursoTitulo}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="inline-flex size-8 items-center justify-center rounded-full border border-white/30 bg-[#061120]/55 text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-md transition-colors hover:bg-[#061120]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <EllipsisVertical className="size-4" aria-hidden="true" />
      </button>

      {abierto && (
        <div
          role="menu"
          aria-label={`Opciones de ${cursoTitulo}`}
          // Cabe dentro de la tarjeta más angosta (~176px en gamified), que
          // recorta lo que sobresale (overflow-hidden).
          className="absolute right-0 top-10 w-[164px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-800 shadow-[0_14px_36px_rgba(6,17,32,0.28)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-150"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAbierto(false);
              setConfirmando(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold leading-tight text-red-700 transition-colors hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            Desinscribirme del curso
          </button>
        </div>
      )}

      <Dialog open={confirmando} onOpenChange={(valor) => !enviando && setConfirmando(valor)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Desinscribirte de este curso?</DialogTitle>
            <DialogDescription>
              Saldrás de &quot;{cursoTitulo}&quot; y se eliminará tu inscripción. Podrás
              volver a inscribirte desde la ficha del curso.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={enviando}
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={desinscribir}
              disabled={enviando}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Sí, desinscribirme
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
