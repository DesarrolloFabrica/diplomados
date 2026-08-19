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
import { FormularioCrearUsuario } from "./formulario-crear-usuario";
import { FormularioEditarUsuario } from "./formulario-editar-usuario";
import { cambiarEstadoUsuario } from "@backend/server/actions/usuarios";
import type { UsuarioFila } from "@backend/server/queries/usuarios";
import type { EmpresaOpcion } from "@backend/server/queries/empresas";
import { ETIQUETA_ROL } from "@backend/config/roles";
import type { Rol } from "@backend/types";

interface TablaUsuariosProps {
  usuarios: UsuarioFila[];
  rolesPermitidos: Rol[];
  empresas?: EmpresaOpcion[];
  empresaFija?: string;
  mostrarColumnaEmpresa?: boolean;
}

export function TablaUsuarios({
  usuarios,
  rolesPermitidos,
  empresas,
  empresaFija,
  mostrarColumnaEmpresa = false,
}: TablaUsuariosProps) {
  const router = useRouter();
  const [dialogoCrear, setDialogoCrear] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<UsuarioFila | null>(null);
  const [, iniciar] = useTransition();

  function alternarEstado(usuario: UsuarioFila) {
    iniciar(async () => {
      const res = await cambiarEstadoUsuario(usuario.id, !usuario.activo);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo actualizar el estado");
        return;
      }
      toast.success(usuario.activo ? "Usuario desactivado" : "Usuario activado");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogoCrear(true)}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              {mostrarColumnaEmpresa && <TableHead>Empresa</TableHead>}
              <TableHead>Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={mostrarColumnaEmpresa ? 6 : 5}
                  className="py-10 text-center text-muted-foreground"
                >
                  Todavía no hay usuarios registrados.
                </TableCell>
              </TableRow>
            )}
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.nombreCompleto}</TableCell>
                <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ETIQUETA_ROL[usuario.rol]}</Badge>
                </TableCell>
                {mostrarColumnaEmpresa && (
                  <TableCell className="text-muted-foreground">
                    {usuario.empresaNombre ?? "—"}
                  </TableCell>
                )}
                <TableCell>
                  <Switch
                    checked={usuario.activo}
                    onCheckedChange={() => alternarEstado(usuario)}
                    aria-label="Activar o desactivar usuario"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setUsuarioEditar(usuario)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogoCrear} onOpenChange={setDialogoCrear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Se enviará un correo de invitación para que cree su contraseña.
            </DialogDescription>
          </DialogHeader>
          <FormularioCrearUsuario
            rolesPermitidos={rolesPermitidos}
            empresas={empresas}
            empresaFija={empresaFija}
            onExito={() => setDialogoCrear(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!usuarioEditar}
        onOpenChange={(abierto) => !abierto && setUsuarioEditar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          {usuarioEditar && (
            <FormularioEditarUsuario
              usuario={usuarioEditar}
              onExito={() => setUsuarioEditar(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
