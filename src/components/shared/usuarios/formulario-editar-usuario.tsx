"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actualizarUsuario } from "@/server/actions/usuarios";
import type { UsuarioFila } from "@/server/queries/usuarios";

interface FormularioEditarUsuarioProps {
  usuario: UsuarioFila;
  onExito: () => void;
}

interface CamposEditar {
  nombreCompleto: string;
  cargo: string;
  area: string;
}

export function FormularioEditarUsuario({ usuario, onExito }: FormularioEditarUsuarioProps) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const { register, handleSubmit } = useForm<CamposEditar>({
    defaultValues: {
      nombreCompleto: usuario.nombreCompleto,
      cargo: usuario.cargo ?? "",
      area: usuario.area ?? "",
    },
  });

  const onSubmit = (values: CamposEditar) => {
    const datos = new FormData();
    datos.set("nombreCompleto", values.nombreCompleto);
    if (values.cargo) datos.set("cargo", values.cargo);
    if (values.area) datos.set("area", values.area);

    iniciar(async () => {
      const res = await actualizarUsuario(usuario.id, null, datos);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo guardar");
        return;
      }
      toast.success("Usuario actualizado");
      router.refresh();
      onExito();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label>Correo</Label>
        <Input value={usuario.email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nombreCompleto">Nombre completo</Label>
        <Input id="nombreCompleto" {...register("nombreCompleto", { required: true })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cargo">Cargo</Label>
          <Input id="cargo" {...register("cargo")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area">Área</Label>
          <Input id="area" {...register("area")} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  );
}
