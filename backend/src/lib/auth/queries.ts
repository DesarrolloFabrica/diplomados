import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Rol } from "@/types";

export interface PerfilLogin {
  id: string;
  passwordHash: string;
  rol: Rol;
  empresaId: string | null;
  nombreCompleto: string;
  activo: boolean;
  deletedAt: Date | null;
}

interface FilaPerfilLogin extends Record<string, unknown> {
  id: string;
  password_hash: string;
  rol: Rol;
  empresa_id: string | null;
  nombre_completo: string;
  activo: boolean;
  deleted_at: Date | null;
}

// Usa public.perfil_por_email() (SECURITY DEFINER) porque en este punto
// todavía no hay sesión: RLS bloquearía un select directo sobre profiles.
export async function buscarPerfilPorEmail(email: string): Promise<PerfilLogin | null> {
  const resultado = await db.execute<FilaPerfilLogin>(
    sql`select * from public.perfil_por_email(${email})`,
  );

  const fila = resultado.rows[0];
  if (!fila) return null;

  return {
    id: fila.id,
    passwordHash: fila.password_hash,
    rol: fila.rol,
    empresaId: fila.empresa_id,
    nombreCompleto: fila.nombre_completo,
    activo: fila.activo,
    deletedAt: fila.deleted_at,
  };
}
