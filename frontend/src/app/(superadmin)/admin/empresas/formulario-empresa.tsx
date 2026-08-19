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
import { empresaSchema, type EmpresaInput } from "@backend/lib/validators/empresas";
import { crearEmpresa, actualizarEmpresa } from "@backend/server/actions/empresas";
import type { EmpresaFila } from "@backend/server/queries/empresas";

interface FormularioEmpresaProps {
  empresa?: EmpresaFila;
  onExito: () => void;
}

export function FormularioEmpresa({ empresa, onExito }: FormularioEmpresaProps) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmpresaInput>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nombre: empresa?.nombre ?? "",
      nit: empresa?.nit ?? "",
    },
  });

  const onSubmit = (values: EmpresaInput) => {
    const datos = new FormData();
    datos.set("nombre", values.nombre);
    if (values.nit) datos.set("nit", values.nit);
    if (values.logoUrl) datos.set("logoUrl", values.logoUrl);

    iniciar(async () => {
      const accion = empresa ? actualizarEmpresa.bind(null, empresa.id) : crearEmpresa;
      const res = await accion(null, datos);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo guardar");
        return;
      }
      toast.success(empresa ? "Empresa actualizada" : "Empresa creada");
      router.refresh();
      onExito();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" placeholder="Nombre de la empresa" {...register("nombre")} />
        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="nit">NIT (opcional)</Label>
        <Input id="nit" placeholder="900123456-7" {...register("nit")} />
        {errors.nit && <p className="text-sm text-destructive">{errors.nit.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="logoUrl">URL del logo (opcional)</Label>
        <Input id="logoUrl" placeholder="https://..." {...register("logoUrl")} />
        {errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        {empresa ? "Guardar cambios" : "Crear empresa"}
      </Button>
    </form>
  );
}
