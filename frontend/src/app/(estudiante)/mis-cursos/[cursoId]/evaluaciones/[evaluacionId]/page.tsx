import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requerirSesion } from "@backend/lib/auth/sesion";
import { obtenerEvaluacion } from "@backend/server/queries/evaluaciones";
import { obtenerInscripcion } from "@backend/server/queries/mis-cursos";
import { listarIntentos } from "@backend/server/queries/evaluacion-colaborador";
import { obtenerPreferenciaInterfazUsuario } from "@backend/server/queries/preferencia-interfaz";
import { estiloFondoInterfaz } from "@/lib/interface-assets";
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

  const [intentos, preferenciaInterfaz] = await Promise.all([
    listarIntentos(sesion.id, evaluacionId),
    obtenerPreferenciaInterfazUsuario(sesion.id),
  ]);

  const intentoEnCurso = intentos.find((i) => i.estado === "en_curso");
  const finalizados = intentos.filter((i) => i.estado === "finalizado");

  return (
    <div
      className={
        preferenciaInterfaz?.interfaceVariant === "creative"
          ? "quiz-view relative isolate -mx-5 -mt-5 -mb-14 min-h-[calc(100dvh+3.5rem)] pb-32 sm:-mx-6 sm:-mt-6 sm:-mb-14 lg:-mx-8 lg:-mt-8 lg:-mb-14 xl:-mx-10 xl:-mt-10 xl:-mb-14"
          : "quiz-view interface-quiz-bg relative isolate -mx-5 -mt-5 -mb-14 min-h-[calc(100dvh+3.5rem)] pb-32 sm:-mx-6 sm:-mt-6 sm:-mb-14 lg:-mx-8 lg:-mt-8 lg:-mb-14 xl:-mx-10 xl:-mt-10 xl:-mb-14"
      }
      style={
        preferenciaInterfaz?.interfaceVariant === "creative"
          ? undefined
          : estiloFondoInterfaz(preferenciaInterfaz?.interfaceVariant, "quizBackground")
      }
    >
      <div className="mx-auto w-full max-w-[960px] space-y-4 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <Link
          href={`/mis-cursos/${cursoId}?roadmapFocus=${encodeURIComponent(evaluacionId)}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[#061120]/35 px-3 py-2 text-xs font-semibold text-white/80 backdrop-blur-md transition-colors hover:bg-white/15 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al curso
        </Link>

        <PresentarEvaluacion
          titulo={evaluacion.titulo}
          descripcion={evaluacion.descripcion}
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
