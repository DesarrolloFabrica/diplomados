"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { iniciarSesion } from "@/server/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

const inputLoginClassName =
  "h-11 rounded-lg border border-[#d5dbe3] bg-white text-cun-blue placeholder:text-slate-400 " +
  "dark:border-white/15 dark:bg-[#0b1b2b] dark:text-[#f5f7fa] dark:placeholder:text-[#aab6c5] " +
  "focus-visible:border-cun-green focus-visible:outline-none focus-visible:ring-[3px] " +
  "focus-visible:ring-[rgba(145,220,0,0.18)] focus-visible:ring-offset-0 " +
  "dark:focus-visible:border-cun-green dark:focus-visible:ring-[rgba(145,220,0,0.28)]";

const botonLoginClassName =
  "h-11 w-full rounded-lg bg-cun-green font-bold text-cun-blue shadow-none " +
  "transition-[background-color,transform,box-shadow] duration-200 ease-in-out " +
  "hover:-translate-y-px hover:bg-[#7fc400] hover:text-cun-blue " +
  "active:translate-y-0 " +
  "focus-visible:ring-cun-green focus-visible:ring-offset-2 " +
  "disabled:translate-y-0 disabled:opacity-60";

export function FormularioLogin() {
  const [enviando, iniciar] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginInput) => {
    const datos = new FormData();
    datos.set("email", values.email);
    datos.set("password", values.password);

    iniciar(async () => {
      // En caso de éxito, la acción redirige y no retorna.
      const res = await iniciarSesion(null, datos);
      if (res && !res.ok) toast.error(res.mensaje ?? "No se pudo iniciar sesión");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-cun-blue dark:text-[#f5f7fa]">
          Correo electrónico
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@empresa.com"
          className={inputLoginClassName}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password" className="text-cun-blue dark:text-[#f5f7fa]">
            Contraseña
          </Label>
          <Link
            href="/recuperar-clave"
            className="text-sm text-cun-blue underline-offset-4 transition-colors hover:text-[#5f9200] hover:underline decoration-cun-green dark:text-[#aab6c5] dark:hover:text-cun-green"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputLoginClassName}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className={botonLoginClassName} disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        Entrar
      </Button>
    </form>
  );
}
