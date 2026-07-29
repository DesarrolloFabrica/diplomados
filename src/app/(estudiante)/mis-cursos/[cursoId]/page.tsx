import { notFound } from "next/navigation";
import { requerirSesion } from "@/lib/auth/sesion";
import { obtenerCurso, listarModulos } from "@/server/queries/cursos";
import {
  obtenerInscripcion,
  listarLeccionesConProgreso,
  listarEvaluacionesConEstado,
} from "@/server/queries/mis-cursos";
import { Progress } from "@/components/ui/progress";
import { PortadaCurso } from "@/components/shared/portada-curso";
import {
  RutaAprendizaje,
  type GrupoRuta,
  type NodoRuta,
} from "@/components/shared/ruta-aprendizaje";
import { BotonInscribirme } from "./boton-inscribirme";

interface CursoColaboradorPageProps {
  params: Promise<{ cursoId: string }>;
}

export default async function CursoColaboradorPage({ params }: CursoColaboradorPageProps) {
  const { cursoId } = await params;
  const sesion = await requerirSesion();

  const curso = await obtenerCurso(sesion.id, cursoId);
  if (!curso) notFound();

  const inscripcion = await obtenerInscripcion(sesion.id, cursoId);

  if (!inscripcion) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-40 w-full overflow-hidden rounded-lg">
          <PortadaCurso
            url={curso.imagenPortadaUrl}
            esDiplomado={curso.esDiplomado}
            titulo={curso.titulo}
            className="rounded-none"
          />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{curso.titulo}</h1>
        {curso.descripcion && <p className="text-muted-foreground">{curso.descripcion}</p>}
        {curso.objetivo && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Objetivo: </span>
            {curso.objetivo}
          </p>
        )}
        <BotonInscribirme cursoId={cursoId} />
      </div>
    );
  }

  const modulos = await listarModulos(sesion.id, cursoId);
  const modulosConLecciones = await Promise.all(
    modulos.map(async (modulo) => ({
      ...modulo,
      lecciones: await listarLeccionesConProgreso(sesion.id, modulo.id, inscripcion.id),
    })),
  );
  const evaluaciones = await listarEvaluacionesConEstado(sesion.id, cursoId);

  // La navegación "obligatoria" bloquea un nodo hasta completar todos los
  // anteriores en la ruta (lecciones y evaluaciones, en orden). Con "libre"
  // nada se bloquea.
  // Sin moduloId en evaluaciones: se asignan de a 3 por módulo en orden de
  // creación; el sobrante queda en el último módulo.
  const esObligatoria = curso.navegacion === "obligatoria";
  let previoCompletado = true;
  const EVALUACIONES_POR_MODULO = 3;

  const grupos: GrupoRuta[] = modulosConLecciones.map((modulo, indiceModulo) => {
    const nodos: NodoRuta[] = [];

    for (const leccion of modulo.lecciones) {
      const bloqueado = esObligatoria && !previoCompletado;
      previoCompletado = leccion.completada;
      nodos.push({
        id: leccion.id,
        tipo: "leccion",
        titulo: leccion.titulo,
        href: `/mis-cursos/${cursoId}/lecciones/${leccion.id}`,
        completado: leccion.completada,
        bloqueado,
      });
    }

    const inicio = indiceModulo * EVALUACIONES_POR_MODULO;
    const esUltimo = indiceModulo === modulosConLecciones.length - 1;
    const evaluacionesModulo = evaluaciones.slice(
      inicio,
      esUltimo ? undefined : inicio + EVALUACIONES_POR_MODULO,
    );

    for (const evaluacion of evaluacionesModulo) {
      const bloqueado = esObligatoria && !previoCompletado;
      previoCompletado = evaluacion.aprobado;
      nodos.push({
        id: evaluacion.id,
        tipo: "evaluacion",
        titulo: evaluacion.titulo,
        href: `/mis-cursos/${cursoId}/evaluaciones/${evaluacion.id}`,
        completado: evaluacion.aprobado,
        bloqueado,
      });
    }

    return {
      titulo: `Módulo ${indiceModulo + 1}: ${modulo.titulo}`,
      nodos,
    };
  });

  const hayContenido = grupos.some((g) => g.nodos.length > 0);
  const porcentajeAvance = Number(inscripcion.porcentajeAvance);

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-3xl">
        <div className="h-40 w-full overflow-hidden rounded-lg">
          <PortadaCurso
            url={curso.imagenPortadaUrl}
            esDiplomado={curso.esDiplomado}
            titulo={curso.titulo}
            className="rounded-none"
          />
        </div>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
          {curso.titulo}
        </h1>
        <div className="mt-3 hidden space-y-1 dark:block">
          <Progress value={porcentajeAvance} />
          <p className="text-sm text-muted-foreground">
            {Math.round(porcentajeAvance)}% completado
          </p>
        </div>
      </div>

      {hayContenido ? (
        <>
          <section className="roadmap-section relative isolate -mx-6 min-h-screen overflow-hidden px-5 py-8 dark:hidden sm:mx-0 sm:rounded-2xl sm:px-8 lg:px-12">
            <div
              aria-hidden="true"
              className="roadmap-dots pointer-events-none absolute inset-0 z-0"
            />
            <div
              aria-hidden="true"
              className="roadmap-shapes pointer-events-none absolute inset-0 z-0"
            />
            <svg
              aria-hidden="true"
              className="roadmap-vectors pointer-events-none absolute -left-14 top-32 z-0 aspect-square w-[140px] opacity-30 sm:-left-20 sm:w-[190px] lg:-left-24 lg:w-[260px]"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <g
                fill="none"
                stroke="rgba(100, 130, 155, 0.22)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              >
                <polygon points="8,68 48,10 92,42 66,92" fill="rgba(130, 160, 185, 0.08)" />
                <line x1="12" y1="18" x2="82" y2="88" />
                <line x1="24" y1="8" x2="24" y2="90" />
                <path d="M34 28 l12 12 M46 28 l-12 12" />
                <path d="M18 62 l10 10 M28 62 l-10 10" />
              </g>
            </svg>

            <svg
              aria-hidden="true"
              className="roadmap-vectors pointer-events-none absolute -right-12 top-[28rem] z-0 aspect-[3/4] w-[140px] opacity-30 sm:-right-16 sm:w-[190px] lg:-right-20 lg:w-[220px]"
              viewBox="0 0 90 120"
              preserveAspectRatio="xMidYMid meet"
            >
              <g
                fill="none"
                stroke="rgba(100, 130, 155, 0.2)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              >
                <polygon points="8,18 76,8 84,88 30,114" fill="rgba(130, 160, 185, 0.06)" />
                <line x1="16" y1="4" x2="78" y2="112" />
                <line x1="70" y1="8" x2="70" y2="116" />
                <line x1="12" y1="54" x2="84" y2="54" />
                <path d="M45 28 l12 12 M57 28 l-12 12" />
                <path d="M30 78 l10 10 M40 78 l-10 10" />
              </g>
            </svg>

            <svg
              aria-hidden="true"
              className="roadmap-vectors pointer-events-none absolute -left-10 bottom-40 z-0 aspect-square w-[140px] opacity-30 sm:-left-14 sm:w-[190px] lg:-left-16 lg:w-[240px]"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <polygon
                points="8,58 48,8 92,30 72,92 18,84"
                fill="rgba(130, 160, 185, 0.07)"
                stroke="rgba(110, 140, 165, 0.14)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <g fill="none" stroke="rgba(100, 130, 155, 0.2)" strokeWidth="1">
                <line x1="10" y1="18" x2="88" y2="86" />
                <line x1="34" y1="5" x2="34" y2="94" />
                <path d="M52 46 l12 12 M64 46 l-12 12" />
              </g>
            </svg>

            <div className="relative z-10">
              <div className="mx-auto mb-10 max-w-3xl space-y-2">
                <div
                  className="roadmap-progress"
                  role="progressbar"
                  aria-label="Progreso del curso"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={porcentajeAvance}
                >
                  <div
                    className="roadmap-progress-fill"
                    style={{ width: `${porcentajeAvance}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {Math.round(porcentajeAvance)}% completado
                </p>
              </div>

              <RutaAprendizaje grupos={grupos} />
            </div>
          </section>

          <div className="hidden overflow-x-auto py-4 dark:block">
            <RutaAprendizaje grupos={grupos} legacy />
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
          Este curso todavía no tiene contenido.
        </p>
      )}
    </div>
  );
}
