import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { verificarSesion } from "@/lib/auth/jwt";
import { COOKIE_SESION } from "@/lib/auth/cookies";
import { RUTA_INICIO_POR_ROL } from "@/config/roles";
import type { Rol, SesionUsuario } from "@/types";

// Devuelve la sesión del usuario actual o null si no hay sesión válida.
// El JWT solo confirma identidad; rol/empresa/estado se releen del profile
// (fuente de verdad) para que un cambio de rol o una cuenta desactivada
// tengan efecto de inmediato aunque el JWT (1 día) siga vigente. De paso,
// conSesion() fija app.current_user_id para que RLS aplique en esta query.
export async function obtenerSesion(): Promise<SesionUsuario | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_SESION)?.value;
  if (!token) return null;

  const claims = await verificarSesion(token);
  if (!claims) return null;

  const perfil = await conSesion(claims.sub, async (tx) => {
    const [fila] = await tx
      .select({
        id: profiles.id,
        email: profiles.email,
        rol: profiles.rol,
        empresaId: profiles.empresaId,
        nombreCompleto: profiles.nombreCompleto,
        activo: profiles.activo,
        deletedAt: profiles.deletedAt,
      })
      .from(profiles)
      .where(eq(profiles.id, claims.sub))
      .limit(1);
    return fila ?? null;
  });

  if (!perfil || !perfil.activo || perfil.deletedAt) return null;

  return {
    id: perfil.id,
    email: perfil.email,
    rol: perfil.rol,
    empresaId: perfil.empresaId,
    nombreCompleto: perfil.nombreCompleto,
  };
}

// Exige sesión; si no hay, redirige al login.
export async function requerirSesion(): Promise<SesionUsuario> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  return sesion;
}

// Exige uno de los roles indicados; si no cumple, redirige a SU panel (no
// a /login: ya tiene sesión válida, solo no debe estar en esta ruta). El
// middleware ya filtra esto antes de llegar aquí; este chequeo es la
// segunda barrera si alguna ruta queda fuera de ACCESO_POR_PREFIJO.
export async function requerirRol(...roles: Rol[]): Promise<SesionUsuario> {
  const sesion = await requerirSesion();
  if (!roles.includes(sesion.rol)) redirect(RUTA_INICIO_POR_ROL[sesion.rol]);
  return sesion;
}
