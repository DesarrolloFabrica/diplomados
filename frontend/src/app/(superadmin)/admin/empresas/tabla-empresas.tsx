"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { FormularioEmpresa } from "./formulario-empresa";
import { cambiarEstadoEmpresa } from "@backend/server/actions/empresas";
import type { EmpresaFila } from "@backend/server/queries/empresas";

interface TablaEmpresasProps {
  empresas: EmpresaFila[];
}

export function TablaEmpresas({ empresas }: TablaEmpresasProps) {
  const router = useRouter();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [empresaEditar, setEmpresaEditar] = useState<EmpresaFila | undefined>();
  const [, iniciar] = useTransition();

  function abrirCrear() {
    setEmpresaEditar(undefined);
    setDialogoAbierto(true);
  }

  function abrirEditar(empresa: EmpresaFila) {
    setEmpresaEditar(empresa);
    setDialogoAbierto(true);
  }

  function alternarEstado(empresa: EmpresaFila) {
    const nuevoEstado = empresa.estado === "activa" ? "inactiva" : "activa";
    iniciar(async () => {
      const res = await cambiarEstadoEmpresa(empresa.id, nuevoEstado);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo actualizar el estado");
        return;
      }
      toast.success(nuevoEstado === "activa" ? "Empresa activada" : "Empresa desactivada");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={abrirCrear}>
          <Plus className="h-4 w-4" />
          Nueva empresa
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresas.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Todavía no hay empresas registradas.
                </TableCell>
              </TableRow>
            )}
            {empresas.map((empresa) => (
              <TableRow key={empresa.id}>
                <TableCell className="font-medium">{empresa.nombre}</TableCell>
                <TableCell className="text-muted-foreground">{empresa.nit ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={empresa.estado === "activa" ? "default" : "secondary"}>
                    {empresa.estado === "activa" ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Switch
                      checked={empresa.estado === "activa"}
                      onCheckedChange={() => alternarEstado(empresa)}
                      aria-label="Activar o desactivar empresa"
                    />
                    <Button variant="ghost" size="icon" onClick={() => abrirEditar(empresa)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{empresaEditar ? "Editar empresa" : "Nueva empresa"}</DialogTitle>
            <DialogDescription>
              {empresaEditar
                ? "Actualiza los datos de la empresa."
                : "Registra una nueva empresa cliente."}
            </DialogDescription>
          </DialogHeader>
          <FormularioEmpresa empresa={empresaEditar} onExito={() => setDialogoAbierto(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
