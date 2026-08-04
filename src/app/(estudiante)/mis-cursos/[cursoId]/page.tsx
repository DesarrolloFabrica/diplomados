import { notFound } from "next/navigation";
import { requerirSesion } from "@/lib/auth/sesion";
import { obtenerCurso, listarModulos } from "@/server/queries/cursos";
import {
  obtenerInscripcion,
  listarLeccionesConProgreso,
  listarEvaluacionesConEstado,
} from "@/server/queries/mis-cursos";
import { HeroCurso } from "@/components/shared/hero-curso";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { EstadisticasCurso } from "@/components/shared/estadisticas-curso";
import {
  RutaAprendizaje,
  VistaRoadmap,
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

  const modulos = await listarModulos(sesion.id, cursoId);
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
        <EstadisticasCurso
          duracionEstimadaMin={curso.duracionEstimadaMin}
          nivelDificultad={curso.nivelDificultad}
          cantidadModulos={modulos.length}
        />
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
    <div className="min-w-0">
      <div className="-mx-5 w-auto min-w-0 sm:-mx-6 lg:-mx-8 xl:-mx-10">
        <HeroCurso
          cursoId={curso.id}
          titulo={curso.titulo}
          imagenPortadaUrl={curso.imagenPortadaUrl}
          esDiplomado={curso.esDiplomado}
          duracionEstimadaMin={curso.duracionEstimadaMin}
          nivelDificultad={curso.nivelDificultad}
          cantidadModulos={modulos.length}
          porcentajeAvance={porcentajeAvance}
        />

        {hayContenido ? (
          <VistaRoadmap>
            <RutaAprendizaje grupos={grupos} />
          </VistaRoadmap>
        ) : (
          <p className="px-6 py-10 text-center text-muted-foreground">
            Este curso todavía no tiene contenido.
          </p>
        )}
      </div>
    </div>
  );
}
