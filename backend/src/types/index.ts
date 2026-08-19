// Tipos del dominio compartidos por toda la app.
// El esquema de la base de datos vive en src/lib/db/schema.ts (Drizzle).

export type Rol = "superadmin" | "admin_empresa" | "instructor" | "colaborador";

export const ROLES: readonly Rol[] = [
  "superadmin",
  "admin_empresa",
  "instructor",
  "colaborador",
] as const;

export interface SesionUsuario {
  id: string;
  email: string | null;
  rol: Rol;
  empresaId: string | null;
  nombreCompleto: string | null;
}

// Forma de retorno estándar de los Server Actions que usan useActionState.
export interface ResultadoAccion {
  ok: boolean;
  mensaje?: string;
}
