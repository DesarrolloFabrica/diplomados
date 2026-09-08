import type { CursoCatalogoFila } from "@backend/server/queries/mis-cursos";

/** Enlace directo a la última lección vista o, si no hay, a la primera del curso. */
export function hrefContinuarCurso(
  curso: Pick<CursoCatalogoFila, "id" | "ultimaLeccionId" | "primeraLeccionId">,
): string {
  const leccionId = curso.ultimaLeccionId ?? curso.primeraLeccionId;
  if (leccionId) {
    return `/mis-cursos/${curso.id}/lecciones/${leccionId}`;
  }
  return `/mis-cursos/${curso.id}`;
}
