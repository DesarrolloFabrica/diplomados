import { SignJWT, jwtVerify } from "jose";
import type { Rol } from "@/types";

const ALG = "HS256";
const DURACION_SESION = "1d";

function obtenerSecreto() {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) throw new Error("Falta JWT_SECRET en el entorno.");
  return new TextEncoder().encode(secreto);
}

export interface ClaimsSesion {
  sub: string; // profile.id
  rol: Rol;
  empresaId: string | null;
}

// El rol/empresa se leen del profile al iniciar sesión y viajan en el JWT
// (igual que hacía el Access Token Hook de Supabase) para que el middleware
// enrute sin consultar la base en cada request. `obtenerSesion()`
// (lib/auth/sesion.ts) sigue siendo la fuente de verdad para autorización:
// vuelve a leer el profile en Server Components/Actions, así que un cambio
// de rol o una cuenta desactivada se refleja de inmediato ahí aunque el
// JWT (de corta duración, 1 día) todavía no haya expirado.
export async function firmarSesion(claims: ClaimsSesion): Promise<string> {
  return new SignJWT({ rol: claims.rol, empresa_id: claims.empresaId })
    .setProtectedHeader({ alg: ALG })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(DURACION_SESION)
    .sign(obtenerSecreto());
}

export async function verificarSesion(token: string): Promise<ClaimsSesion | null> {
  try {
    const { payload } = await jwtVerify(token, obtenerSecreto());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      rol: payload.rol as Rol,
      empresaId: (payload.empresa_id as string | null) ?? null,
    };
  } catch {
    return null;
  }
}
