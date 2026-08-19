"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { restablecerClave } from "@backend/server/actions/auth";
import { restablecerSchema, type RestablecerInput } from "@backend/lib/validators/auth";

interface FormularioRestablecerProps {
  token: string;
}

export function FormularioRestablecer({ token }: FormularioRestablecerProps) {
  const [enviando, iniciar] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RestablecerInput>({ resolver: zodResolver(restablecerSchema) });

  const onSubmit = (values: RestablecerInput) => {
    const datos = new FormData();
    datos.set("password", values.password);
    datos.set("confirmar", values.confirmar);
    datos.set("token", token);
    iniciar(async () => {
      const res = await restablecerClave(null, datos);
      if (res && !res.ok) toast.error(res.mensaje ?? "No se pudo actualizar");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmar">Confirmar contraseña</Label>
        <Input
          id="confirmar"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("confirmar")}
        />
        {errors.confirmar && (
          <p className="text-sm text-destructive">{errors.confirmar.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        Guardar contraseña
      </Button>
    </form>
  );
}
