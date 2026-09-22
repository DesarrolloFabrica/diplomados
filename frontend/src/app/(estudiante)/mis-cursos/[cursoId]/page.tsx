import { notFound, redirect } from "next/navigation";
import { requerirSesion } from "@backend/lib/auth/sesion";
import { cargarVistaCursoColaborador } from "@backend/server/queries/mis-cursos";
import {
  RutaAprendizaje,
  type GrupoRuta,
  type NodoRuta,
} from "@/components/shared/ruta-aprendizaje";
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
    redirect(`/mis-cursos/${cursoId}/informacion`);
  }

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
          modoInmersivo
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
