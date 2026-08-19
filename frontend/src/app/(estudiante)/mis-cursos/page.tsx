import { requerirRol } from "@backend/lib/auth/sesion";
import { listarCursosParaColaborador } from "@backend/server/queries/mis-cursos";
import { CatalogoCursos } from "./catalogo-cursos";

export default async function MisCursosPage() {
  const sesion = await requerirRol("colaborador", "admin_empresa", "instructor", "superadmin");
  const cursos = await listarCursosParaColaborador(sesion.id);

  const misCursos = cursos.filter((c) => c.inscripcionId);
  const disponibles = cursos.filter((c) => !c.inscripcionId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Mis cursos</h1>
        <p className="mt-1 text-muted-foreground">Tus cursos y tu avance de aprendizaje.</p>
      </div>

      <CatalogoCursos misCursos={misCursos} disponibles={disponibles} />
    </div>
  );
}
