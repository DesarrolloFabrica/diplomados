import { requerirRol } from "@/lib/auth/sesion";
import { listarUsuarios } from "@/server/queries/usuarios";
import { listarEmpresasParaSelector } from "@/server/queries/empresas";
import { TablaUsuarios } from "@/components/shared/usuarios/tabla-usuarios";
import { ROLES } from "@/types";

export default async function UsuariosPage() {
  const sesion = await requerirRol("superadmin");
  const [usuarios, empresas] = await Promise.all([
    listarUsuarios(sesion.id),
    listarEmpresasParaSelector(sesion.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="mt-1 text-muted-foreground">
          Todos los usuarios registrados en la plataforma.
        </p>
      </div>
      <TablaUsuarios
        usuarios={usuarios}
        rolesPermitidos={[...ROLES]}
        empresas={empresas}
        mostrarColumnaEmpresa
      />
    </div>
  );
}
