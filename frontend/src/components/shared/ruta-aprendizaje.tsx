"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  BookOpen,
  Check,
  ClipboardCheck,
  FileText,
  Lock,
  Play,
  ArrowRight,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { obtenerSiguienteNodoRoadmap } from "@/lib/roadmap/siguiente-nodo";
import { cn } from "@/lib/utils";

export interface NodoRuta {
  id: string;
  tipo: "leccion" | "evaluacion";
  titulo: string;
  href: string;
  completado: boolean;
  bloqueado: boolean;
}

export interface GrupoRuta {
  moduloId: string;
  titulo: string;
  nodos: NodoRuta[];
}

const NODO = 64;
const ANILLO = 84;
const RADIO_ANILLO = 36;
const ROADMAP_STAGE_WIDTH = 860;
const ROADMAP_STEP_Y = 168;
const ROADMAP_TOP_Y = 130;
const ROADMAP_POSICIONES_X = [390, 500, 430, 540] as const;

const ROADMAP_ASSETS = {
  inicio: "/images/roadmap_asset/r_inicio.png",
  mid: "/images/roadmap_asset/r_mid.png",
  fin: "/images/roadmap_asset/r_fin.png",
  quiz: "/images/roadmap_asset/r_quiz.png",
  avatar: "/images/roadmap_asset/Avatar.png",
} as const;

/** Secuencia fija por módulo: intro → práctica → lectura → actividad. */
const ICONOS_LECCION: LucideIcon[] = [BookOpen, Play, FileText, Wrench];

type EstadoEstacion = "completado" | "activo" | "pendiente" | "bloqueado";
type TipoAssetEstacion = "inicio" | "mid" | "fin" | "quiz";
type FaseTransicionRoadmap =
  | "idle"
  | "scrolling-to-origin"
  | "waiting"
  | "completing"
  | "holding"
  | "moving"
  | "scrolling-to-destination"
  | "arrived";

interface ColorModulo {
  inicio: string;
  final: string;
  glow: string;
}

const COLORES_MODULO: ColorModulo[] = [
  { inicio: "#8B5CF6", final: "#C084FC", glow: "rgba(139,92,246,0.38)" },
  { inicio: "#F97316", final: "#FDBA74", glow: "rgba(249,115,22,0.36)" },
  { inicio: "#38BDF8", final: "#7DD3FC", glow: "rgba(56,189,248,0.36)" },
  { inicio: "#DB2777", final: "#F472B6", glow: "rgba(219,39,119,0.36)" },
  { inicio: "#14B8A6", final: "#5EEAD4", glow: "rgba(20,184,166,0.34)" },
];

function colorModuloPorIndice(indiceModulo: number): ColorModulo {
  return COLORES_MODULO[indiceModulo % COLORES_MODULO.length]!;
}

function idNodoActivoModulo(nodos: NodoRuta[]): string | null {
  return nodos.find((n) => !n.completado && !n.bloqueado)?.id ?? null;
}

function estadoEstacion(nodo: NodoRuta, esActivo: boolean): EstadoEstacion {
  if (nodo.bloqueado) return "bloqueado";
  if (nodo.completado) return "completado";
  if (esActivo) return "activo";
  return "pendiente";
}

function nodoParaFaseVisual(nodo: NodoRuta, estadoForzado?: EstadoEstacion): NodoRuta {
  if (!estadoForzado) return nodo;

  return {
    ...nodo,
    completado: estadoForzado === "completado" ? true : false,
    bloqueado: estadoForzado === "bloqueado" ? true : false,
  };
}

function progresoAnilloVisual(
  estado: EstadoEstacion,
  indiceEnModulo: number,
  totalModulo: number,
): number {
  if (estado === "bloqueado") return 0;
  if (estado === "completado") return 100;

  const fraccion =
    totalModulo <= 1 ? 1 : (indiceEnModulo + 1) / totalModulo;

  if (estado === "activo") {
    return Math.round(55 + fraccion * 20);
  }

  return Math.round(18 + fraccion * 17);
}

function iconoEstacion(nodo: NodoRuta, indiceLeccion: number): LucideIcon {
  if (nodo.bloqueado) return Lock;
  if (nodo.completado) return Check;
  if (nodo.tipo === "evaluacion") return ClipboardCheck;
  return ICONOS_LECCION[indiceLeccion % ICONOS_LECCION.length] ?? BookOpen;
}

type VarianteRoadmap = "mobile" | "desktop";
type AlineacionEtiqueta = "left" | "center" | "right";

interface LayoutNodoRoadmap {
  nodo: NodoRuta;
  indice: number;
  indiceLeccion: number;
  x: number;
  y: number;
  textoALaIzquierda: boolean;
  asset: TipoAssetEstacion | null;
  mostrarAsset: boolean;
  assetX: number;
  assetY: number;
  assetSize: number;
  assetClassName: string;
}

interface ProgresoModulo {
  total: number;
  completados: number;
  porcentaje: number;
  completo: boolean;
}

interface NodoPlanoRoadmap {
  nodo: NodoRuta;
  indiceGrupo: number;
  indiceNodo: number;
}

interface PuntoAvatarRoadmap {
  x: number;
  y: number;
}

interface MovimientoAvatarRoadmap {
  origen: PuntoAvatarRoadmap;
  destino: PuntoAvatarRoadmap;
  activo: boolean;
  duracionMs: number;
}

function idNodoActivoGlobal(grupos: GrupoRuta[]): string | null {
  return obtenerSiguienteNodoRoadmap(grupos)?.nodo.id ?? null;
}

function calcularProgresoModulo(nodos: NodoRuta[]): ProgresoModulo {
  const total = nodos.length;
  const completados = nodos.filter((nodo) => nodo.completado).length;
  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

  return {
    total,
    completados,
    porcentaje,
    completo: total > 0 && completados === total,
  };
}

function moduloDisponible(grupo: GrupoRuta): boolean {
  return grupo.nodos.some((nodo) => !nodo.bloqueado);
}

function indiceModuloPorNodo(grupos: GrupoRuta[], nodoId: string | null | undefined): number {
  if (!nodoId) return -1;
  return grupos.findIndex((grupo) => grupo.nodos.some((nodo) => nodo.id === nodoId));
}

function indiceModuloInicial(
  grupos: GrupoRuta[],
  transicionNodoId?: string,
  focoNodoId?: string,
): number {
  if (grupos.length === 0) return 0;

  const indiceParametro = indiceModuloPorNodo(grupos, transicionNodoId ?? focoNodoId);
  if (indiceParametro >= 0) return indiceParametro;

  const nodoActivoId = idNodoActivoGlobal(grupos);
  const indiceActivo = indiceModuloPorNodo(grupos, nodoActivoId);
  if (indiceActivo >= 0) return indiceActivo;

  const indiceIncompleto = grupos.findIndex(
    (grupo) => moduloDisponible(grupo) && !calcularProgresoModulo(grupo.nodos).completo,
  );
  if (indiceIncompleto >= 0) return indiceIncompleto;

  return grupos.length - 1;
}

function siguienteIndiceModuloDisponible(
  grupos: GrupoRuta[],
  indiceActual: number,
): number | null {
  const siguiente = grupos.findIndex(
    (grupo, indice) => indice > indiceActual && moduloDisponible(grupo),
  );

  return siguiente >= 0 ? siguiente : null;
}

function aplanarNodosRoadmap(grupos: GrupoRuta[]): NodoPlanoRoadmap[] {
  return grupos.flatMap((grupo, indiceGrupo) =>
    grupo.nodos.map((nodo, indiceNodo) => ({ nodo, indiceGrupo, indiceNodo })),
  );
}

function mapaCompletados(grupos: GrupoRuta[]): Map<string, boolean> {
  return new Map(
    grupos.flatMap((grupo) => grupo.nodos.map((nodo) => [nodo.id, nodo.completado] as const)),
  );
}

function siguienteNodoDisponible(
  nodos: NodoPlanoRoadmap[],
  nodoCompletadoId: string,
): NodoRuta | null {
  const indiceCompletado = nodos.findIndex(({ nodo }) => nodo.id === nodoCompletadoId);
  if (indiceCompletado < 0) return null;

  const siguientes = nodos.slice(indiceCompletado + 1);
  return (
    siguientes.find(({ nodo }) => !nodo.completado && !nodo.bloqueado)?.nodo ??
    siguientes.find(({ nodo }) => !nodo.bloqueado)?.nodo ??
    null
  );
}

function prefiereMovimientoReducido(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function esperarDoblePintado(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

function elementoNodoRoadmap(nodoId: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const escapeCss =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape
      : (value: string) => value.replace(/"/g, '\\"');
  const elementos = Array.from(
    document.querySelectorAll<HTMLElement>(
      `[data-roadmap-node="${escapeCss(nodoId)}"],[data-roadmap-node-id="${escapeCss(nodoId)}"]`,
    ),
  );

  return elementos.find((elemento) => elemento.getClientRects().length > 0) ?? null;
}

async function esperarElementoNodoRoadmap(
  nodoId: string,
  intentos = 10,
): Promise<HTMLElement | null> {
  for (let intento = 0; intento < intentos; intento += 1) {
    const elemento = elementoNodoRoadmap(nodoId);
    if (elemento) return elemento;

    await esperarDoblePintado();
  }

  return null;
}

async function centrarNodoRoadmap(
  nodoId: string,
  reducido: boolean,
): Promise<HTMLElement | null> {
  const elemento = await esperarElementoNodoRoadmap(nodoId);
  if (!elemento) return null;

  elemento.scrollIntoView({
    behavior: reducido ? "auto" : "smooth",
    block: "center",
    inline: "nearest",
  });
  return elemento;
}

function esperarFinScroll(
  elemento: HTMLElement,
  reducido: boolean,
  timeoutMs = 850,
): Promise<void> {
  if (reducido) return wait(0);

  return new Promise((resolve) => {
    let resuelto = false;
    const terminar = () => {
      if (resuelto) return;
      resuelto = true;
      window.removeEventListener("scrollend", terminar);
      elemento.removeEventListener("scrollend", terminar);
      window.clearTimeout(timeoutId);
      resolve();
    };

    const timeoutId = window.setTimeout(terminar, timeoutMs);
    window.addEventListener("scrollend", terminar, { once: true });
    elemento.addEventListener("scrollend", terminar, { once: true });
  });
}

function puntoCentroElemento(elemento: HTMLElement): PuntoAvatarRoadmap {
  const rect = elemento.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function limpiarParametrosRoadmap(parametros: string[]): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const hayParametros = parametros.some((parametro) => url.searchParams.has(parametro));
  if (!hayParametros) return;

  parametros.forEach((parametro) => url.searchParams.delete(parametro));
  const query = url.searchParams.toString();
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${query ? `?${query}` : ""}${url.hash}`,
  );
}

function estadoVisualTransicion(
  nodoId: string,
  nodoTransicionId: string | null,
  nodoDestinoId: string | null,
  fase: FaseTransicionRoadmap,
): EstadoEstacion | undefined {
  if (nodoId === nodoDestinoId && fase === "arrived") return "activo";
  if (nodoId !== nodoTransicionId) return undefined;

  if (fase === "scrolling-to-origin" || fase === "waiting") return "activo";
  if (
    fase === "completing" ||
    fase === "holding" ||
    fase === "moving" ||
    fase === "scrolling-to-destination" ||
    fase === "arrived"
  ) {
    return "completado";
  }

  return undefined;
}

function indiceLeccionEnNodo(nodos: NodoRuta[], indice: number): number {
  if (nodos[indice]?.tipo !== "leccion") return 0;
  let contador = 0;
  for (let i = 0; i < indice; i += 1) {
    if (nodos[i]?.tipo === "leccion") contador += 1;
  }
  return contador;
}

function cantidadLecciones(nodos: NodoRuta[]): number {
  return nodos.filter((nodo) => nodo.tipo === "leccion").length;
}

function indicePrimeraEvaluacion(nodos: NodoRuta[]): number {
  return nodos.findIndex((nodo) => nodo.tipo === "evaluacion");
}

function assetParaNodo(nodos: NodoRuta[], indice: number): {
  tipo: TipoAssetEstacion | null;
  mostrar: boolean;
} {
  const nodo = nodos[indice];
  if (!nodo) return { tipo: null, mostrar: false };

  if (nodo.tipo === "evaluacion") {
    return {
      tipo: "quiz",
      mostrar: indice === indicePrimeraEvaluacion(nodos),
    };
  }

  const lecciones = cantidadLecciones(nodos);
  const indiceLeccion = indiceLeccionEnNodo(nodos, indice);
  const ultimaLeccion = lecciones - 1;

  if (indiceLeccion === 0) return { tipo: "inicio", mostrar: true };
  if (indiceLeccion === ultimaLeccion) return { tipo: "fin", mostrar: true };

  if (lecciones <= 3) return { tipo: "mid", mostrar: indiceLeccion === 1 };

  const primerMid = Math.max(1, Math.floor(ultimaLeccion / 2));
  const segundoMid = Math.min(ultimaLeccion - 1, primerMid + 2);

  return {
    tipo: "mid",
    mostrar: indiceLeccion === primerMid || indiceLeccion === segundoMid,
  };
}

function layoutNodosRoadmap(nodos: NodoRuta[]): LayoutNodoRoadmap[] {
  return nodos.map((nodo, indice) => {
    const x = ROADMAP_POSICIONES_X[indice % ROADMAP_POSICIONES_X.length]!;
    const y = ROADMAP_TOP_Y + indice * ROADMAP_STEP_Y;
    const textoALaIzquierda = x >= ROADMAP_STAGE_WIDTH / 2;
    const { tipo, mostrar } = assetParaNodo(nodos, indice);
    const assetSide = textoALaIzquierda ? 1 : -1;
    const esPrincipal = tipo === "inicio" || tipo === "fin";
    const assetSize =
      tipo === "inicio" ? 250 : tipo === "fin" ? 238 : tipo === "quiz" ? 210 : 196;
    const assetOffsetX = tipo === "quiz" ? 112 : esPrincipal ? 170 : 132;
    const assetOffsetY =
      tipo === "inicio" ? -112 : tipo === "fin" ? -72 : tipo === "quiz" ? -58 : -82;

    return {
      nodo,
      indice,
      indiceLeccion: indiceLeccionEnNodo(nodos, indice),
      x,
      y,
      textoALaIzquierda,
      asset: tipo,
      mostrarAsset: mostrar,
      assetX: x + assetSide * assetOffsetX - assetSize / 2,
      assetY: y + assetOffsetY,
      assetSize,
      assetClassName:
        tipo === "mid" && indice % 2 === 0
          ? "roadmap-asset-soft"
          : tipo === "quiz"
            ? "roadmap-asset-quiz"
            : "",
    };
  });
}

function AnilloEstacion({
  nodoId,
  variant,
  estado,
  progreso,
  esQuiz,
  colorModulo,
}: {
  nodoId: string;
  variant: VarianteRoadmap;
  estado: EstadoEstacion;
  progreso: number;
  esQuiz: boolean;
  colorModulo: ColorModulo;
}) {
  const circunferencia = 2 * Math.PI * RADIO_ANILLO;
  const offset = circunferencia * (1 - progreso / 100);
  const gradId = `ring-grad-${variant}-${nodoId}`;
  const quizGoldId = `quiz-gold-${variant}-${nodoId}`;
  const esCompletado = estado === "completado";
  const strokeAncho = esCompletado ? 5.5 : 4;
  const anilloModuloCompletado = esCompletado && !esQuiz;

  const trackStroke =
    estado === "bloqueado"
      ? esQuiz
        ? "rgba(185, 175, 140, 0.35)"
        : "rgba(148, 163, 184, 0.28)"
      : esQuiz
        ? "rgba(214, 184, 93, 0.28)"
        : "rgba(180, 210, 200, 0.4)";

  const strokeOpacity =
    estado === "bloqueado"
      ? 0.5
      : esCompletado
        ? 1
        : estado === "activo"
          ? 0.92
          : 0.58;

  const glowClass = cn(
    esCompletado &&
      esQuiz &&
      "drop-shadow-[0_0_6px_rgba(214,184,93,0.42)] drop-shadow-[0_0_10px_rgba(185,150,60,0.2)]",
    estado === "activo" &&
      !esQuiz &&
      "drop-shadow-[0_0_10px_rgba(45,212,191,0.55)] drop-shadow-[0_0_22px_rgba(34,211,238,0.25)]",
    estado === "activo" &&
      esQuiz &&
      "drop-shadow-[0_0_10px_rgba(45,212,191,0.52)] drop-shadow-[0_0_22px_rgba(34,211,238,0.24)]",
  );

  const glowStyle: CSSProperties | undefined = anilloModuloCompletado
    ? {
        filter: `drop-shadow(0 0 6px ${colorModulo.glow}) drop-shadow(0 0 12px ${colorModulo.glow})`,
      }
    : undefined;

  const strokeFill = esQuiz
    ? `url(#${quizGoldId})`
    : anilloModuloCompletado
      ? `url(#${gradId}-modulo)`
      : `url(#${gradId})`;

  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 -rotate-90", glowClass)}
      style={glowStyle}
      viewBox={`0 0 ${ANILLO} ${ANILLO}`}
      width={ANILLO}
      height={ANILLO}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2FB9A5" />
          <stop offset="55%" stopColor="#4FC9B3" />
          <stop offset="85%" stopColor="#7ADCC5" />
          <stop offset="100%" stopColor="#91DC00" />
        </linearGradient>
        <linearGradient id={`${gradId}-modulo`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorModulo.inicio} />
          <stop offset="100%" stopColor={colorModulo.final} />
        </linearGradient>
        <linearGradient id={quizGoldId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3E5A8" />
          <stop offset="45%" stopColor="#D6B85D" />
          <stop offset="100%" stopColor="#B9963C" />
        </linearGradient>
      </defs>
      <circle
        cx={ANILLO / 2}
        cy={ANILLO / 2}
        r={RADIO_ANILLO}
        fill="none"
        stroke={trackStroke}
        strokeWidth={strokeAncho}
      />
      {estado !== "bloqueado" && progreso > 0 && (
        <circle
          cx={ANILLO / 2}
          cy={ANILLO / 2}
          r={RADIO_ANILLO}
          fill="none"
          stroke={strokeFill}
          strokeWidth={strokeAncho}
          strokeLinecap={esCompletado ? "butt" : "round"}
          strokeDasharray={circunferencia}
          strokeDashoffset={esCompletado ? 0 : offset}
          opacity={strokeOpacity}
        />
      )}
    </svg>
  );
}

function OndasEstacionActiva() {
  return (
    <>
      <span
        aria-hidden="true"
        className="roadmap-pulse-ring roadmap-pulse-ring-1"
        style={{ width: ANILLO, height: ANILLO }}
      />
      <span
        aria-hidden="true"
        className="roadmap-pulse-ring roadmap-pulse-ring-2"
        style={{ width: ANILLO, height: ANILLO }}
      />
      <span
        aria-hidden="true"
        className="roadmap-pulse-ring roadmap-pulse-ring-3"
        style={{ width: ANILLO, height: ANILLO }}
      />
    </>
  );
}

/** Hexágono plano para estaciones de quiz. */
function NucleoHexagonal({
  nodo,
  variant,
  esActivo,
  Icono,
}: {
  nodo: NodoRuta;
  variant: VarianteRoadmap;
  esActivo: boolean;
  Icono: LucideIcon;
}) {
  const puntos = "32,5 56,17.5 56,46.5 32,59 8,46.5 8,17.5";
  const gradId = `hex-${variant}-${nodo.id}`;

  let relleno = `url(#${gradId}-pending)`;
  let borde = "#C9A84E";
  let colorIcono = "#6B5A2E";

  if (nodo.bloqueado) {
    relleno = "#E2E8F0";
    borde = "rgba(148, 163, 184, 0.45)";
    colorIcono = "#94A3B8";
  } else if (nodo.completado) {
    relleno = `url(#${gradId}-done)`;
    borde = "#D6B85D";
    colorIcono = "#5C4A1A";
  } else if (esActivo) {
    relleno = `url(#${gradId}-active)`;
    borde = "#22D3EE";
    colorIcono = "#FFFFFF";
  }

  return (
    <div className="relative z-20 shrink-0" style={{ width: NODO, height: NODO }}>
      <svg
        width={NODO}
        height={NODO}
        viewBox="0 0 64 64"
        className={cn(
          "drop-shadow-md",
          nodo.completado && "drop-shadow-[0_0_8px_rgba(214,184,93,0.35)]",
          esActivo &&
            !nodo.completado &&
            "drop-shadow-[0_0_10px_rgba(45,212,191,0.55)] drop-shadow-[0_0_22px_rgba(34,211,238,0.25)]",
        )}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${gradId}-pending`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F8F0D4" />
            <stop offset="100%" stopColor="#E8D9A8" />
          </linearGradient>
          <linearGradient id={`${gradId}-active`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0C2240" />
            <stop offset="50%" stopColor="#153B63" />
            <stop offset="100%" stopColor="#1E5D8E" />
          </linearGradient>
          <linearGradient id={`${gradId}-done`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3E5A8" />
            <stop offset="100%" stopColor="#C9A84E" />
          </linearGradient>
        </defs>
        <polygon points={puntos} fill={relleno} stroke={borde} strokeWidth={2} />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Icono className="size-6 shrink-0" style={{ color: colorIcono }} aria-hidden="true" />
      </div>
    </div>
  );
}

function NucleoEstacion({
  nodo,
  variant,
  indiceLeccion,
  indiceEnModulo,
  totalModulo,
  indiceModulo,
  esActivo,
  estadoVisualForzado,
}: {
  nodo: NodoRuta;
  variant: VarianteRoadmap;
  indiceLeccion: number;
  indiceEnModulo: number;
  totalModulo: number;
  indiceModulo: number;
  esActivo: boolean;
  estadoVisualForzado?: EstadoEstacion;
}) {
  const nodoVisual = nodoParaFaseVisual(nodo, estadoVisualForzado);
  const estado = estadoVisualForzado ?? estadoEstacion(nodoVisual, esActivo);
  const progreso = progresoAnilloVisual(estado, indiceEnModulo, totalModulo);
  const esQuiz = nodoVisual.tipo === "evaluacion";
  const Icono = iconoEstacion(nodoVisual, indiceLeccion);
  const colorModulo = colorModuloPorIndice(indiceModulo);
  const nucleoCompletadoModulo = estado === "completado" && !esQuiz;

  const estiloNucleoCompletado: CSSProperties | undefined = nucleoCompletadoModulo
    ? {
        width: NODO,
        height: NODO,
        borderColor: `${colorModulo.final}cc`,
        background: `linear-gradient(to bottom right, ${colorModulo.inicio}, ${colorModulo.final})`,
        boxShadow: `0 0 10px ${colorModulo.glow}`,
      }
    : { width: NODO, height: NODO };

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-visible transition-transform duration-300",
        esActivo && estado !== "completado" && "roadmap-station-active z-30 scale-[1.1] md:scale-[1.14]",
      )}
      style={{ width: ANILLO, height: ANILLO }}
    >
      {estado === "activo" && <OndasEstacionActiva />}
      <AnilloEstacion
        nodoId={nodo.id}
        variant={variant}
        estado={estado}
        progreso={progreso}
        esQuiz={esQuiz}
        colorModulo={colorModulo}
      />
      {esQuiz ? (
        <NucleoHexagonal nodo={nodoVisual} variant={variant} esActivo={esActivo} Icono={Icono} />
      ) : (
        <div
          className={cn(
            "station-core relative z-20 flex items-center justify-center rounded-full border-2 shadow-md transition-transform",
            nucleoCompletadoModulo && "text-white",
            esActivo &&
              estado !== "completado" &&
              "roadmap-station-active-core border-[#22D3EE] bg-gradient-to-br from-[#071B30] via-[#0B2A46] to-[#123B60] text-white shadow-[0_0_14px_rgba(45,212,191,0.42)] hover:scale-105",
            estado === "pendiente" &&
              "border-[#B8D4CE] bg-gradient-to-br from-[#EAF7F5] to-[#D0E8E3] text-[#1A4D45]",
            estado === "bloqueado" && "border-slate-300 bg-slate-100 text-slate-400",
          )}
          style={estiloNucleoCompletado}
        >
          <Icono className="size-6 shrink-0" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

function AssetEstacion({
  layout,
  variant,
}: {
  layout: LayoutNodoRoadmap;
  variant: VarianteRoadmap;
}) {
  if (!layout.asset || !layout.mostrarAsset) return null;

  if (variant === "mobile") {
    return (
      <Image
        src={ROADMAP_ASSETS[layout.asset]}
        alt=""
        width={180}
        height={180}
        aria-hidden="true"
        className={cn(
          "pointer-events-none mx-auto mb-4 mt-2 size-40 object-contain opacity-95 drop-shadow-[0_18px_28px_rgba(6,17,32,0.10)] sm:size-44",
          layout.asset === "quiz" && "size-32 sm:size-36",
        )}
      />
    );
  }

  return (
    <Image
      src={ROADMAP_ASSETS[layout.asset]}
      alt=""
      width={layout.assetSize}
      height={layout.assetSize}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-10 object-contain opacity-95 drop-shadow-[0_22px_34px_rgba(6,17,32,0.12)]",
        layout.assetClassName,
      )}
      style={{
        left: layout.assetX,
        top: layout.assetY,
        width: layout.assetSize,
        height: layout.assetSize,
      }}
    />
  );
}

function AvatarRoadmap({ variant }: { variant: VarianteRoadmap }) {
  return (
    <Image
      src={ROADMAP_ASSETS.avatar}
      alt="Tu posicion actual"
      width={72}
      height={72}
      className={cn(
        "pointer-events-none absolute z-40 object-contain drop-shadow-[0_14px_22px_rgba(6,17,32,0.22)]",
        variant === "mobile" ? "-right-8 -top-9 size-14" : "-right-12 -top-9 size-16",
      )}
    />
  );
}

function AvatarRoadmapEnMovimiento({
  movimiento,
}: {
  movimiento: MovimientoAvatarRoadmap | null;
}) {
  if (!movimiento) return null;

  const dx = movimiento.destino.x - movimiento.origen.x;
  const dy = movimiento.destino.y - movimiento.origen.y;

  return (
    <Image
      src={ROADMAP_ASSETS.avatar}
      alt="Avance hacia la siguiente estacion"
      width={76}
      height={76}
      className={cn(
        "roadmap-transition-avatar pointer-events-none fixed z-[80] size-[76px] object-contain",
        movimiento.activo && "roadmap-transition-avatar-moving",
      )}
      style={
        {
          left: movimiento.origen.x,
          top: movimiento.origen.y,
          "--roadmap-avatar-dx": `${dx}px`,
          "--roadmap-avatar-dy": `${dy}px`,
          "--roadmap-avatar-duration": `${movimiento.duracionMs}ms`,
        } as CSSProperties
      }
    />
  );
}

function CaminoRoadmap({
  layouts,
  indiceModulo,
  nodoActivoId,
}: {
  layouts: LayoutNodoRoadmap[];
  indiceModulo: number;
  nodoActivoId: string | null;
}) {
  if (layouts.length < 2) return null;

  const colorModulo = colorModuloPorIndice(indiceModulo);
  const points = layouts.map((layout) => `${layout.x},${layout.y}`).join(" ");
  const alto = layouts.at(-1)!.y + 96;
  const gradId = `roadmap-path-${indiceModulo}`;
  const indiceActivo = nodoActivoId
    ? layouts.findIndex((layout) => layout.nodo.id === nodoActivoId)
    : -1;
  const segmentoActivo =
    indiceActivo > 0
      ? `${layouts[indiceActivo - 1]!.x},${layouts[indiceActivo - 1]!.y} ${layouts[indiceActivo]!.x},${layouts[indiceActivo]!.y}`
      : null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      viewBox={`0 0 ${ROADMAP_STAGE_WIDTH} ${alto}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2FB9A5" />
          <stop offset="46%" stopColor={colorModulo.final} />
          <stop offset="100%" stopColor="#0454BD" />
        </linearGradient>
      </defs>
      <polyline className="roadmap-isometric-track-shadow" points={points} />
      <polyline className="roadmap-isometric-track-base" points={points} />
      <polyline className="roadmap-isometric-track-tiles" points={points} />
      <polyline className="roadmap-isometric-track-core" points={points} stroke={`url(#${gradId})`} />
      {segmentoActivo && (
        <polyline className="roadmap-isometric-track-active-segment" points={segmentoActivo} />
      )}
    </svg>
  );
}

function ModuloRoadmapDesktop({
  grupo,
  indiceModulo,
  nodoActivoGlobalId,
  nodoTransicionId,
  nodoDestinoId,
  faseTransicion,
}: {
  grupo: GrupoRuta;
  indiceModulo: number;
  nodoActivoGlobalId: string | null;
  nodoTransicionId: string | null;
  nodoDestinoId: string | null;
  faseTransicion: FaseTransicionRoadmap;
}) {
  const layouts = layoutNodosRoadmap(grupo.nodos);
  const alto = Math.max(420, (layouts.at(-1)?.y ?? ROADMAP_TOP_Y) + 130);
  const nodoActivoSegmentoId =
    faseTransicion === "arrived" ? nodoDestinoId : faseTransicion === "idle" ? nodoActivoGlobalId : null;

  return (
    <div
      className="roadmap-stage relative z-20 mx-auto hidden w-full max-w-5xl overflow-visible lg:block"
      style={{ width: ROADMAP_STAGE_WIDTH, maxWidth: "100%", height: alto }}
    >
      {layouts.map((layout) => (
        <AssetEstacion key={`asset-${layout.nodo.id}`} layout={layout} variant="desktop" />
      ))}

      <CaminoRoadmap
        layouts={layouts}
        indiceModulo={indiceModulo}
        nodoActivoId={nodoActivoSegmentoId}
      />

      {layouts.map((layout) => {
        const estadoForzado = estadoVisualTransicion(
          layout.nodo.id,
          nodoTransicionId,
          nodoDestinoId,
          faseTransicion,
        );
        const animandoCompletado =
          layout.nodo.id === nodoTransicionId && faseTransicion === "completing";
        const sosteniendoCompletado =
          layout.nodo.id === nodoTransicionId && faseTransicion === "holding";
        const llegandoDestino =
          layout.nodo.id === nodoDestinoId && faseTransicion === "arrived";
        const transicionActiva = faseTransicion !== "idle";
        const esNodoActivoVisual =
          (!transicionActiva && layout.nodo.id === nodoActivoGlobalId) ||
          estadoForzado === "activo";
        const mostrarAvatar =
          (!transicionActiva && layout.nodo.id === nodoActivoGlobalId) ||
          (faseTransicion === "arrived" && layout.nodo.id === nodoDestinoId);
        const nodoEtiqueta = nodoParaFaseVisual(layout.nodo, estadoForzado);
        const gapNodoTexto = 26;

        return (
          <div key={`nodo-${layout.nodo.id}`} className="absolute inset-0 overflow-visible">
            <div
              id={`roadmap-node-desktop-${layout.nodo.id}`}
              data-roadmap-node-id={layout.nodo.id}
              data-roadmap-node={layout.nodo.id}
              className={cn(
                "absolute z-30 overflow-visible",
                animandoCompletado && "roadmap-node-just-completed",
                sosteniendoCompletado && "roadmap-node-completed-hold",
                llegandoDestino && "roadmap-node-next-highlight",
              )}
              style={{
                left: layout.x - ANILLO / 2,
                top: layout.y - ANILLO / 2,
                width: ANILLO,
                height: ANILLO,
              }}
            >
              <NodoEnlace
                nodo={layout.nodo}
                variant="desktop"
                indiceLeccion={layout.indiceLeccion}
                indiceEnModulo={layout.indice}
                totalModulo={grupo.nodos.length}
                indiceModulo={indiceModulo}
                esActivo={esNodoActivoVisual}
                estadoVisualForzado={estadoForzado}
                soloIcono
              />
              {mostrarAvatar && <AvatarRoadmap variant="desktop" />}
            </div>

            <div
              className={cn(
                "absolute z-40 w-[240px]",
                layout.nodo.bloqueado && "opacity-[0.88]",
              )}
              style={
                layout.textoALaIzquierda
                  ? {
                      left: layout.x - ANILLO / 2 - gapNodoTexto,
                      top: layout.y,
                      transform: "translate(-100%, -50%)",
                    }
                  : {
                      left: layout.x + ANILLO / 2 + gapNodoTexto,
                      top: layout.y,
                      transform: "translateY(-50%)",
                    }
              }
            >
              <EtiquetaNodo
                nodo={nodoEtiqueta}
                alineacion={layout.textoALaIzquierda ? "right" : "left"}
                esActivo={esNodoActivoVisual}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IndicadorProgresoModulo({
  indiceModulo,
  progreso,
}: {
  indiceModulo: number;
  progreso: ProgresoModulo;
}) {
  const colorModulo = colorModuloPorIndice(indiceModulo);

  return (
    <div className="mt-4 w-full max-w-md">
      <div
        className={cn(
          "inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full border px-4 py-2 text-sm shadow-sm backdrop-blur-sm",
          progreso.completo
            ? "border-emerald-400/35 bg-emerald-50/80 text-emerald-900 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100"
            : "border-cyan-300/35 bg-white/70 text-slate-900 dark:border-cyan-300/20 dark:bg-white/5 dark:text-white",
        )}
      >
        {progreso.completo && <Check className="size-4 shrink-0" aria-hidden="true" />}
        <span className="font-semibold">Módulo {indiceModulo + 1}</span>
        <span className={cn("text-muted-foreground", progreso.completo && "text-emerald-700 dark:text-emerald-200")}>
          · {progreso.completados}/{progreso.total} completadas
        </span>
      </div>

      <div
        aria-hidden="true"
        className="mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-200/70 shadow-inner dark:bg-white/10"
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#2FB9A5,#4FC9B3,#91DC00)] transition-[width] duration-500"
          style={{
            width: `${progreso.porcentaje}%`,
            background: progreso.completo
              ? `linear-gradient(90deg, ${colorModulo.inicio}, ${colorModulo.final})`
              : undefined,
          }}
        />
      </div>
    </div>
  );
}

function NavegacionModulosRoadmap({
  grupos,
  indicesDisponibles,
  indiceModuloVisible,
  onSeleccionarModulo,
}: {
  grupos: GrupoRuta[];
  indicesDisponibles: number[];
  indiceModuloVisible: number;
  onSeleccionarModulo: (indiceModulo: number) => void;
}) {
  if (indicesDisponibles.length <= 1) return null;

  return (
    <nav
      aria-label="Navegacion de modulos"
      className="relative z-40 mb-8 w-full overflow-x-auto overscroll-x-contain pb-2"
    >
      <div className="mx-auto flex w-max max-w-full items-start justify-center gap-2 px-1 sm:gap-3">
        {indicesDisponibles.map((indiceModulo, indiceDisponible) => {
          const grupo = grupos[indiceModulo]!;
          const progreso = calcularProgresoModulo(grupo.nodos);
          const colorModulo = colorModuloPorIndice(indiceModulo);
          const visible = indiceModulo === indiceModuloVisible;
          const label = `Modulo ${indiceModulo + 1}`;
          const ariaLabel = progreso.completo
            ? `Ver ${label}. Modulo completado`
            : `Ver ${label}`;

          return (
            <div key={grupo.moduloId} className="flex items-start gap-2 sm:gap-3">
              {indiceDisponible > 0 && (
                <span
                  aria-hidden="true"
                  className="mt-[18px] h-px w-5 rounded-full bg-slate-300/80 dark:bg-white/20 sm:w-8"
                />
              )}
              <button
                type="button"
                aria-current={visible ? "step" : undefined}
                aria-label={ariaLabel}
                title={`${label} · ${grupo.titulo}`}
                onClick={() => onSeleccionarModulo(indiceModulo)}
                className={cn(
                  "group flex min-w-10 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-500 transition-[color,transform] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:text-slate-300",
                  visible && "scale-105 text-[#071B30] dark:text-white",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full border bg-white shadow-sm transition-[border-color,box-shadow,transform,background-color] duration-300 dark:bg-white/8",
                    visible &&
                      "size-9 border-[#22D3EE] bg-[#071B30] text-white shadow-[0_0_18px_rgba(34,211,238,0.35)]",
                    !visible &&
                      progreso.completo &&
                      "text-white shadow-[0_0_12px_rgba(6,17,32,0.08)]",
                    !visible &&
                      !progreso.completo &&
                      "border-slate-300 text-slate-400 dark:border-white/20",
                  )}
                  style={
                    !visible && progreso.completo
                      ? {
                          borderColor: `${colorModulo.final}cc`,
                          background: `linear-gradient(to bottom right, ${colorModulo.inicio}, ${colorModulo.final})`,
                        }
                      : undefined
                  }
                >
                  {progreso.completo ? <Check className="size-4" aria-hidden="true" /> : null}
                </span>
                <span>{indiceModulo + 1}</span>
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function CierreModulo({
  indiceModulo,
  esUltimoModulo,
  indiceModuloDestino,
  onContinuarModulo,
}: {
  indiceModulo: number;
  esUltimoModulo: boolean;
  indiceModuloDestino: number | null;
  onContinuarModulo: (indiceModulo: number) => void;
}) {
  const titulo = esUltimoModulo ? "Último módulo completado" : "Módulo completado";
  const descripcion = esUltimoModulo
    ? "Has finalizado todos los módulos del programa."
    : "Has completado todas las lecciones y evaluaciones de este módulo.";

  return (
    <div className="relative z-30 mx-auto mt-10 w-full max-w-md rounded-2xl border border-emerald-400/25 bg-white/70 px-5 py-4 text-center shadow-sm backdrop-blur-sm dark:bg-white/5">
      <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.28)]">
        <Check className="size-5" aria-hidden="true" />
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">{titulo}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{descripcion}</p>

      {!esUltimoModulo && indiceModuloDestino !== null && (
        <button
          type="button"
          onClick={() => onContinuarModulo(indiceModuloDestino)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#061120] px-4 py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-300 hover:bg-[#123A32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto dark:bg-[#91DC00] dark:text-[#061120]"
        >
          Continuar al Módulo {indiceModulo + 2}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function FigurasRoadmapDecorativas() {
  return (
    <>
      <svg
        aria-hidden="true"
        className="roadmap-vectors pointer-events-none absolute -left-14 top-32 z-0 aspect-square w-[140px] opacity-30 sm:-left-20 sm:w-[190px] lg:-left-24 lg:w-[260px]"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <g
          fill="none"
          stroke="rgba(100, 130, 155, 0.22)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        >
          <polygon points="8,68 48,10 92,42 66,92" fill="rgba(130, 160, 185, 0.08)" />
          <line x1="12" y1="18" x2="82" y2="88" />
          <line x1="24" y1="8" x2="24" y2="90" />
          <path d="M34 28 l12 12 M46 28 l-12 12" />
          <path d="M18 62 l10 10 M28 62 l-10 10" />
        </g>
      </svg>

      <svg
        aria-hidden="true"
        className="roadmap-vectors pointer-events-none absolute -right-12 top-[28rem] z-0 aspect-[3/4] w-[140px] opacity-30 sm:-right-16 sm:w-[190px] lg:-right-20 lg:w-[220px]"
        viewBox="0 0 90 120"
        preserveAspectRatio="xMidYMid meet"
      >
        <g
          fill="none"
          stroke="rgba(100, 130, 155, 0.2)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        >
          <polygon points="8,18 76,8 84,88 30,114" fill="rgba(130, 160, 185, 0.06)" />
          <line x1="16" y1="4" x2="78" y2="112" />
          <line x1="70" y1="8" x2="70" y2="116" />
          <line x1="12" y1="54" x2="84" y2="54" />
          <path d="M45 28 l12 12 M57 28 l-12 12" />
          <path d="M30 78 l10 10 M40 78 l-10 10" />
        </g>
      </svg>

      <svg
        aria-hidden="true"
        className="roadmap-vectors pointer-events-none absolute -left-10 bottom-40 z-0 aspect-square w-[140px] opacity-30 sm:-left-14 sm:w-[190px] lg:-left-16 lg:w-[240px]"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <polygon
          points="8,58 48,8 92,30 72,92 18,84"
          fill="rgba(130, 160, 185, 0.07)"
          stroke="rgba(110, 140, 165, 0.14)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <g fill="none" stroke="rgba(100, 130, 155, 0.2)" strokeWidth="1">
          <line x1="10" y1="18" x2="88" y2="86" />
          <line x1="34" y1="5" x2="34" y2="94" />
          <path d="M52 46 l12 12 M64 46 l-12 12" />
        </g>
      </svg>
    </>
  );
}

/** Contenedor raíz: fondo decorativo a ancho completo del área principal + contenido centrado. */
export function VistaRoadmap({ children }: { children: React.ReactNode }) {
  return (
    <section className="roadmap-section relative isolate z-0 w-full min-w-0 overflow-x-clip lg:overflow-x-visible">
      <div
        aria-hidden="true"
        className="roadmap-background pointer-events-none absolute inset-0 z-0"
      />
      <div
        aria-hidden="true"
        className="roadmap-dots pointer-events-none absolute inset-0 z-0"
      />
      <div
        aria-hidden="true"
        className="roadmap-shapes pointer-events-none absolute inset-0 z-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-16 bg-gradient-to-b from-[#f4f9f9] via-[#f4f9f9]/40 to-transparent dark:from-[#061120] dark:via-[#061120]/40"
      />
      <FigurasRoadmapDecorativas />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-12">
        {children}
      </div>
    </section>
  );
}

export function RutaAprendizaje({
  grupos,
  focoNodoId,
  transicionNodoId,
  legacy = false,
}: {
  grupos: GrupoRuta[];
  focoNodoId?: string;
  transicionNodoId?: string;
  legacy?: boolean;
}) {
  const nodosPlanos = useMemo(() => aplanarNodosRoadmap(grupos), [grupos]);
  const mapaCompletadosPrevio = useRef<Map<string, boolean> | null>(null);
  const [nodoTransicionId, setNodoTransicionId] = useState<string | null>(null);
  const [nodoDestinoId, setNodoDestinoId] = useState<string | null>(null);
  const [faseTransicion, setFaseTransicion] = useState<FaseTransicionRoadmap>("idle");
  const [movimientoAvatar, setMovimientoAvatar] = useState<MovimientoAvatarRoadmap | null>(null);
  const [indiceModuloVisible, setIndiceModuloVisible] = useState(() =>
    indiceModuloInicial(grupos, transicionNodoId, focoNodoId),
  );
  const [moduloEnCambio, setModuloEnCambio] = useState(false);
  const inicioModuloRef = useRef<HTMLDivElement>(null);
  const cambioModuloTimeoutRef = useRef<number | null>(null);

  function desplazarAInicioModulo() {
    const reducido = prefiereMovimientoReducido();
    window.requestAnimationFrame(() => {
      inicioModuloRef.current?.scrollIntoView({
        behavior: reducido ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  function seleccionarModulo(indiceModulo: number) {
    const grupoDestino = grupos[indiceModulo];
    if (!grupoDestino || !moduloDisponible(grupoDestino)) return;

    if (cambioModuloTimeoutRef.current !== null) {
      window.clearTimeout(cambioModuloTimeoutRef.current);
      cambioModuloTimeoutRef.current = null;
    }

    if (indiceModulo === indiceModuloVisible) {
      desplazarAInicioModulo();
      return;
    }

    const reducido = prefiereMovimientoReducido();
    const aplicarCambio = () => {
      cambioModuloTimeoutRef.current = null;
      setIndiceModuloVisible(indiceModulo);
      setModuloEnCambio(false);
      desplazarAInicioModulo();
    };

    setModuloEnCambio(true);

    if (reducido) {
      aplicarCambio();
      return;
    }

    cambioModuloTimeoutRef.current = window.setTimeout(aplicarCambio, 220);
  }

  useEffect(() => {
    return () => {
      if (cambioModuloTimeoutRef.current !== null) {
        window.clearTimeout(cambioModuloTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const indiceDeseado = indiceModuloInicial(grupos, transicionNodoId, focoNodoId);

    setIndiceModuloVisible((actual) => {
      const grupoActual = grupos[actual];
      const debeSeguirParametro = Boolean(transicionNodoId || focoNodoId);

      if (!grupoActual || (debeSeguirParametro && actual !== indiceDeseado)) {
        return indiceDeseado;
      }

      if (!moduloDisponible(grupoActual) && actual !== indiceDeseado) {
        return indiceDeseado;
      }

      return actual;
    });
  }, [focoNodoId, grupos, transicionNodoId]);

  useEffect(() => {
    if (legacy) return;

    const completadosActuales = mapaCompletados(grupos);
    const completadosPrevios = mapaCompletadosPrevio.current;
    let nodoCompletadoId: string | null = null;
    const nodoParametroValido =
      transicionNodoId && nodosPlanos.some(({ nodo }) => nodo.id === transicionNodoId)
        ? transicionNodoId
        : null;

    if (nodoParametroValido) {
      nodoCompletadoId = nodoParametroValido;
    } else if (completadosPrevios) {
      for (const { nodo } of nodosPlanos) {
        if (!completadosPrevios.get(nodo.id) && completadosActuales.get(nodo.id)) {
          nodoCompletadoId = nodo.id;
          break;
        }
      }
    }

    if (transicionNodoId) {
      limpiarParametrosRoadmap(["roadmapTransition"]);
    }

    mapaCompletadosPrevio.current = completadosActuales;

    if (!nodoCompletadoId) return;

    const nodoCompletadoTransicionId = nodoCompletadoId;
    const nodoOrigen = nodosPlanos.find(({ nodo }) => nodo.id === nodoCompletadoTransicionId);
    if (!nodoOrigen || nodoOrigen.indiceGrupo !== indiceModuloVisible) return;

    const nodoDestinoCandidato = siguienteNodoDisponible(nodosPlanos, nodoCompletadoTransicionId);
    const nodoDestinoPlano = nodoDestinoCandidato
      ? nodosPlanos.find(({ nodo }) => nodo.id === nodoDestinoCandidato.id)
      : null;
    const nodoDestino =
      nodoDestinoPlano?.indiceGrupo === nodoOrigen.indiceGrupo ? nodoDestinoCandidato : null;
    const reducido = prefiereMovimientoReducido();
    const pausaDespuesScroll = reducido ? 0 : 320;
    const duracionCompletado = reducido ? 120 : 1150;
    const duracionHold = reducido ? 250 : 650;
    const moduloCompletado =
      nodoOrigen
        ? calcularProgresoModulo(grupos[nodoOrigen.indiceGrupo]?.nodos ?? []).completo
        : false;
    const pausaCierreModulo = reducido ? 0 : moduloCompletado ? 850 : 0;
    const duracionMovimiento = reducido ? 0 : 1100;
    const duracionLlegada = reducido ? 250 : 1000;
    let cancelado = false;

    async function ejecutarTransicion() {
      setNodoTransicionId(nodoCompletadoTransicionId);
      setNodoDestinoId(nodoDestino?.id ?? null);
      setMovimientoAvatar(null);
      setFaseTransicion("scrolling-to-origin");

      await esperarDoblePintado();
      if (cancelado) return;

      const estacionOrigen = await centrarNodoRoadmap(nodoCompletadoTransicionId, reducido);
      if (!estacionOrigen) {
        setFaseTransicion("idle");
        setNodoTransicionId(null);
        return;
      }

      await esperarFinScroll(estacionOrigen, reducido);
      if (cancelado) return;

      setFaseTransicion("waiting");
      await wait(pausaDespuesScroll);
      if (cancelado) return;

      setFaseTransicion("completing");
      await wait(duracionCompletado);
      if (cancelado) return;

      setFaseTransicion("holding");
      await wait(duracionHold);
      if (cancelado) return;

      if (!nodoDestino) {
        if (pausaCierreModulo > 0) {
          await wait(pausaCierreModulo);
          if (cancelado) return;
        }

        setFaseTransicion("idle");
        setNodoTransicionId(null);
        setNodoDestinoId(null);
        setMovimientoAvatar(null);
        return;
      }

      if (pausaCierreModulo > 0) {
        await wait(pausaCierreModulo);
        if (cancelado) return;
      }

      setFaseTransicion("moving");
      await esperarDoblePintado();
      if (cancelado) return;

      const origen = await esperarElementoNodoRoadmap(nodoCompletadoTransicionId);
      const destino = await esperarElementoNodoRoadmap(nodoDestino.id);

      if (!origen || !destino) {
        setFaseTransicion("idle");
        setNodoTransicionId(null);
        setNodoDestinoId(null);
        setMovimientoAvatar(null);
        return;
      }

      setMovimientoAvatar({
        origen: puntoCentroElemento(origen),
        destino: puntoCentroElemento(destino),
        activo: false,
        duracionMs: duracionMovimiento,
      });

      await esperarDoblePintado();
      if (cancelado) return;

      setMovimientoAvatar((actual) => (actual ? { ...actual, activo: true } : actual));

      if (!reducido) {
        await wait(duracionMovimiento);
      }

      if (cancelado) return;

      setMovimientoAvatar(null);
      setFaseTransicion("scrolling-to-destination");

      const estacionDestino = await centrarNodoRoadmap(nodoDestino.id, reducido);
      if (estacionDestino) {
        await esperarFinScroll(estacionDestino, reducido, reducido ? 0 : 650);
      }
      if (cancelado) return;

      setFaseTransicion("arrived");
      await wait(duracionLlegada);
      if (cancelado) return;

      setFaseTransicion("idle");
      setNodoTransicionId(null);
      setNodoDestinoId(null);
      setMovimientoAvatar(null);
    }

    void ejecutarTransicion();

    return () => {
      cancelado = true;
      setMovimientoAvatar(null);
    };
  }, [grupos, indiceModuloVisible, legacy, nodosPlanos, transicionNodoId]);

  useEffect(() => {
    if (legacy || transicionNodoId || !focoNodoId) return;

    const nodoFocoPlano = nodosPlanos.find(({ nodo }) => nodo.id === focoNodoId) ?? null;
    const nodoFoco = nodoFocoPlano?.nodo ?? null;

    limpiarParametrosRoadmap(["roadmapFocus"]);

    if (!nodoFoco) return;
    if (nodoFocoPlano?.indiceGrupo !== indiceModuloVisible) return;

    const nodoFocoRoadmapId = nodoFoco.id;
    const resaltarFoco = !nodoFoco.completado && !nodoFoco.bloqueado;
    const reducido = prefiereMovimientoReducido();
    const duracionLlegada = reducido ? 250 : 1000;
    let cancelado = false;

    async function enfocarNodoActivo() {
      setNodoTransicionId(null);
      setNodoDestinoId(resaltarFoco ? nodoFocoRoadmapId : null);
      setMovimientoAvatar(null);
      setFaseTransicion("scrolling-to-destination");

      await esperarDoblePintado();
      if (cancelado) return;

      const estacionFoco = await centrarNodoRoadmap(nodoFocoRoadmapId, reducido);
      if (estacionFoco) {
        await esperarFinScroll(estacionFoco, reducido, reducido ? 0 : 650);
      }
      if (cancelado) return;

      setFaseTransicion("arrived");
      await wait(duracionLlegada);
      if (cancelado) return;

      setFaseTransicion("idle");
      setNodoDestinoId(null);
      setMovimientoAvatar(null);
    }

    void enfocarNodoActivo();

    return () => {
      cancelado = true;
      setMovimientoAvatar(null);
    };
  }, [focoNodoId, indiceModuloVisible, legacy, nodosPlanos, transicionNodoId]);

  if (!legacy) {
    const nodoActivoGlobalId = idNodoActivoGlobal(grupos);
    const indicesDisponibles = grupos
      .map((grupo, indice) => ({ grupo, indice }))
      .filter(({ grupo }) => moduloDisponible(grupo))
      .map(({ indice }) => indice);
    const indiceSeguro =
      grupos[indiceModuloVisible] && moduloDisponible(grupos[indiceModuloVisible]!)
        ? indiceModuloVisible
        : indiceModuloInicial(grupos, transicionNodoId, focoNodoId);
    const grupoVisible = grupos[indiceSeguro];

    if (!grupoVisible) return null;

    const ultimoNodoGrupo = grupoVisible.nodos.at(-1)?.id;
    const nodoActivoSegmentoId =
      faseTransicion === "arrived"
        ? nodoDestinoId
        : faseTransicion === "idle"
          ? nodoActivoGlobalId
          : null;
    const layoutsMobile = layoutNodosRoadmap(grupoVisible.nodos);
    const progresoModulo = calcularProgresoModulo(grupoVisible.nodos);
    const esUltimoModulo = indiceSeguro === grupos.length - 1;
    const indiceModuloDestino = siguienteIndiceModuloDisponible(grupos, indiceSeguro);

    return (
      <>
        <AvatarRoadmapEnMovimiento movimiento={movimientoAvatar} />
        <div
          ref={inicioModuloRef}
          className="relative z-10 w-full scroll-mt-20 overflow-x-clip lg:overflow-x-visible"
        >
          <NavegacionModulosRoadmap
            grupos={grupos}
            indicesDisponibles={indicesDisponibles}
            indiceModuloVisible={indiceSeguro}
            onSeleccionarModulo={seleccionarModulo}
          />

          <div
            key={grupoVisible.moduloId}
            className={cn(
              "relative mb-10 w-full transition-[opacity,transform] duration-300 last:mb-0 lg:mb-14",
              moduloEnCambio && "translate-y-3 opacity-0",
            )}
          >
              <div className="relative z-30 mb-10 w-full">
                <h2 className="w-full max-w-[420px] whitespace-normal break-words text-2xl font-bold leading-tight text-foreground">
                  {grupoVisible.titulo}
                </h2>
                <IndicadorProgresoModulo
                  indiceModulo={indiceSeguro}
                  progreso={progresoModulo}
                />
              </div>

              <div className="relative z-20 mx-auto flex w-full max-w-md flex-col items-center px-5 lg:hidden">
                {grupoVisible.nodos.map((nodo, indiceEnModulo) => {
                  const idx = indiceLeccionEnNodo(grupoVisible.nodos, indiceEnModulo);
                  const esAvatarActual = nodo.id === nodoActivoGlobalId;
                  const layout = layoutsMobile[indiceEnModulo]!;
                  const estadoForzado = estadoVisualTransicion(
                    nodo.id,
                    nodoTransicionId,
                    nodoDestinoId,
                    faseTransicion,
                  );
                  const animandoCompletado =
                    nodo.id === nodoTransicionId && faseTransicion === "completing";
                  const sosteniendoCompletado =
                    nodo.id === nodoTransicionId && faseTransicion === "holding";
                  const llegandoDestino =
                    nodo.id === nodoDestinoId && faseTransicion === "arrived";
                  const nodoEtiqueta = nodoParaFaseVisual(nodo, estadoForzado);
                  const transicionActiva = faseTransicion !== "idle";
                  const esActivo =
                    (!transicionActiva && nodo.id === nodoActivoGlobalId) ||
                    estadoForzado === "activo";
                  const segmentoMovilActivo =
                    grupoVisible.nodos[indiceEnModulo + 1]?.id === nodoActivoSegmentoId;
                  const mostrarAvatar =
                    (!transicionActiva && esAvatarActual) ||
                    (faseTransicion === "arrived" && nodo.id === nodoDestinoId);

                  return (
                    <div key={`${nodo.id}-mobile`} className="relative flex w-full flex-col items-center">
                      <AssetEstacion layout={layout} variant="mobile" />
                      <div
                        id={`roadmap-node-mobile-${nodo.id}`}
                        data-roadmap-node-id={nodo.id}
                        data-roadmap-node={nodo.id}
                        className={cn(
                          "relative",
                          animandoCompletado && "roadmap-node-just-completed",
                          sosteniendoCompletado && "roadmap-node-completed-hold",
                          llegandoDestino && "roadmap-node-next-highlight",
                        )}
                      >
                        <NodoEnlace
                          nodo={nodo}
                          variant="mobile"
                          indiceLeccion={idx}
                          indiceEnModulo={indiceEnModulo}
                          totalModulo={grupoVisible.nodos.length}
                          indiceModulo={indiceSeguro}
                          esActivo={esActivo}
                          estadoVisualForzado={estadoForzado}
                          soloIcono
                        />
                        {mostrarAvatar && <AvatarRoadmap variant="mobile" />}
                      </div>
                      <div className="relative z-30 mt-3 w-full">
                        <EtiquetaNodo nodo={nodoEtiqueta} alineacion="center" esActivo={esActivo} />
                      </div>
                      {nodo.id !== ultimoNodoGrupo && (
                        <div
                          aria-hidden="true"
                          className={cn(
                            "roadmap-connector relative z-10 my-4 h-16",
                            segmentoMovilActivo && "roadmap-connector-active-segment",
                            nodo.completado
                              ? "roadmap-connector-completed"
                              : "roadmap-connector-pending",
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <ModuloRoadmapDesktop
                grupo={grupoVisible}
                indiceModulo={indiceSeguro}
                nodoActivoGlobalId={nodoActivoGlobalId}
                nodoTransicionId={nodoTransicionId}
                nodoDestinoId={nodoDestinoId}
                faseTransicion={faseTransicion}
              />

              {progresoModulo.completo && (
                <CierreModulo
                  indiceModulo={indiceSeguro}
                  esUltimoModulo={esUltimoModulo}
                  indiceModuloDestino={indiceModuloDestino}
                  onContinuarModulo={seleccionarModulo}
                />
              )}
            </div>
        </div>
      </>
    );
  }

  const COLUMNAS = 3;
  const PASO_X = 110;
  const PASO_Y = 130;
  const ALTO_TITULO = 50;
  const MARGEN_X = NODO / 2 + 12;
  const ANCHO_RUTA = MARGEN_X * 2 + (COLUMNAS - 1) * PASO_X;

  interface Posicion {
    cx: number;
    cy: number;
    nodo: NodoRuta;
    indiceLeccion: number;
    indiceEnModulo: number;
    totalModulo: number;
    indiceModulo: number;
    esActivo: boolean;
  }

  const titulos: { texto: string; y: number }[] = [];
  const nodos: Posicion[] = [];

  let y = ALTO_TITULO / 2;

  for (let indiceModulo = 0; indiceModulo < grupos.length; indiceModulo += 1) {
    const grupo = grupos[indiceModulo]!;
    titulos.push({ texto: grupo.titulo, y });
    y += ALTO_TITULO;

    const nodoActivoId = idNodoActivoModulo(grupo.nodos);
    let indiceLeccion = 0;
    let indiceEnModulo = 0;
    let columna = 0;
    let direccion = 1;

    for (const nodo of grupo.nodos) {
      const idx = nodo.tipo === "leccion" ? indiceLeccion++ : 0;
      nodos.push({
        cx: MARGEN_X + columna * PASO_X,
        cy: y,
        nodo,
        indiceLeccion: idx,
        indiceEnModulo,
        totalModulo: grupo.nodos.length,
        indiceModulo,
        esActivo: nodo.id === nodoActivoId,
      });
      indiceEnModulo += 1;
      y += PASO_Y;

      columna += direccion;
      if (columna > COLUMNAS - 1) {
        columna = COLUMNAS - 2;
        direccion = -1;
      } else if (columna < 0) {
        columna = 1;
        direccion = 1;
      }
    }
    y += ALTO_TITULO / 2;
  }

  const alto = y;

  return (
    <div className="relative mx-auto" style={{ width: ANCHO_RUTA, height: alto }}>
      <svg className="absolute inset-0" width={ANCHO_RUTA} height={alto} aria-hidden>
        <polyline
          points={nodos.map((n) => `${n.cx},${n.cy}`).join(" ")}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {titulos.map((t, i) => (
        <div
          key={`titulo-${i}`}
          className="absolute left-0 right-0 px-2 text-center text-sm font-semibold text-muted-foreground"
          style={{ top: t.y - ALTO_TITULO / 2 - 8 }}
        >
          {t.texto}
        </div>
      ))}

      {nodos.map(({ cx, cy, nodo, indiceLeccion, indiceEnModulo, totalModulo, indiceModulo, esActivo }) => (
        <NodoLegacy
          key={nodo.id}
          cx={cx}
          cy={cy}
          nodo={nodo}
          indiceLeccion={indiceLeccion}
          indiceEnModulo={indiceEnModulo}
          totalModulo={totalModulo}
          indiceModulo={indiceModulo}
          esActivo={esActivo}
        />
      ))}
    </div>
  );
}

function EtiquetaNodo({
  nodo,
  alineacion,
  esActivo = false,
  tipoRama = "compacta",
}: {
  nodo: NodoRuta;
  alineacion: AlineacionEtiqueta;
  esActivo?: boolean;
  tipoRama?: "simple" | "compacta";
}) {
  if (tipoRama === "compacta" && alineacion !== "center") {
    return (
      <div
        className={cn(
          "roadmap-branch-label relative flex min-h-14 items-center gap-3 rounded-xl border border-slate-200/80 bg-white/82 px-4 py-3 text-sm font-semibold leading-snug text-slate-900 shadow-[0_10px_28px_rgba(6,17,32,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/45 dark:text-white",
          alineacion === "right" && "flex-row-reverse text-right",
          nodo.tipo === "evaluacion" && "border-[#d7ad30]/35 bg-[#fff8df]/85 text-[#5c4a1a] dark:bg-[#34270a]/50 dark:text-[#f3df96]",
          nodo.bloqueado && "bg-slate-100/82 text-slate-500 dark:bg-slate-900/55 dark:text-slate-400",
          esActivo &&
            "roadmap-active-label border-[#22D3EE]/60 bg-white/94 text-[#071B30] shadow-[0_14px_34px_rgba(6,17,32,0.12),0_0_22px_rgba(45,212,191,0.18)] dark:border-[#22D3EE]/45 dark:bg-[#071B30]/84 dark:text-white",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "roadmap-branch-line absolute top-1/2 h-px w-7 border-t border-dashed border-slate-300",
            alineacion === "left" ? "-left-7" : "-right-7",
            nodo.completado && "border-[#13a476]",
            nodo.tipo === "evaluacion" && "border-[#d7ad30]",
            nodo.bloqueado && "border-slate-300",
            esActivo && "border-[#22D3EE]",
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full bg-[#e9f8f5] text-[#087c72]",
            nodo.completado && "bg-[#13a476] text-white",
            nodo.tipo === "evaluacion" && "rounded-lg bg-[#d7ad30] text-white",
            nodo.bloqueado && "bg-slate-200 text-slate-500",
            esActivo && "bg-[#0B2A46] text-[#67E8F9] shadow-[0_0_14px_rgba(45,212,191,0.3)]",
          )}
        >
          {nodo.completado ? (
            <Check className="size-4" />
          ) : nodo.bloqueado ? (
            <Lock className="size-4" />
          ) : nodo.tipo === "evaluacion" ? (
            <ClipboardCheck className="size-4" />
          ) : (
            <span className="size-2 rounded-full bg-current" />
          )}
        </span>
        <span className="min-w-0 whitespace-normal break-words">{nodo.titulo}</span>
      </div>
    );
  }

  return (
    <p
      className={cn(
        "w-full min-w-0 max-w-[320px] whitespace-normal break-words text-base font-medium leading-relaxed text-foreground",
        nodo.tipo === "evaluacion" && "text-[#5C4A1A] dark:text-[#E7D28A]",
        alineacion === "left" && "text-left",
        alineacion === "center" && "mx-auto text-center",
        alineacion === "right" && "text-right",
        esActivo &&
          "rounded-xl border border-[#22D3EE]/45 bg-white/90 px-4 py-3 text-[#071B30] shadow-[0_12px_28px_rgba(6,17,32,0.1),0_0_18px_rgba(45,212,191,0.16)] dark:bg-[#071B30]/80 dark:text-white",
      )}
    >
      {nodo.titulo}
    </p>
  );
}

function NodoEnlace({
  nodo,
  variant,
  indiceLeccion,
  indiceEnModulo,
  totalModulo,
  indiceModulo,
  esActivo,
  estadoVisualForzado,
  soloIcono = false,
}: {
  nodo: NodoRuta;
  variant: VarianteRoadmap;
  indiceLeccion: number;
  indiceEnModulo: number;
  totalModulo: number;
  indiceModulo: number;
  esActivo: boolean;
  estadoVisualForzado?: EstadoEstacion;
  soloIcono?: boolean;
}) {
  const contenido = (
    <>
      <NucleoEstacion
        nodo={nodo}
        variant={variant}
        indiceLeccion={indiceLeccion}
        indiceEnModulo={indiceEnModulo}
        totalModulo={totalModulo}
        indiceModulo={indiceModulo}
        esActivo={esActivo}
        estadoVisualForzado={estadoVisualForzado}
      />
      {!soloIcono && (
        <span className="w-32 whitespace-normal break-words text-center text-xs font-medium leading-tight text-foreground">
          {nodo.titulo}
        </span>
      )}
    </>
  );

  const clase = cn(
    "relative z-20 flex flex-col items-center gap-1.5",
    soloIcono && "shrink-0 gap-0",
    nodo.bloqueado && "cursor-not-allowed opacity-80",
  );

  return nodo.bloqueado ? (
    <div className={clase}>{contenido}</div>
  ) : (
    <Link href={nodo.href} className={clase}>
      {contenido}
    </Link>
  );
}

function NodoLegacy({
  cx,
  cy,
  nodo,
  indiceLeccion,
  indiceEnModulo,
  totalModulo,
  indiceModulo,
  esActivo,
}: {
  cx: number;
  cy: number;
  nodo: NodoRuta;
  indiceLeccion: number;
  indiceEnModulo: number;
  totalModulo: number;
  indiceModulo: number;
  esActivo: boolean;
}) {
  return (
    <div
      className="absolute z-10 flex flex-col items-center gap-1.5"
      style={{ left: cx - ANILLO / 2, top: cy - ANILLO / 2, width: ANILLO }}
    >
      <NodoEnlace
        nodo={nodo}
        variant="desktop"
        indiceLeccion={indiceLeccion}
        indiceEnModulo={indiceEnModulo}
        totalModulo={totalModulo}
        indiceModulo={indiceModulo}
        esActivo={esActivo}
      />
    </div>
  );
}
