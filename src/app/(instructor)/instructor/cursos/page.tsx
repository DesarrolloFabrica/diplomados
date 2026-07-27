import { requerirRol } from "@/lib/auth/sesion";
import { listarCursos } from "@/server/queries/cursos";
import { listarEmpresasParaSelector } from "@/server/queries/empresas";
import { TablaCursos } from "./tabla-cursos";

export default async function InstructorCursosPage() {
  const sesion = await requerirRol("superadmin", "instructor");
  const soloPropios = sesion.rol === "instructor";

  const [cursos, empresas] = await Promise.all([
    listarCursos(sesion.id, soloPropios),
    listarEmpresasParaSelector(sesion.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Mis cursos</h1>
        <p className="mt-1 text-muted-foreground">
          Crea y edita cursos, módulos, lecciones y evaluaciones.
        </p>
      </div>
      <TablaCursos cursos={cursos} empresas={empresas} />
    </div>
  );
}
