import { Proximamente } from "@/components/shared/proximamente";
import { requerirSesion } from "@/lib/auth/sesion";

export default async function AsignacionesPage() {
  const sesion = await requerirSesion();

  if (sesion.rol !== "admin_empresa" || !sesion.empresaId) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Asignaciones</h1>
        <p className="text-muted-foreground">
          Esta vista es por empresa. Como superadmin, gestiona cursos e inscripciones desde{" "}
          <a href="/admin/cursos" className="text-primary underline">
            Cursos
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <Proximamente
      titulo="Asignaciones de cursos"
      descripcion="Asigna cursos y diplomados a los colaboradores de tu empresa."
      etapa="Etapa 3"
    />
  );
}
