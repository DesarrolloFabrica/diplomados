/**
 * Redirección para route handlers con `Location` RELATIVO (p. ej.
 * "/mis-cursos/…"): el navegador la resuelve contra el dominio en el que
 * está. No usar `new URL(ruta, request.url)`: en Cloud Run el servidor
 * standalone escucha en 0.0.0.0:8080 y `request.url` trae ese host interno,
 * con lo que el navegador terminaría en https://0.0.0.0:8080/… (ERR_ADDRESS_INVALID).
 */
export function redireccionRelativa(ruta: string): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: ruta,
      // El destino depende del progreso del estudiante: nunca cachear.
      "Cache-Control": "no-store",
    },
  });
}
