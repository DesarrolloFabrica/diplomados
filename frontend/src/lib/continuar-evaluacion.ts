/**
 * Último quiz abierto, para "Continuar aprendiendo" del menú inferior.
 * `inscripciones.ultima_leccion_id` solo admite lecciones (y no se agregan
 * columnas nuevas), así que el quiz se recuerda en una cookie del navegador
 * (`cursoId:evaluacionId`). Al abrir una lección se borra: lo último abierto
 * vuelve a ser esa lección.
 */
export const COOKIE_CONTINUAR_EVALUACION = "continuar_evaluacion";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOVENTA_DIAS_S = 60 * 60 * 24 * 90;

export function recordarEvaluacionAbierta(cursoId: string, evaluacionId: string) {
  document.cookie =
    `${COOKIE_CONTINUAR_EVALUACION}=${cursoId}:${evaluacionId}; ` +
    `path=/; max-age=${NOVENTA_DIAS_S}; samesite=lax`;
}

export function olvidarEvaluacionAbierta() {
  if (!document.cookie.includes(`${COOKIE_CONTINUAR_EVALUACION}=`)) return;
  document.cookie = `${COOKIE_CONTINUAR_EVALUACION}=; path=/; max-age=0; samesite=lax`;
}

/** Valida y separa el valor de la cookie (lado servidor). */
export function leerEvaluacionAbierta(
  valor: string | undefined,
): { cursoId: string; evaluacionId: string } | null {
  const [cursoId, evaluacionId] = valor?.split(":") ?? [];
  if (!cursoId || !evaluacionId || !UUID.test(cursoId) || !UUID.test(evaluacionId)) {
    return null;
  }
  return { cursoId, evaluacionId };
}
