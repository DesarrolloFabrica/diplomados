import { NextResponse, type NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/auth/middleware";
import { rolPuedeAcceder, RUTA_INICIO_POR_ROL } from "@/config/roles";

const RUTAS_PUBLICAS = ["/login", "/recuperar-clave", "/restablecer-clave"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, claims } = await actualizarSesion(request);

  const esPublica = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r));

  // Sin sesión y ruta privada → al login.
  if (!claims && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (claims) {
    // Con sesión en una ruta pública → a su panel.
    if (esPublica) {
      const url = request.nextUrl.clone();
      url.pathname = RUTA_INICIO_POR_ROL[claims.rol];
      return NextResponse.redirect(url);
    }

    // Acceso cruzado entre paneles → a su panel.
    if (!rolPuedeAcceder(claims.rol, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = RUTA_INICIO_POR_ROL[claims.rol];
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Todas las rutas salvo estáticos e imágenes.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
