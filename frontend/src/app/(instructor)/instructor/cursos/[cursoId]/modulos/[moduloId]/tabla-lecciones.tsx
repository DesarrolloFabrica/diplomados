"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { FormularioLeccion } from "./formulario-leccion";
import { eliminarLeccion } from "@backend/server/actions/lecciones";
import type { LeccionFila } from "@backend/server/queries/modulos";

interface TablaLeccionesProps {
  cursoId: string;
  moduloId: string;
  lecciones: LeccionFila[];
}

const ETIQUETA_TIPO: Record<LeccionFila["tipoContenido"], string> = {
  texto: "Texto",
  video: "Video",
  archivo: "Archivo",
  mixto: "Mixto",
};

export function TablaLecciones({ cursoId, moduloId, lecciones }: TablaLeccionesProps) {
  const router = useRouter();
  const [dialogoCrear, setDialogoCrear] = useState(false);
  const [leccionEditar, setLeccionEditar] = useState<LeccionFila | null>(null);
  const [, iniciar] = useTransition();

  function eliminar(leccion: LeccionFila) {
    if (!confirm(`¿Eliminar la lección "${leccion.titulo}"?`)) return;
    iniciar(async () => {
      const res = await eliminarLeccion(cursoId, moduloId, leccion.id);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo eliminar");
        return;
      }
      toast.success("Lección eliminada");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogoCrear(true)}>
          <Plus className="h-4 w-4" />
          Nueva lección
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lecciones.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Todavía no hay lecciones.
                </TableCell>
              </TableRow>
            )}
            {lecciones.map((leccion, indice) => (
              <TableRow key={leccion.id}>
                <TableCell className="text-muted-foreground">{indice + 1}</TableCell>
                <TableCell className="font-medium">{leccion.titulo}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ETIQUETA_TIPO[leccion.tipoContenido]}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setLeccionEditar(leccion)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => eliminar(leccion)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/instructor/cursos/${cursoId}/modulos/${moduloId}/lecciones/${leccion.id}`}
                      >
                        Recursos
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva lección</DialogTitle>
          </DialogHeader>
          <FormularioLeccion
            cursoId={cursoId}
            moduloId={moduloId}
            onExito={() => setDialogoCrear(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!leccionEditar}
        onOpenChange={(abierto) => !abierto && setLeccionEditar(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar lección</DialogTitle>
          </DialogHeader>
          {leccionEditar && (
            <FormularioLeccion
              cursoId={cursoId}
              moduloId={moduloId}
              leccion={leccionEditar}
              onExito={() => setLeccionEditar(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
