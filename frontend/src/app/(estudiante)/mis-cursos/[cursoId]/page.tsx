import { notFound } from "next/navigation";
import { requerirSesion } from "@backend/lib/auth/sesion";
import { cargarVistaCursoColaborador } from "@backend/server/queries/mis-cursos";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { EstadisticasCurso } from "@/components/shared/estadisticas-curso";
import {
  RutaAprendizaje,
  type GrupoRuta,
  type NodoRuta,
} from "@/components/shared/ruta-aprendizaje";
import { BotonInscribirme } from "./boton-inscribirme";
import { cursoRoadmapCompletado } from "@/lib/roadmap/siguiente-nodo";

interface CursoColaboradorPageProps {
  params: Promise<{ cursoId: string }>;
  searchParams: Promise<{ roadmapFocus?: string; roadmapTransition?: string }>;
}

export default async function CursoColaboradorPage({
  params,
  searchParams,
}: CursoColaboradorPageProps) {
  const { cursoId } = await params;
  const { roadmapFocus, roadmapTransition } = await searchParams;
  const sesion = await requerirSesion();

  const vista = await cargarVistaCursoColaborador(sesion.id, cursoId);
  if (!vista) notFound();

  const { curso, modulos, inscripcion, modulosConLecciones, evaluaciones } = vista;

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
      moduloId: modulo.id,
      titulo: `Módulo ${indiceModulo + 1}: ${modulo.titulo}`,
      nodos,
    };
  });

  const hayContenido = grupos.some((g) => g.nodos.length > 0);
  const porcentajeAvance = Number(inscripcion.porcentajeAvance);
  const cursoCompletado = cursoRoadmapCompletado(grupos);

  return (
    <div className="min-w-0">
      {hayContenido ? (
        <RutaAprendizaje
          grupos={grupos}
          focoNodoId={roadmapFocus}
          transicionNodoId={roadmapTransition}
          cursoTitulo={curso.titulo}
          heroInmersivo={{
            titulo: curso.titulo,
            descripcion: curso.descripcion,
            duracionEstimadaMin: curso.duracionEstimadaMin,
            nivelDificultad: curso.nivelDificultad,
            cantidadModulos: modulos.length,
            porcentajeAvance,
            cursoCompletado,
            nombreUsuario: sesion.nombreCompleto,
          }}
        />
      ) : (
        <p className="px-6 py-10 text-center text-muted-foreground">
          Este curso todavía no tiene contenido.
        </p>
      )}
    </div>
  );
}
