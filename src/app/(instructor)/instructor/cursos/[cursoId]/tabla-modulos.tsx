"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
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
import { FormularioModulo } from "./formulario-modulo";
import { eliminarModulo } from "@/server/actions/modulos";
import type { ModuloFila } from "@/server/queries/cursos";

interface TablaModulosProps {
  cursoId: string;
  modulos: ModuloFila[];
}

export function TablaModulos({ cursoId, modulos }: TablaModulosProps) {
  const router = useRouter();
  const [dialogoCrear, setDialogoCrear] = useState(false);
  const [moduloEditar, setModuloEditar] = useState<ModuloFila | null>(null);
  const [, iniciar] = useTransition();

  function eliminar(modulo: ModuloFila) {
    if (!confirm(`¿Eliminar el módulo "${modulo.titulo}"? Se ocultarán sus lecciones.`)) return;
    iniciar(async () => {
      const res = await eliminarModulo(cursoId, modulo.id);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo eliminar");
        return;
      }
      toast.success("Módulo eliminado");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogoCrear(true)}>
          <Plus className="h-4 w-4" />
          Nuevo módulo
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modulos.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Todavía no hay módulos.
                </TableCell>
              </TableRow>
            )}
            {modulos.map((modulo, indice) => (
              <TableRow key={modulo.id}>
                <TableCell className="text-muted-foreground">{indice + 1}</TableCell>
                <TableCell className="font-medium">{modulo.titulo}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setModuloEditar(modulo)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => eliminar(modulo)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/instructor/cursos/${cursoId}/modulos/${modulo.id}`}>
                        Lecciones
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
            <DialogTitle>Nuevo módulo</DialogTitle>
          </DialogHeader>
          <FormularioModulo cursoId={cursoId} onExito={() => setDialogoCrear(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!moduloEditar} onOpenChange={(abierto) => !abierto && setModuloEditar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar módulo</DialogTitle>
          </DialogHeader>
          {moduloEditar && (
            <FormularioModulo
              cursoId={cursoId}
              modulo={moduloEditar}
              onExito={() => setModuloEditar(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
