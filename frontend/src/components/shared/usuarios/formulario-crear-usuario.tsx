"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { usuarioSchema, type UsuarioInput } from "@backend/lib/validators/usuarios";
import { crearUsuario } from "@backend/server/actions/usuarios";
import type { EmpresaOpcion } from "@backend/server/queries/empresas";
import { ETIQUETA_ROL } from "@backend/config/roles";
import type { Rol } from "@backend/types";

interface FormularioCrearUsuarioProps {
  rolesPermitidos: Rol[];
  empresas?: EmpresaOpcion[]; // si se pasa, se muestra selector de empresa
  empresaFija?: string;
  onExito: () => void;
}

export function FormularioCrearUsuario({
  rolesPermitidos,
  empresas,
  empresaFija,
  onExito,
}: FormularioCrearUsuarioProps) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const [enlaceInvitacion, setEnlaceInvitacion] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<UsuarioInput>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      rol: rolesPermitidos[0],
      empresaId: empresaFija ?? "",
    },
  });

  const rolElegido = watch("rol");

  const onSubmit = (values: UsuarioInput) => {
    const datos = new FormData();
    datos.set("email", values.email);
    datos.set("nombreCompleto", values.nombreCompleto);
    datos.set("rol", values.rol);
    if (!empresaFija && values.empresaId) datos.set("empresaId", values.empresaId);
    if (values.cargo) datos.set("cargo", values.cargo);
    if (values.area) datos.set("area", values.area);

    iniciar(async () => {
      const accion = crearUsuario.bind(null, rolesPermitidos, empresaFija ?? null);
      const res = await accion(null, datos);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo crear el usuario");
        return;
      }
      toast.success("Usuario creado");
      router.refresh();
      if (res.enlaceInvitacion) {
        setEnlaceInvitacion(res.enlaceInvitacion);
      } else {
        onExito();
      }
    });
  };

  if (enlaceInvitacion) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          El usuario se creó, pero no se pudo enviar el correo de invitación
          (revisa la configuración de SendGrid). Comparte este enlace a mano
          para que la persona cree su contraseña:
        </p>
        <div className="flex items-center gap-2">
          <Input readOnly value={enlaceInvitacion} className="text-xs" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(enlaceInvitacion);
              toast.success("Enlace copiado");
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <Button className="w-full" onClick={onExito}>
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" type="email" placeholder="nombre@empresa.com" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="nombreCompleto">Nombre completo</Label>
        <Input id="nombreCompleto" {...register("nombreCompleto")} />
        {errors.nombreCompleto && (
          <p className="text-sm text-destructive">{errors.nombreCompleto.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Rol</Label>
        <Controller
          control={control}
          name="rol"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rolesPermitidos.map((rol) => (
                  <SelectItem key={rol} value={rol}>
                    {ETIQUETA_ROL[rol]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      {!empresaFija && rolElegido !== "superadmin" && (
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Controller
            control={control}
            name="empresaId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una empresa" />
                </SelectTrigger>
                <SelectContent>
                  {(empresas ?? []).map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.empresaId && (
            <p className="text-sm text-destructive">{errors.empresaId.message}</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cargo">Cargo (opcional)</Label>
          <Input id="cargo" {...register("cargo")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area">Área (opcional)</Label>
          <Input id="area" {...register("area")} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        Crear usuario
      </Button>
    </form>
  );
}
