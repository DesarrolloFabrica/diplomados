import { NextResponse, type NextRequest } from "next/server";
import { verificarSesion, firmarSesion, type ClaimsSesion } from "@/lib/auth/jwt";
import { COOKIE_SESION, OPCIONES_COOKIE_SESION } from "@/lib/auth/cookies";

// Verifica el JWT de la cookie y renueva su expiración (sesión deslizante)
// si sigue siendo válida. No consulta la base de datos: rol/empresa_id
// viajan en el propio JWT (así el middleware no hace una query por
// request). La verificación "dura" contra el profile (rol actualizado,
// cuenta activa) ocurre en obtenerSesion(), dentro de Server
// Components/Actions.
export async function actualizarSesion(
  request: NextRequest,
): Promise<{ response: NextResponse; claims: ClaimsSesion | null }> {
  const response = NextResponse.next({ request });
  const token = request.cookies.get(COOKIE_SESION)?.value;

  if (!token) return { response, claims: null };

  const claims = await verificarSesion(token);
  if (!claims) {
    response.cookies.delete(COOKIE_SESION);
    return { response, claims: null };
  }

  const nuevoToken = await firmarSesion(claims);
  response.cookies.set(COOKIE_SESION, nuevoToken, OPCIONES_COOKIE_SESION);

  return { response, claims };
}
