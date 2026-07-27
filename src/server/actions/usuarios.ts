"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { profiles, passwordResetTokens } from "@/lib/db/schema";
import { requerirRol } from "@/lib/auth/sesion";
import { usuarioSchema } from "@/lib/validators/usuarios";
import { hashPassword } from "@/lib/auth/password";
import { generarTokenRecuperacion } from "@/lib/auth/tokens";
import { enviarCorreoInvitacion } from "@/lib/email";
import type { ResultadoAccion, Rol } from "@/types";

const VIGENCIA_INVITACION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export interface ResultadoCrearUsuario extends ResultadoAccion {
  enlaceInvitacion?: string;
}

function esCorreoDuplicado(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

function generarPasswordTemporal(): string {
  // Solo se usa para calcular el hash inicial; nadie inicia sesión con
  // ella: el usuario siempre entra por el enlace de invitación.
  return randomBytes(24).toString("base64url");
}

async function enviarInvitacion(profileId: string, email: string): Promise<string | undefined> {
  const { token, hash } = generarTokenRecuperacion();

  await conSesion(null, (tx) =>
    tx.insert(passwordResetTokens).values({
      profileId,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + VIGENCIA_INVITACION_MS),
    }),
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const enlace = `${siteUrl}/restablecer-clave?token=${token}`;

  try {
    await enviarCorreoInvitacion(email, enlace);
    return undefined;
  } catch {
    // Sin SendGrid configurado (o si el envío falla), el usuario ya quedó
    // creado: devolvemos el enlace para que quien lo creó lo comparta a mano.
    return enlace;
  }
}

// rolesPermitidos/empresaFija acotan lo que puede hacer quien llama
// (admin_empresa vs superadmin); se revalidan aquí, no solo en el formulario.
export async function crearUsuario(
  rolesPermitidos: Rol[],
  empresaFija: string | null,
  _prev: ResultadoCrearUsuario | null,
  formData: FormData,
): Promise<ResultadoCrearUsuario> {
  const sesion = await requerirRol("superadmin", "admin_empresa");

  const parsed = usuarioSchema.safeParse({
    email: formData.get("email"),
    nombreCompleto: formData.get("nombreCompleto"),
    rol: formData.get("rol"),
    empresaId: empresaFija ?? formData.get("empresaId"),
    cargo: formData.get("cargo"),
    area: formData.get("area"),
  });
  if (!parsed.success) {
    return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  if (!rolesPermitidos.includes(parsed.data.rol)) {
    return { ok: false, mensaje: "No tienes permiso para asignar ese rol." };
  }

  const empresaId =
    parsed.data.rol === "superadmin" ? null : (empresaFija ?? parsed.data.empresaId ?? null);

  if (empresaFija && empresaId !== empresaFija) {
    return { ok: false, mensaje: "No tienes permiso para asignar esa empresa." };
  }

  const passwordHash = await hashPassword(generarPasswordTemporal());

  let nuevoId: string;
  try {
    const [fila] = await conSesion(sesion.id, (tx) =>
      tx
        .insert(profiles)
        .values({
          email: parsed.data.email,
          passwordHash,
          rol: parsed.data.rol,
          empresaId,
          nombreCompleto: parsed.data.nombreCompleto,
          cargo: parsed.data.cargo ?? null,
          area: parsed.data.area ?? null,
        })
        .returning({ id: profiles.id }),
    );
    if (!fila) throw new Error("El insert no devolvió el usuario creado.");
    nuevoId = fila.id;
  } catch (error) {
    if (esCorreoDuplicado(error)) {
      return { ok: false, mensaje: "Ese correo ya está registrado." };
    }
    throw error;
  }

  const enlaceInvitacion = await enviarInvitacion(nuevoId, parsed.data.email);

  revalidatePath("/admin/usuarios");
  revalidatePath("/empresa/colaboradores");
  return { ok: true, enlaceInvitacion };
}

export async function actualizarUsuario(
  id: string,
  _prev: ResultadoAccion | null,
  formData: FormData,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin", "admin_empresa");

  const nombreCompleto = formData.get("nombreCompleto");
  if (typeof nombreCompleto !== "string" || !nombreCompleto.trim()) {
    return { ok: false, mensaje: "Escribe el nombre completo" };
  }
  const cargo = formData.get("cargo");
  const area = formData.get("area");

  await conSesion(sesion.id, (tx) =>
    tx
      .update(profiles)
      .set({
        nombreCompleto: nombreCompleto.trim(),
        cargo: typeof cargo === "string" && cargo ? cargo : null,
        area: typeof area === "string" && area ? area : null,
      })
      .where(eq(profiles.id, id)),
  );

  revalidatePath("/admin/usuarios");
  revalidatePath("/empresa/colaboradores");
  return { ok: true };
}

export async function cambiarEstadoUsuario(
  id: string,
  activo: boolean,
): Promise<ResultadoAccion> {
  const sesion = await requerirRol("superadmin", "admin_empresa");

  await conSesion(sesion.id, (tx) =>
    tx.update(profiles).set({ activo }).where(eq(profiles.id, id)),
  );

  revalidatePath("/admin/usuarios");
  revalidatePath("/empresa/colaboradores");
  return { ok: true };
}
