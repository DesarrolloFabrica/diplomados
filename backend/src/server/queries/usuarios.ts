import { and, desc, eq, isNull } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { profiles, empresas } from "@/lib/db/schema";
import type { Rol } from "@/types";

export interface UsuarioFila {
  id: string;
  email: string;
  nombreCompleto: string;
  rol: Rol;
  empresaId: string | null;
  empresaNombre: string | null;
  cargo: string | null;
  area: string | null;
  activo: boolean;
  ultimoAcceso: Date | null;
  createdAt: Date;
}

// empresaId: cuando se pasa, limita el listado a esa empresa (panel de
// admin_empresa); el panel de superadmin lo omite para ver todos.
export async function listarUsuarios(
  usuarioId: string,
  empresaId?: string,
): Promise<UsuarioFila[]> {
  return conSesion(usuarioId, (tx) => {
    const condiciones = [isNull(profiles.deletedAt)];
    if (empresaId) condiciones.push(eq(profiles.empresaId, empresaId));

    return tx
      .select({
        id: profiles.id,
        email: profiles.email,
        nombreCompleto: profiles.nombreCompleto,
        rol: profiles.rol,
        empresaId: profiles.empresaId,
        empresaNombre: empresas.nombre,
        cargo: profiles.cargo,
        area: profiles.area,
        activo: profiles.activo,
        ultimoAcceso: profiles.ultimoAcceso,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .leftJoin(empresas, eq(profiles.empresaId, empresas.id))
      .where(and(...condiciones))
      .orderBy(desc(profiles.createdAt));
  });
}
