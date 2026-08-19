import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requerirRol } from "@backend/lib/auth/sesion";
import { obtenerEvaluacion, listarPreguntas } from "@backend/server/queries/evaluaciones";
import { ImportarGift } from "./importar-gift";
import { TablaPreguntas } from "./tabla-preguntas";

interface EvaluacionDetallePageProps {
  params: Promise<{ cursoId: string; evaluacionId: string }>;
}

export default async function EvaluacionDetallePage({ params }: EvaluacionDetallePageProps) {
  const { cursoId, evaluacionId } = await params;
  const sesion = await requerirRol("superadmin", "instructor");

  const evaluacion = await obtenerEvaluacion(sesion.id, evaluacionId);
  if (!evaluacion) notFound();

  const preguntas = await listarPreguntas(sesion.id, evaluacionId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/instructor/cursos/${cursoId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al curso
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          {evaluacion.titulo}
        </h1>
        {evaluacion.descripcion && (
          <p className="mt-1 max-w-2xl text-muted-foreground">{evaluacion.descripcion}</p>
        )}
      </div>

      <ImportarGift cursoId={cursoId} evaluacionId={evaluacionId} />

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">
          Preguntas ({preguntas.length})
        </h2>
        <TablaPreguntas cursoId={cursoId} evaluacionId={evaluacionId} preguntas={preguntas} />
      </div>
    </div>
  );
}
