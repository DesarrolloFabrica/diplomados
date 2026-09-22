const PREFIJO_LECCIONES_INICIADAS = "leccion:iniciadas:v1";

export const EVENTO_LECCION_INICIADA = "plataforma:leccion-iniciada";

function claveLeccionesIniciadas(enrollmentId: string) {
  return `${PREFIJO_LECCIONES_INICIADAS}:${enrollmentId}`;
}

export function obtenerLeccionesIniciadas(enrollmentId: string): Set<string> {
  try {
    const valor = window.localStorage.getItem(claveLeccionesIniciadas(enrollmentId));
    if (!valor) return new Set();

    const ids: unknown = JSON.parse(valor);
    return Array.isArray(ids)
      ? new Set(ids.filter((id): id is string => typeof id === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

export function marcarLeccionIniciada(enrollmentId: string, lessonId: string) {
  try {
    const iniciadas = obtenerLeccionesIniciadas(enrollmentId);
    iniciadas.add(lessonId);
    window.localStorage.setItem(
      claveLeccionesIniciadas(enrollmentId),
      JSON.stringify([...iniciadas]),
    );
    window.dispatchEvent(
      new CustomEvent(EVENTO_LECCION_INICIADA, {
        detail: { enrollmentId, lessonId },
      }),
    );
  } catch {
    // La vista actual sigue indicando progreso aunque localStorage no este disponible.
  }
}
