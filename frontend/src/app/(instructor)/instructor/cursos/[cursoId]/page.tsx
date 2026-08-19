import { notFound } from "next/navigation";
import { requerirRol } from "@backend/lib/auth/sesion";
import { obtenerCurso } from "@backend/server/queries/cursos";
import { listarModulos } from "@backend/server/queries/cursos";
import { listarEvaluaciones } from "@backend/server/queries/evaluaciones";
import { listarEmpresasParaSelector } from "@backend/server/queries/empresas";
import { EncabezadoCurso } from "./encabezado-curso";
import { TablaModulos } from "./tabla-modulos";
import { TablaEvaluaciones } from "./tabla-evaluaciones";

interface CursoDetallePageProps {
  params: Promise<{ cursoId: string }>;
}

export default async function CursoDetallePage({ params }: CursoDetallePageProps) {
  const { cursoId } = await params;
  const sesion = await requerirRol("superadmin", "instructor");

  const curso = await obtenerCurso(sesion.id, cursoId);
  if (!curso) notFound();

  const [modulos, evaluaciones, empresas] = await Promise.all([
    listarModulos(sesion.id, cursoId),
    listarEvaluaciones(sesion.id, cursoId),
    listarEmpresasParaSelector(sesion.id),
  ]);

  return (
    <div className="space-y-8">
      <EncabezadoCurso curso={curso} empresas={empresas} />

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Módulos</h2>
          <p className="text-sm text-muted-foreground">
            Organiza el contenido del curso en módulos; cada módulo tiene sus lecciones.
          </p>
        </div>
        <TablaModulos cursoId={cursoId} modulos={modulos} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Evaluaciones</h2>
          <p className="text-sm text-muted-foreground">
            Quizzes del curso. Puedes importar preguntas en formato GIFT de Moodle.
          </p>
        </div>
        <TablaEvaluaciones cursoId={cursoId} evaluaciones={evaluaciones} />
      </section>
    </div>
  );
}
