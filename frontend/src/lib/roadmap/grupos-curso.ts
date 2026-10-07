import type { VistaCursoColaborador } from "@backend/server/queries/mis-cursos";
import type { GrupoRuta, NodoRuta } from "@/components/shared/ruta-aprendizaje";

const EVALUACIONES_POR_MODULO = 3;

/**
 * Grupos (módulos) y estaciones del roadmap de un curso para el estudiante.
 * Fuente única para el mapa (/mis-cursos/[cursoId]) y para el destino de
 * "Continuar" (/mis-cursos/[cursoId]/continuar).
 */
export function construirGruposRuta(
  cursoId: string,
  vista: Pick<VistaCursoColaborador, "curso" | "modulosConLecciones" | "evaluaciones">,
): GrupoRuta[] {
  const { curso, modulosConLecciones, evaluaciones } = vista;
  const esObligatoria = curso.navegacion === "obligatoria";
  let previoCompletado = true;

  return modulosConLecciones.map((modulo, indiceModulo) => {
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
}
