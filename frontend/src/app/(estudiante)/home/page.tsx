import { requerirRol } from "@backend/lib/auth/sesion";
import { listarCursosParaColaborador } from "@backend/server/queries/mis-cursos";
import { CatalogoCursos } from "../mis-cursos/catalogo-cursos";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string }>;
}) {
  const { seccion } = await searchParams;
  const sesion = await requerirRol("colaborador", "admin_empresa", "instructor", "superadmin");
  const cursos = await listarCursosParaColaborador(sesion.id);

  const misCursos = cursos.filter((curso) => curso.inscripcionId);
  const disponibles = cursos.filter((curso) => !curso.inscripcionId);

  return (
    <CatalogoCursos
      pagina="home"
      seccionHome={
        seccion === "diplomados" || seccion === "nuevos" ? seccion : "descubrir"
      }
      misCursos={misCursos}
      disponibles={disponibles}
      nombre={sesion.nombreCompleto}
    />
  );
}
