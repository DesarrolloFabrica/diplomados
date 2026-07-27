import type { Rol } from "@/types";

// Ruta de inicio (panel) de cada rol tras iniciar sesión.
export const RUTA_INICIO_POR_ROL: Record<Rol, string> = {
  superadmin: "/admin",
  admin_empresa: "/empresa",
  instructor: "/instructor",
  colaborador: "/mis-cursos",
};

// Etiqueta legible de cada rol.
export const ETIQUETA_ROL: Record<Rol, string> = {
  superadmin: "Superadministrador",
  admin_empresa: "Administrador de empresa",
  instructor: "Instructor",
  colaborador: "Colaborador",
};

// Prefijos de ruta protegidos y roles con acceso. El middleware lo usa
// para bloquear el acceso cruzado entre paneles.
export const ACCESO_POR_PREFIJO: { prefijo: string; roles: Rol[] }[] = [
  { prefijo: "/admin", roles: ["superadmin"] },
  { prefijo: "/empresa", roles: ["superadmin", "admin_empresa"] },
  { prefijo: "/instructor", roles: ["superadmin", "instructor"] },
  { prefijo: "/mis-cursos", roles: ["colaborador", "admin_empresa", "instructor", "superadmin"] },
];

export function rolPuedeAcceder(rol: Rol, pathname: string): boolean {
  const regla = ACCESO_POR_PREFIJO.find((r) => pathname.startsWith(r.prefijo));
  if (!regla) return true; // rutas no listadas no están restringidas por rol
  return regla.roles.includes(rol);
}
