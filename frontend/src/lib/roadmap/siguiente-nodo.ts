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
