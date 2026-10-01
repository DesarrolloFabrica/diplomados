"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { iniciarSesion } from "@backend/server/actions/auth";
import { loginSchema, type LoginInput } from "@backend/lib/validators/auth";

const inputLoginClassName =
  "h-14 rounded-xl border border-white/15 bg-[#102236] px-4 text-[15px] text-white placeholder:text-[#718196] " +
  "focus-visible:border-cun-green focus-visible:outline-none focus-visible:ring-[3px] " +
  "focus-visible:ring-[rgba(145,220,0,0.18)] focus-visible:ring-offset-0";

const botonLoginClassName =
  "h-14 w-full rounded-xl bg-cun-green font-bold uppercase tracking-[0.08em] text-cun-blue " +
  "shadow-[0_12px_30px_rgba(145,220,0,0.16)] " +
  "transition-[background-color,transform,box-shadow] duration-200 ease-in-out " +
  "hover:-translate-y-px hover:bg-[#a0eb18] hover:text-cun-blue hover:shadow-[0_15px_34px_rgba(145,220,0,0.22)] " +
  "active:translate-y-0 focus-visible:ring-cun-green focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-[#061120] disabled:translate-y-0 disabled:opacity-60";

export function FormularioLogin() {
  const [enviando, iniciar] = useTransition();
  const [mostrarPassword, setMostrarPassword] = useState(false);
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-[#edf3f8]">
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
        {errors.email && <p className="text-sm text-[#fca5a5]">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password" className="text-sm font-semibold text-[#edf3f8]">
            Contraseña
          </Label>
          <Link
            href="/recuperar-clave"
            className="text-sm text-[#aab6c5] decoration-cun-green underline-offset-4 transition-colors hover:text-cun-green hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={mostrarPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className={`${inputLoginClassName} pr-12`}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setMostrarPassword((visible) => !visible)}
            aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={mostrarPassword}
            className="absolute right-1.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-[#8fa0b4] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cun-green"
          >
            {mostrarPassword ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-[#fca5a5]">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className={botonLoginClassName} disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        Entrar
      </Button>
    </form>
  );
}
