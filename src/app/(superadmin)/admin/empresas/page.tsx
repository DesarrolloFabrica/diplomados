import { requerirRol } from "@/lib/auth/sesion";
import { listarEmpresas } from "@/server/queries/empresas";
import { TablaEmpresas } from "./tabla-empresas";

export default async function EmpresasPage() {
  const sesion = await requerirRol("superadmin");
  const empresas = await listarEmpresas(sesion.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Empresas</h1>
        <p className="mt-1 text-muted-foreground">
          Empresas registradas en la plataforma.
        </p>
      </div>
      <TablaEmpresas empresas={empresas} />
    </div>
  );
}
