import { requerirRol } from "@backend/lib/auth/sesion";
import { listarCursos, listarInstructores } from "@backend/server/queries/cursos";
import { listarEmpresasParaSelector } from "@backend/server/queries/empresas";
import { TablaCursos } from "@/app/(instructor)/instructor/cursos/tabla-cursos";

export default async function AdminCursosPage() {
  const sesion = await requerirRol("superadmin");

  const [cursos, empresas, instructores] = await Promise.all([
    listarCursos(sesion.id, false),
    listarEmpresasParaSelector(sesion.id),
    listarInstructores(sesion.id),
  ]);

  return (
    <div className="admin-page space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Cursos</h1>
        <p className="mt-1 text-muted-foreground">
          Catálogo completo de cursos y diplomados de la plataforma. Usa
          &quot;Asignar instructor&quot; para definir quién edita el contenido de cada curso.
        </p>
      </div>
      <TablaCursos
        cursos={cursos}
        empresas={empresas}
        temaAdminOscuro
        instructores={instructores}
      />
    </div>
  );
}
