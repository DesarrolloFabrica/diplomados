import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requerirSesion } from "@/lib/auth/sesion";
import { obtenerEvaluacion } from "@/server/queries/evaluaciones";
import { obtenerInscripcion } from "@/server/queries/mis-cursos";
import { listarIntentos } from "@/server/queries/evaluacion-colaborador";
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
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={`/mis-cursos/${cursoId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al curso
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          {evaluacion.titulo}
        </h1>
        {evaluacion.descripcion && (
          <p className="mt-1 text-muted-foreground">{evaluacion.descripcion}</p>
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
  );
}
