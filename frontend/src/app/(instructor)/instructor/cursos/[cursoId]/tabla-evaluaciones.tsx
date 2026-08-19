"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormularioEvaluacion } from "./formulario-evaluacion";
import { eliminarEvaluacion } from "@backend/server/actions/evaluaciones";
import type { EvaluacionFila } from "@backend/server/queries/evaluaciones";

interface TablaEvaluacionesProps {
  cursoId: string;
  evaluaciones: EvaluacionFila[];
}

export function TablaEvaluaciones({ cursoId, evaluaciones }: TablaEvaluacionesProps) {
  const router = useRouter();
  const [dialogoCrear, setDialogoCrear] = useState(false);
  const [, iniciar] = useTransition();

  function eliminar(evaluacion: EvaluacionFila) {
    if (!confirm(`¿Eliminar la evaluación "${evaluacion.titulo}"?`)) return;
    iniciar(async () => {
      const res = await eliminarEvaluacion(cursoId, evaluacion.id);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo eliminar");
        return;
      }
      toast.success("Evaluación eliminada");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogoCrear(true)}>
          <Plus className="h-4 w-4" />
          Nueva evaluación
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Intentos</TableHead>
              <TableHead>Aprobación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluaciones.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Todavía no hay evaluaciones.
                </TableCell>
              </TableRow>
            )}
            {evaluaciones.map((evaluacion) => (
              <TableRow key={evaluacion.id}>
                <TableCell className="font-medium">{evaluacion.titulo}</TableCell>
                <TableCell className="text-muted-foreground">{evaluacion.maxIntentos}</TableCell>
                <TableCell className="text-muted-foreground">
                  {Number(evaluacion.puntajeMinimo)}%
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => eliminar(evaluacion)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/instructor/cursos/${cursoId}/evaluaciones/${evaluacion.id}`}>
                        Preguntas
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogoCrear} onOpenChange={setDialogoCrear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva evaluación</DialogTitle>
          </DialogHeader>
          <FormularioEvaluacion
            cursoId={cursoId}
            onExito={(evaluacionId) => {
              setDialogoCrear(false);
              router.push(`/instructor/cursos/${cursoId}/evaluaciones/${evaluacionId}`);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
