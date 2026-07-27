import { requerirSesion } from "@/lib/auth/sesion";
import { listarUsuarios } from "@/server/queries/usuarios";
import { TablaUsuarios } from "@/components/shared/usuarios/tabla-usuarios";

export default async function ColaboradoresPage() {
  const sesion = await requerirSesion();

  // El layout de /empresa permite tanto a admin_empresa como a superadmin
  // (para que este último pueda supervisar cualquier empresa). Esta vista
  // en concreto es "mi empresa", así que solo tiene sentido para
  // admin_empresa; al superadmin lo mandamos a la vista global.
  if (sesion.rol !== "admin_empresa" || !sesion.empresaId) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Colaboradores</h1>
        <p className="text-muted-foreground">
          Esta vista es por empresa. Como superadmin, gestiona usuarios desde{" "}
          <a href="/admin/usuarios" className="text-primary underline">
            Usuarios
          </a>
          .
        </p>
      </div>
    );
  }

  const usuarios = await listarUsuarios(sesion.id, sesion.empresaId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Colaboradores</h1>
        <p className="mt-1 text-muted-foreground">
          Instructores y colaboradores de tu empresa.
        </p>
      </div>
      <TablaUsuarios
        usuarios={usuarios}
        rolesPermitidos={["instructor", "colaborador"]}
        empresaFija={sesion.empresaId}
      />
    </div>
  );
}
