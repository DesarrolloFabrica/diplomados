"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { asignarInstructorCurso } from "@backend/server/actions/cursos";
import type { InstructorOpcion } from "@backend/server/queries/cursos";

interface DialogoAsignarInstructorProps {
  curso: { id: string; titulo: string; autorId: string | null } | null;
  instructores: InstructorOpcion[];
  onCerrar: () => void;
}

export function DialogoAsignarInstructor({
  curso,
  instructores,
  onCerrar,
}: DialogoAsignarInstructorProps) {
  return (
    <Dialog open={curso !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="admin-dialog max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Instructor del curso</DialogTitle>
          <DialogDescription>
            {curso?.titulo}. El instructor asignado podrá editar módulos, lecciones, recursos y
            evaluaciones. Los datos generales y la publicación siguen siendo del superadmin.
          </DialogDescription>
        </DialogHeader>
        {curso ? (
          // key: reinicia la selección cada vez que se abre otro curso.
          <SelectorInstructor
            key={curso.id}
            cursoId={curso.id}
            autorActual={curso.autorId}
            instructores={instructores}
            onExito={onCerrar}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SelectorInstructor({
  cursoId,
  autorActual,
  instructores,
  onExito,
}: {
  cursoId: string;
  autorActual: string | null;
  instructores: InstructorOpcion[];
  onExito: () => void;
}) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<string | null>(
    instructores.some((i) => i.id === autorActual) ? autorActual : null,
  );
  const [guardando, iniciar] = useTransition();

  function guardar() {
    if (!seleccion) return;
    iniciar(async () => {
      const res = await asignarInstructorCurso(cursoId, seleccion);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo asignar el instructor");
        return;
      }
      toast.success("Instructor asignado");
      router.refresh();
      onExito();
    });
  }

  if (!instructores.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay usuarios con rol instructor. Créalos desde Usuarios.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="max-h-[50vh] space-y-1 overflow-y-auto" role="radiogroup">
        {instructores.map((instructor) => (
          <li key={instructor.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-white/5">
              <input
                type="radio"
                name="instructor"
                className="size-4 accent-[#2dd4bf]"
                checked={seleccion === instructor.id}
                onChange={() => setSeleccion(instructor.id)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {instructor.nombreCompleto}
                  {instructor.id === autorActual ? " · actual" : ""}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {instructor.email}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        className="admin-primary-button w-full"
        onClick={guardar}
        disabled={guardando || !seleccion || seleccion === autorActual}
      >
        {guardando && <Loader2 className="animate-spin" />}
        Asignar instructor
      </Button>
    </div>
  );
}
