import { requerirRol } from "@backend/lib/auth/sesion";
import { listarCursos } from "@backend/server/queries/cursos";
import { listarEmpresasParaSelector } from "@backend/server/queries/empresas";
import { TablaCursos } from "@/app/(instructor)/instructor/cursos/tabla-cursos";

export default async function AdminCursosPage() {
  const sesion = await requerirRol("superadmin");

  const [cursos, empresas] = await Promise.all([
    listarCursos(sesion.id, false),
    listarEmpresasParaSelector(sesion.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Cursos</h1>
        <p className="mt-1 text-muted-foreground">
          Catálogo completo de cursos y diplomados de la plataforma.
        </p>
      </div>
      <TablaCursos cursos={cursos} empresas={empresas} />
    </div>
  );
}
