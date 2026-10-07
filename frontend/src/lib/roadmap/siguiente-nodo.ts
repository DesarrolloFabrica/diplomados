export interface NodoRoadmapSiguiente {
  id: string;
  titulo: string;
  href: string;
  completado: boolean;
  bloqueado: boolean;
}

export interface GrupoRoadmapSiguiente {
  nodos: NodoRoadmapSiguiente[];
}

/** Próxima estación disponible en el roadmap (misma fuente que la estación activa). */
export function obtenerSiguienteNodoRoadmap(grupos: GrupoRoadmapSiguiente[]): {
  nodo: NodoRoadmapSiguiente;
  indiceModulo: number;
} | null {
  for (let indiceModulo = 0; indiceModulo < grupos.length; indiceModulo += 1) {
    const grupo = grupos[indiceModulo]!;
    const nodo = grupo.nodos.find(
      (item) => !item.completado && !item.bloqueado && Boolean(item.href),
    );

    if (nodo) {
      return { nodo, indiceModulo };
    }
  }

  return null;
}

export function cursoRoadmapCompletado(grupos: GrupoRoadmapSiguiente[]): boolean {
  return (
    grupos.length > 0 &&
    grupos.every(
      (grupo) => grupo.nodos.length > 0 && grupo.nodos.every((nodo) => nodo.completado),
    )
  );
}

/**
 * Destino del botón "Continuar" (home y mapa): la última clase abierta por el
 * estudiante (`inscripciones.ultima_leccion_id`).
 * - Si esa clase no está completada → se retoma esa misma clase.
 * - Si ya está completada → la siguiente estación disponible después de ella.
 * - Sin última clase registrada (o ya no existe/está bloqueada) → la primera
 *   estación pendiente del roadmap, como antes.
 */
export function resolverNodoContinuar(
  grupos: GrupoRoadmapSiguiente[],
  ultimaLeccionId: string | null | undefined,
): { nodo: NodoRoadmapSiguiente; indiceModulo: number } | null {
  if (ultimaLeccionId) {
    const planos = grupos.flatMap((grupo, indiceModulo) =>
      grupo.nodos.map((nodo) => ({ nodo, indiceModulo })),
    );
    const indiceUltima = planos.findIndex(({ nodo }) => nodo.id === ultimaLeccionId);
    const ultima = planos[indiceUltima];

    if (ultima && !ultima.nodo.bloqueado && ultima.nodo.href) {
      if (!ultima.nodo.completado) return ultima;

      const siguiente = planos
        .slice(indiceUltima + 1)
        .find(({ nodo }) => !nodo.completado && !nodo.bloqueado && Boolean(nodo.href));
      if (siguiente) return siguiente;
    }
  }

  return obtenerSiguienteNodoRoadmap(grupos);
}
