import { requerirRol } from "@backend/lib/auth/sesion";
import { listarCursosParaColaborador } from "@backend/server/queries/mis-cursos";
import { CatalogoCursos } from "./catalogo-cursos";

export default async function MisCursosPage() {
  const sesion = await requerirRol("colaborador", "admin_empresa", "instructor", "superadmin");
  const cursos = await listarCursosParaColaborador(sesion.id);

  const misCursos = cursos.filter((c) => c.inscripcionId);
  const disponibles = cursos.filter((c) => !c.inscripcionId);

  return <CatalogoCursos misCursos={misCursos} disponibles={disponibles} nombreUsuario={sesion.nombreCompleto} />;
}
