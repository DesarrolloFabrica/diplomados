/**
 * Enlace de "Continuar" para un curso inscrito: la ruta /continuar resuelve
 * en el servidor la última clase abierta (inscripciones.ultima_leccion_id) o
 * la siguiente pendiente, con la misma regla que el mapa del curso.
 */
export function hrefContinuarCurso(cursoId: string): string {
  return `/mis-cursos/${cursoId}/continuar`;
}
