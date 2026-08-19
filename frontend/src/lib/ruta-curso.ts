import type { TabContenido } from "@/lib/contenido-leccion";

export const EVALUACIONES_POR_MODULO = 3;

export interface LeccionRutaInput {
  id: string;
  titulo: string;
  tipoContenido: "texto" | "video" | "archivo" | "mixto";
  completada: boolean;
  categoriasContenido?: TabContenido[];
  portadaUrl?: string | null;
  duracionMin?: number | null;
  duracionSeg?: number | null;
}

export interface EvaluacionRutaInput {
  id: string;
  titulo: string;
  aprobado: boolean;
  intentosUsados: number;
}

export interface ModuloRutaInput {
  id: string;
  titulo: string;
  lecciones: LeccionRutaInput[];
  evaluaciones: EvaluacionRutaInput[];
}

export interface ItemRutaContenido {
  id: string;
  tipo: "leccion" | "evaluacion";
  titulo: string;
  href: string;
  completado: boolean;
  bloqueado: boolean;
  moduloId: string;
  moduloTitulo: string;
  moduloIndice: number;
  etiquetaTipo: string;
  portadaUrl?: string | null;
  duracionTexto?: string | null;
  categoriasContenido?: TabContenido[];
}

export interface ProximosContenidosResultado {
  etiqueta: "Siguiente clase" | "Siguiente módulo" | null;
  principal: ItemRutaContenido | null;
  secundarios: ItemRutaContenido[];
  cursoCompletado: boolean;
}

export interface ContenidoLeccionMeta {
  texto?: string;
  portadaUrl?: string;
  imagenPortadaUrl?: string;
  duracionMin?: number;
  duracionSeg?: number;
}

export function extraerMetaContenido(contenido: unknown): ContenidoLeccionMeta {
  if (!contenido || typeof contenido !== "object") return {};
  const data = contenido as ContenidoLeccionMeta;
  return {
    texto: data.texto,
    portadaUrl: data.portadaUrl ?? data.imagenPortadaUrl,
    imagenPortadaUrl: data.imagenPortadaUrl,
    duracionMin: data.duracionMin,
    duracionSeg: data.duracionSeg,
  };
}

function etiquetaTipoLeccion(
  categorias: TabContenido[] | undefined,
  tipoContenido: LeccionRutaInput["tipoContenido"],
): string {
  if (categorias?.length) {
    const principal = categorias[0];
    if (principal === "video") return "Video";
    if (principal === "podcast") return "Pódcast";
    if (principal === "documento") return "Documento";
    if (principal === "infografia") return "Infografía";
    if (principal === "presentacion") return "Presentación";
  }
  if (tipoContenido === "video") return "Video";
  if (tipoContenido === "archivo") return "Documento";
  if (tipoContenido === "mixto") return "Contenido mixto";
  return "Lección";
}

function formatearDuracionContenido(
  duracionMin?: number | null,
  duracionSeg?: number | null,
): string | null {
  if (duracionSeg != null && duracionSeg > 0) {
    const minutos = Math.floor(duracionSeg / 60);
    const segundos = duracionSeg % 60;
    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
  }
  if (duracionMin != null && duracionMin > 0) {
    return `${duracionMin} min`;
  }
  return null;
}

export function construirItemsRuta(
  cursoId: string,
  modulos: ModuloRutaInput[],
  navegacionObligatoria: boolean,
): ItemRutaContenido[] {
  const items: ItemRutaContenido[] = [];
  let previoCompletado = true;

  modulos.forEach((modulo, indiceModulo) => {
    for (const leccion of modulo.lecciones) {
      const bloqueado = navegacionObligatoria && !previoCompletado;
      previoCompletado = leccion.completada;
      items.push({
        id: leccion.id,
        tipo: "leccion",
        titulo: leccion.titulo,
        href: `/mis-cursos/${cursoId}/lecciones/${leccion.id}`,
        completado: leccion.completada,
        bloqueado,
        moduloId: modulo.id,
        moduloTitulo: modulo.titulo,
        moduloIndice: indiceModulo,
        etiquetaTipo: etiquetaTipoLeccion(leccion.categoriasContenido, leccion.tipoContenido),
        portadaUrl: leccion.portadaUrl,
        duracionTexto: formatearDuracionContenido(leccion.duracionMin, leccion.duracionSeg),
        categoriasContenido: leccion.categoriasContenido,
      });
    }

    for (const evaluacion of modulo.evaluaciones) {
      const bloqueado = navegacionObligatoria && !previoCompletado;
      previoCompletado = evaluacion.aprobado;
      items.push({
        id: evaluacion.id,
        tipo: "evaluacion",
        titulo: evaluacion.titulo,
        href: `/mis-cursos/${cursoId}/evaluaciones/${evaluacion.id}`,
        completado: evaluacion.aprobado,
        bloqueado,
        moduloId: modulo.id,
        moduloTitulo: modulo.titulo,
        moduloIndice: indiceModulo,
        etiquetaTipo: "Quiz",
        duracionTexto: null,
      });
    }
  });

  return items;
}

export function obtenerProximosContenidos(
  items: ItemRutaContenido[],
  actualId: string,
  actualTipo: "leccion" | "evaluacion",
  maxTotal = 4,
): ProximosContenidosResultado {
  const indiceActual = items.findIndex(
    (item) => item.id === actualId && item.tipo === actualTipo,
  );

  if (indiceActual === -1) {
    return {
      etiqueta: null,
      principal: null,
      secundarios: [],
      cursoCompletado: false,
    };
  }

  const siguientes = items.slice(indiceActual + 1, indiceActual + maxTotal);

  if (siguientes.length === 0) {
    return {
      etiqueta: null,
      principal: null,
      secundarios: [],
      cursoCompletado: true,
    };
  }

  const principal = siguientes[0] ?? null;
  const secundarios = siguientes.slice(1);
  const moduloActual = items[indiceActual]?.moduloId;

  const etiqueta =
    principal && principal.moduloId !== moduloActual
      ? "Siguiente módulo"
      : "Siguiente clase";

  return {
    etiqueta,
    principal,
    secundarios,
    cursoCompletado: false,
  };
}

export function calcularProgresoCurso(items: ItemRutaContenido[]) {
  const total = items.length;
  const completados = items.filter((item) => item.completado).length;
  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;
  return { total, completados, porcentaje };
}

export function asignarEvaluacionesPorModulo<T extends { id: string }>(
  evaluaciones: T[],
  cantidadModulos: number,
): T[][] {
  const porModulo: T[][] = [];

  for (let indice = 0; indice < cantidadModulos; indice += 1) {
    const inicio = indice * EVALUACIONES_POR_MODULO;
    const esUltimo = indice === cantidadModulos - 1;
    porModulo.push(
      evaluaciones.slice(inicio, esUltimo ? undefined : inicio + EVALUACIONES_POR_MODULO),
    );
  }

  return porModulo;
}
