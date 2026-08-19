"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { moduloSchema, type ModuloInput } from "@backend/lib/validators/modulos";
import { crearModulo, actualizarModulo } from "@backend/server/actions/modulos";
import type { ModuloFila } from "@backend/server/queries/cursos";

interface FormularioModuloProps {
  cursoId: string;
  modulo?: ModuloFila;
  onExito: () => void;
}

export function FormularioModulo({ cursoId, modulo, onExito }: FormularioModuloProps) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ModuloInput>({
    resolver: zodResolver(moduloSchema),
    defaultValues: {
      titulo: modulo?.titulo ?? "",
      descripcion: modulo?.descripcion ?? "",
    },
  });

  const onSubmit = (values: ModuloInput) => {
    const datos = new FormData();
    datos.set("titulo", values.titulo);
    if (values.descripcion) datos.set("descripcion", values.descripcion);

    iniciar(async () => {
      const res = modulo
        ? await actualizarModulo(cursoId, modulo.id, null, datos)
        : await crearModulo(cursoId, null, datos);

      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo guardar");
        return;
      }
      toast.success(modulo ? "Módulo actualizado" : "Módulo creado");
      router.refresh();
      onExito();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" {...register("titulo")} />
        {errors.titulo && <p className="text-sm text-destructive">{errors.titulo.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción (opcional)</Label>
        <Textarea id="descripcion" rows={3} {...register("descripcion")} />
      </div>
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        {modulo ? "Guardar cambios" : "Crear módulo"}
      </Button>
    </form>
  );
}
