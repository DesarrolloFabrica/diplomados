"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recuperarClave } from "@/server/actions/auth";
import { recuperarSchema, type RecuperarInput } from "@/lib/validators/auth";

export function FormularioRecuperar() {
  const [enviando, iniciar] = useTransition();
  const [enviado, setEnviado] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperarInput>({ resolver: zodResolver(recuperarSchema) });

  const onSubmit = (values: RecuperarInput) => {
    const datos = new FormData();
    datos.set("email", values.email);
    iniciar(async () => {
      const res = await recuperarClave(null, datos);
      if (res?.ok) setEnviado(res.mensaje ?? "Revisa tu correo.");
    });
  };

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-accent/40 p-6 text-center">
        <MailCheck className="h-8 w-8 text-primary" />
        <p className="text-sm text-foreground">{enviado}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@empresa.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        Enviar enlace
      </Button>
    </form>
  );
}
