import { desc, isNull } from "drizzle-orm";
import { conSesion } from "@/lib/db";
import { empresas } from "@/lib/db/schema";

export interface EmpresaFila {
  id: string;
  nombre: string;
  nit: string | null;
  estado: "activa" | "inactiva";
  createdAt: Date;
}

export async function listarEmpresas(usuarioId: string): Promise<EmpresaFila[]> {
  return conSesion(usuarioId, (tx) =>
    tx
      .select({
        id: empresas.id,
        nombre: empresas.nombre,
        nit: empresas.nit,
        estado: empresas.estado,
        createdAt: empresas.createdAt,
      })
      .from(empresas)
      .where(isNull(empresas.deletedAt))
      .orderBy(desc(empresas.createdAt)),
  );
}

export interface EmpresaOpcion {
  id: string;
  nombre: string;
}

export async function listarEmpresasParaSelector(usuarioId: string): Promise<EmpresaOpcion[]> {
  return conSesion(usuarioId, (tx) =>
    tx
      .select({ id: empresas.id, nombre: empresas.nombre })
      .from(empresas)
      .where(isNull(empresas.deletedAt))
      .orderBy(empresas.nombre),
  );
}
