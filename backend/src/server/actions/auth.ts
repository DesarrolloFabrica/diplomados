"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { profiles, passwordResetTokens } from "@/lib/db/schema";
import { buscarPerfilPorEmail } from "@/lib/auth/queries";
import { hashPassword, verificarPassword } from "@/lib/auth/password";
import { firmarSesion } from "@/lib/auth/jwt";
import { COOKIE_SESION, OPCIONES_COOKIE_SESION, OPCIONES_COOKIE_BORRADO } from "@/lib/auth/cookies";
import { generarTokenRecuperacion, hashearToken } from "@/lib/auth/tokens";
import { enviarCorreoRecuperacion } from "@/lib/email";
import {
  loginSchema,
  recuperarSchema,
  restablecerSchema,
} from "@/lib/validators/auth";
import { RUTA_INICIO_POR_ROL } from "@/config/roles";
import type { ResultadoAccion } from "@/types";

export async function iniciarSesion(
  _prev: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const perfil = await buscarPerfilPorEmail(parsed.data.email);
  if (!perfil) {
    return { ok: false, mensaje: "Correo o contraseña incorrectos" };
  }

  const claveValida = await verificarPassword(parsed.data.password, perfil.passwordHash);
  if (!claveValida) {
    return { ok: false, mensaje: "Correo o contraseña incorrectos" };
  }

  if (!perfil.activo || perfil.deletedAt) {
    return { ok: false, mensaje: "Tu cuenta está inactiva. Contacta al administrador." };
  }

  const token = await firmarSesion({
    sub: perfil.id,
    rol: perfil.rol,
    empresaId: perfil.empresaId,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESION, token, OPCIONES_COOKIE_SESION);

  await conSesion(perfil.id, (tx) =>
    tx.update(profiles).set({ ultimoAcceso: new Date() }).where(eq(profiles.id, perfil.id)),
  );

  revalidatePath("/", "layout");
  redirect(RUTA_INICIO_POR_ROL[perfil.rol]);
}

export async function cerrarSesion(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESION, "", OPCIONES_COOKIE_BORRADO);
  revalidatePath("/", "layout");
  redirect("/login");
}

const VIGENCIA_TOKEN_MS = 60 * 60 * 1000; // 1 hora

export async function recuperarClave(
  _prev: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const parsed = recuperarSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const perfil = await buscarPerfilPorEmail(parsed.data.email);

  // Respuesta neutra: no revelamos si el correo existe, pero solo
  // enviamos el correo (y creamos el token) si sí existe y está activo.
  if (perfil && perfil.activo && !perfil.deletedAt) {
    const { token, hash } = generarTokenRecuperacion();

    await conSesion(null, (tx) =>
      tx.insert(passwordResetTokens).values({
        profileId: perfil.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + VIGENCIA_TOKEN_MS),
      }),
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    await enviarCorreoRecuperacion(
      parsed.data.email,
      `${siteUrl}/restablecer-clave?token=${token}`,
    );
  }

  return {
    ok: true,
    mensaje: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
  };
}

export async function restablecerClave(
  _prev: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const parsed = restablecerSchema.safeParse({
    password: formData.get("password"),
    confirmar: formData.get("confirmar"),
  });

  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const token = formData.get("token");
  if (typeof token !== "string" || !token) {
    return { ok: false, mensaje: "Enlace inválido. Solicita uno nuevo." };
  }

  const tokenHash = hashearToken(token);
  const nuevoHash = await hashPassword(parsed.data.password);

  // Todavía no hay sesión (la persona apenas va a crear su contraseña), así
  // que RLS bloquearía un update directo sobre profiles: public.
  // restablecer_password() es SECURITY DEFINER para este caso puntual
  // (ver db/migrations/007_restablecer_password_fn.sql).
  const resultado = await conSesion(null, (tx) =>
    tx.execute(sql`select public.restablecer_password(${tokenHash}, ${nuevoHash}) as ok`),
  );
  const actualizado = Boolean((resultado.rows[0] as { ok?: boolean } | undefined)?.ok);

  if (!actualizado) {
    return {
      ok: false,
      mensaje: "El enlace venció o ya se usó. Solicita uno nuevo.",
    };
  }

  redirect("/login");
}
