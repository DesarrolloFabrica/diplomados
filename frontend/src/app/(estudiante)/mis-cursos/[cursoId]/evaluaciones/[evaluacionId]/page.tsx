import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requerirSesion } from "@backend/lib/auth/sesion";
import { obtenerEvaluacion } from "@backend/server/queries/evaluaciones";
import { obtenerInscripcion } from "@backend/server/queries/mis-cursos";
import { listarIntentos } from "@backend/server/queries/evaluacion-colaborador";
import { PresentarEvaluacion } from "./presentar-evaluacion";

interface EvaluacionColaboradorPageProps {
  params: Promise<{ cursoId: string; evaluacionId: string }>;
}

export default async function EvaluacionColaboradorPage({
  params,
}: EvaluacionColaboradorPageProps) {
  const { cursoId, evaluacionId } = await params;
  const sesion = await requerirSesion();

  const evaluacion = await obtenerEvaluacion(sesion.id, evaluacionId);
  if (!evaluacion) notFound();

  const inscripcion = await obtenerInscripcion(sesion.id, cursoId);
  if (!inscripcion) notFound();

  const intentos = await listarIntentos(sesion.id, evaluacionId);

  const intentoEnCurso = intentos.find((i) => i.estado === "en_curso");
  const finalizados = intentos.filter((i) => i.estado === "finalizado");

  return (
    <div className="quiz-view relative isolate -mx-5 -mt-5 -mb-14 min-h-[calc(100dvh+3.5rem)] pb-32 sm:-mx-6 sm:-mt-6 sm:-mb-14 lg:-mx-8 lg:-mt-8 lg:-mb-14 xl:-mx-10 xl:-mt-10 xl:-mb-14">
      <div className="mx-auto max-w-2xl space-y-6 px-5 py-6 sm:px-6 lg:px-8">
        <div>
          <Link
            href={`/mis-cursos/${cursoId}?roadmapFocus=${encodeURIComponent(evaluacionId)}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al curso
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white drop-shadow-sm">
            {evaluacion.titulo}
          </h1>
          {evaluacion.descripcion && (
            <p className="mt-1 text-white/78">{evaluacion.descripcion}</p>
          )}
        </div>

        <PresentarEvaluacion
          cursoId={cursoId}
          evaluacionId={evaluacionId}
          inscripcionId={inscripcion.id}
          intentoInicial={intentoEnCurso?.id ?? null}
          intentosUsados={finalizados.length}
          maxIntentos={evaluacion.maxIntentos}
          puntajeMinimo={Number(evaluacion.puntajeMinimo)}
        />
      </div>
    </div>
  );
}
