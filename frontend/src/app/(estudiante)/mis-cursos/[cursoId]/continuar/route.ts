import { requerirSesion } from "@backend/lib/auth/sesion";
import { cargarVistaCursoColaborador } from "@backend/server/queries/mis-cursos";
import { redireccionRelativa } from "@/lib/redireccion-relativa";
import { construirGruposRuta } from "@/lib/roadmap/grupos-curso";
import { resolverNodoContinuar } from "@/lib/roadmap/siguiente-nodo";

/**
 * Destino de los botones "Continuar" del home: lleva directo a la última
 * clase abierta por el estudiante (o a la siguiente si ya la completó), con
 * la misma regla que el "Continuar" del mapa del curso.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cursoId: string }> },
) {
  const { cursoId } = await params;
  const sesion = await requerirSesion();

  const vista = await cargarVistaCursoColaborador(sesion.id, cursoId);
  if (!vista) {
    return redireccionRelativa("/mis-cursos");
  }
  if (!vista.inscripcion) {
    return redireccionRelativa(`/mis-cursos/${cursoId}/informacion`);
  }

  const destino = resolverNodoContinuar(
    construirGruposRuta(cursoId, vista),
    vista.inscripcion.ultimaLeccionId,
  );

  // Curso terminado o sin contenido disponible: se muestra el mapa.
  return redireccionRelativa(destino?.nodo.href ?? `/mis-cursos/${cursoId}`);
}
