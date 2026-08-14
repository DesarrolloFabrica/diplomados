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

const ROADMAP_TRANSITION_STORAGE_KEY = "roadmap:last-completed-node";

/** Secuencia fija por módulo: intro → práctica → lectura → actividad. */
const ICONOS_LECCION: LucideIcon[] = [BookOpen, Play, FileText, Wrench];

type EstadoEstacion = "completado" | "activo" | "pendiente" | "bloqueado";
type TipoAssetEstacion = "inicio" | "mid" | "fin" | "quiz";

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

interface TransicionCompletadoStorage {
  cursoId?: string;
  nodoId?: string;
  at?: number;
  timestamp?: number;
}

function idNodoActivoGlobal(grupos: GrupoRuta[]): string | null {
  for (const grupo of grupos) {
    const activo = grupo.nodos.find((nodo) => !nodo.completado && !nodo.bloqueado);
    if (activo) return activo.id;
  }

  return null;
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

function hrefInicioModulo(grupo: GrupoRuta | undefined): string | null {
  if (!grupo) return null;
  return grupo.nodos.find((nodo) => !nodo.bloqueado)?.href ?? grupo.nodos[0]?.href ?? null;
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

function estaSuficientementeVisible(elemento: HTMLElement): boolean {
  const rect = elemento.getBoundingClientRect();
  const altoViewport = window.innerHeight || document.documentElement.clientHeight;
  const margenSuperior = altoViewport * 0.18;
  const margenInferior = altoViewport * 0.82;

  return rect.top >= margenSuperior && rect.bottom <= margenInferior;
}

function contenedorScrollVertical(elemento: HTMLElement): HTMLElement | null {
  let actual = elemento.parentElement;

  while (actual && actual !== document.body && actual !== document.documentElement) {
    const estilos = window.getComputedStyle(actual);
    const overflowY = estilos.overflowY;
    const puedeScroll = /(auto|scroll|overlay)/.test(overflowY);

    if (puedeScroll && actual.scrollHeight > actual.clientHeight) {
      return actual;
    }

    actual = actual.parentElement;
  }

  return null;
}

async function centrarNodoRoadmap(
  nodoId: string,
  reducido: boolean,
  forzar = false,
): Promise<boolean> {
  const elemento = await esperarElementoNodoRoadmap(nodoId);
  if (!elemento) return false;

  if (forzar || !estaSuficientementeVisible(elemento)) {
    const contenedor = contenedorScrollVertical(elemento);
    const rect = elemento.getBoundingClientRect();

    if (contenedor) {
      const rectContenedor = contenedor.getBoundingClientRect();
      const destino = Math.max(
        0,
        contenedor.scrollTop +
          rect.top -
          rectContenedor.top +
          rect.height / 2 -
          contenedor.clientHeight / 2,
      );

      contenedor.scrollTo({
        top: destino,
        behavior: reducido ? "auto" : "smooth",
      });
    } else {
      const altoViewport = window.innerHeight || document.documentElement.clientHeight;
      const destino = Math.max(0, window.scrollY + rect.top + rect.height / 2 - altoViewport / 2);

      window.scrollTo({
        top: destino,
        behavior: reducido ? "auto" : "smooth",
      });
    }

    return true;
  }

  return false;
}

async function centrarNodoRoadmapEstable(
  nodoId: string,
  reducido: boolean,
  forzar = false,
): Promise<boolean> {
  const primerScroll = await centrarNodoRoadmap(nodoId, reducido, forzar);
  await wait(reducido ? 0 : 180);
  const segundoScroll = await centrarNodoRoadmap(nodoId, true, forzar);

  return primerScroll || segundoScroll;
}

function claveTransicionRoadmap(cursoId: string | undefined): string {
  return cursoId ? `roadmap-transition:${cursoId}` : ROADMAP_TRANSITION_STORAGE_KEY;
}

function leerTransicionPendiente(cursoId: string | undefined): string | null {
  if (typeof window === "undefined") return null;

  const claves = [claveTransicionRoadmap(cursoId), ROADMAP_TRANSITION_STORAGE_KEY];

  try {
    const clave = claves.find((item) => window.sessionStorage.getItem(item));
    if (!clave) return null;

    const raw = window.sessionStorage.getItem(clave);
    if (!raw) return null;

    const data = JSON.parse(raw) as TransicionCompletadoStorage;
    const timestamp = data.timestamp ?? data.at;
    const reciente = typeof timestamp === "number" && Date.now() - timestamp < 120_000;
    return reciente && data.nodoId ? data.nodoId : null;
  } catch {
    return null;
  } finally {
    for (const clave of claves) {
      window.sessionStorage.removeItem(clave);
    }
  }
}

function limpiarParametroTransicionRoadmap(): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (!url.searchParams.has("roadmapTransition")) return;

  url.searchParams.delete("roadmapTransition");
  const query = url.searchParams.toString();
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${query ? `?${query}` : ""}${url.hash}`,
  );
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
      "drop-shadow-[0_0_5px_rgba(30,93,142,0.35)]",
    estado === "activo" &&
      esQuiz &&
      "drop-shadow-[0_0_5px_rgba(214,184,93,0.32)]",
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
    borde = "#D6B85D";
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
}: {
  nodo: NodoRuta;
  variant: VarianteRoadmap;
  indiceLeccion: number;
  indiceEnModulo: number;
  totalModulo: number;
  indiceModulo: number;
  esActivo: boolean;
}) {
  const estado = estadoEstacion(nodo, esActivo);
  const progreso = progresoAnilloVisual(estado, indiceEnModulo, totalModulo);
  const esQuiz = nodo.tipo === "evaluacion";
  const Icono = iconoEstacion(nodo, indiceLeccion);
  const colorModulo = colorModuloPorIndice(indiceModulo);
  const nucleoCompletadoModulo = nodo.completado && !esQuiz;

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
        esActivo && "z-30 scale-[1.16]",
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
        <NucleoHexagonal nodo={nodo} variant={variant} esActivo={esActivo} Icono={Icono} />
      ) : (
        <div
          className={cn(
            "station-core relative z-20 flex items-center justify-center rounded-full border-2 shadow-md transition-transform",
            nucleoCompletadoModulo && "text-white",
            esActivo &&
              !nodo.completado &&
              "border-[#4FC9B3]/70 bg-gradient-to-br from-[#0C2240] via-[#153B63] to-[#1E5D8E] text-white shadow-[0_0_8px_rgba(30,93,142,0.35)] hover:scale-105",
            estado === "pendiente" &&
              "border-[#B8D4CE] bg-gradient-to-br from-[#EAF7F5] to-[#D0E8E3] text-[#1A4D45]",
            nodo.bloqueado && "border-slate-300 bg-slate-100 text-slate-400",
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

function CaminoRoadmap({
  layouts,
  indiceModulo,
}: {
  layouts: LayoutNodoRoadmap[];
  indiceModulo: number;
}) {
  if (layouts.length < 2) return null;

  const colorModulo = colorModuloPorIndice(indiceModulo);
  const points = layouts.map((layout) => `${layout.x},${layout.y}`).join(" ");
  const alto = layouts.at(-1)!.y + 96;
  const gradId = `roadmap-path-${indiceModulo}`;

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
    </svg>
  );
}

function CaminoDecoracion({
  layouts,
}: {
  layouts: LayoutNodoRoadmap[];
}) {
  return (
    <>
      {layouts.slice(0, -1).map((layout, indice) => {
        const siguiente = layouts[indice + 1];
        if (!siguiente) return null;

        const midX = (layout.x + siguiente.x) / 2;
        const midY = (layout.y + siguiente.y) / 2;
        const haciaDerecha = siguiente.x > layout.x;

        return (
          <div
            key={`decoracion-${layout.nodo.id}`}
            aria-hidden="true"
            className="pointer-events-none absolute z-20"
            style={{ left: midX - 24, top: midY - 24 }}
          >
            <span
              className={cn(
                "roadmap-route-chip block",
                haciaDerecha ? "rotate-12" : "-rotate-12",
              )}
            />
          </div>
        );
      })}
    </>
  );
}

function ModuloRoadmapDesktop({
  grupo,
  indiceModulo,
  nodoActivoGlobalId,
  nodoCompletadoAnimadoId,
  nodoResaltadoId,
}: {
  grupo: GrupoRuta;
  indiceModulo: number;
  nodoActivoGlobalId: string | null;
  nodoCompletadoAnimadoId: string | null;
  nodoResaltadoId: string | null;
}) {
  const layouts = layoutNodosRoadmap(grupo.nodos);
  const alto = Math.max(420, (layouts.at(-1)?.y ?? ROADMAP_TOP_Y) + 130);
  const nodoActivoModuloId = idNodoActivoModulo(grupo.nodos);

  return (
    <div
      className="roadmap-stage relative z-20 mx-auto hidden w-full max-w-5xl overflow-visible lg:block"
      style={{ width: ROADMAP_STAGE_WIDTH, maxWidth: "100%", height: alto }}
    >
      {layouts.map((layout) => (
        <AssetEstacion key={`asset-${layout.nodo.id}`} layout={layout} variant="desktop" />
      ))}

      <CaminoRoadmap layouts={layouts} indiceModulo={indiceModulo} />
      <CaminoDecoracion layouts={layouts} />

      {layouts.map((layout) => {
        const esNodoResaltado = layout.nodo.id === nodoResaltadoId;
        const mostrarAvatar = layout.nodo.id === nodoActivoGlobalId || esNodoResaltado;
        const gapNodoTexto = 26;

        return (
          <div key={`nodo-${layout.nodo.id}`} className="absolute inset-0 overflow-visible">
            <div
              id={`roadmap-node-desktop-${layout.nodo.id}`}
              data-roadmap-node-id={layout.nodo.id}
              data-roadmap-node={layout.nodo.id}
              className={cn(
                "absolute z-30 overflow-visible",
                layout.nodo.id === nodoCompletadoAnimadoId && "roadmap-node-just-completed",
                esNodoResaltado && "roadmap-node-next-highlight",
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
                esActivo={layout.nodo.id === nodoActivoModuloId || esNodoResaltado}
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
                nodo={layout.nodo}
                alineacion={layout.textoALaIzquierda ? "right" : "left"}
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

function CierreModulo({
  indiceModulo,
  esUltimoModulo,
  hrefSiguienteModulo,
}: {
  indiceModulo: number;
  esUltimoModulo: boolean;
  hrefSiguienteModulo: string | null;
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

      {!esUltimoModulo && hrefSiguienteModulo && (
        <Link
          href={hrefSiguienteModulo}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#061120] px-4 py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-300 hover:bg-[#123A32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto dark:bg-[#91DC00] dark:text-[#061120]"
        >
          Continuar al Módulo {indiceModulo + 2}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
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
  cursoId,
  transicionNodoId,
  legacy = false,
}: {
  grupos: GrupoRuta[];
  cursoId?: string;
  transicionNodoId?: string;
  legacy?: boolean;
}) {
  const nodosPlanos = useMemo(() => aplanarNodosRoadmap(grupos), [grupos]);
  const mapaCompletadosPrevio = useRef<Map<string, boolean> | null>(null);
  const [nodoCompletadoAnimadoId, setNodoCompletadoAnimadoId] = useState<string | null>(null);
  const [nodoResaltadoId, setNodoResaltadoId] = useState<string | null>(null);

  useEffect(() => {
    if (legacy) return;

    const completadosActuales = mapaCompletados(grupos);
    const completadosPrevios = mapaCompletadosPrevio.current;
    let nodoCompletadoId: string | null = null;

    if (completadosPrevios) {
      for (const { nodo } of nodosPlanos) {
        if (!completadosPrevios.get(nodo.id) && completadosActuales.get(nodo.id)) {
          nodoCompletadoId = nodo.id;
          break;
        }
      }
    } else if (
      transicionNodoId &&
      nodosPlanos.some(({ nodo }) => nodo.id === transicionNodoId)
    ) {
      nodoCompletadoId = transicionNodoId;
    } else {
      const nodoPendienteStorage = leerTransicionPendiente(cursoId);
      if (nodoPendienteStorage && completadosActuales.get(nodoPendienteStorage)) {
        nodoCompletadoId = nodoPendienteStorage;
      }
    }

    if (transicionNodoId) {
      limpiarParametroTransicionRoadmap();
    }

    mapaCompletadosPrevio.current = completadosActuales;

    if (!nodoCompletadoId) return;

    const nodoCompletadoTransicionId = nodoCompletadoId;
    const reducido = prefiereMovimientoReducido();
    const nodoCompletadoPlano = nodosPlanos.find(({ nodo }) => nodo.id === nodoCompletadoTransicionId);
    const moduloCompletado = nodoCompletadoPlano
      ? calcularProgresoModulo(grupos[nodoCompletadoPlano.indiceGrupo]?.nodos ?? []).completo
      : false;
    const siguiente = siguienteNodoDisponible(nodosPlanos, nodoCompletadoTransicionId);
    const esperaPostScrollCompletado = reducido ? 0 : 650;
    const duracionCompletado = reducido ? 180 : 1200;
    const pausaAntesSiguiente = reducido ? 0 : moduloCompletado ? 420 : 180;
    const esperaPostScrollSiguiente = reducido ? 0 : 560;
    const duracionResaltado = reducido ? 300 : 1200;
    let cancelado = false;

    async function ejecutarTransicion() {
      await esperarDoblePintado();
      if (cancelado) return;

      await centrarNodoRoadmapEstable(nodoCompletadoTransicionId, reducido, true);
      await wait(esperaPostScrollCompletado);
      if (cancelado) return;

      await centrarNodoRoadmap(nodoCompletadoTransicionId, true, true);
      if (cancelado) return;

      setNodoCompletadoAnimadoId(nodoCompletadoTransicionId);
      await wait(duracionCompletado);
      if (cancelado) return;

      setNodoCompletadoAnimadoId((actual) =>
        actual === nodoCompletadoTransicionId ? null : actual,
      );

      if (!siguiente) return;

      await wait(pausaAntesSiguiente);
      if (cancelado) return;

      await centrarNodoRoadmapEstable(siguiente.id, reducido, true);
      await wait(esperaPostScrollSiguiente);
      if (cancelado) return;

      await centrarNodoRoadmap(siguiente.id, true, true);
      if (cancelado) return;

      setNodoResaltadoId(siguiente.id);
      await wait(duracionResaltado);
      if (cancelado) return;

      setNodoResaltadoId((actual) => (actual === siguiente.id ? null : actual));
    }

    void ejecutarTransicion();

    return () => {
      cancelado = true;
    };
  }, [cursoId, grupos, legacy, nodosPlanos, transicionNodoId]);

  if (!legacy) {
    const nodoActivoGlobalId = idNodoActivoGlobal(grupos);

    return (
      <div className="relative z-10 w-full overflow-x-clip lg:overflow-x-visible">
        {grupos.map((grupo, indiceModulo) => {
          const ultimoNodoGrupo = grupo.nodos.at(-1)?.id;
          const nodoActivoId = idNodoActivoModulo(grupo.nodos);
          const layoutsMobile = layoutNodosRoadmap(grupo.nodos);
          const progresoModulo = calcularProgresoModulo(grupo.nodos);
          const esUltimoModulo = indiceModulo === grupos.length - 1;
          const hrefSiguienteModulo = hrefInicioModulo(grupos[indiceModulo + 1]);

          return (
            <div key={grupo.titulo} className="relative mb-10 w-full last:mb-0 lg:mb-14">
              {indiceModulo > 0 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none relative z-0 mx-auto mb-8 h-px max-w-md bg-border/35"
                />
              )}

              <div className="relative z-30 mb-10 w-full">
                <h2 className="w-full max-w-[420px] whitespace-normal break-words text-2xl font-bold leading-tight text-foreground">
                  {grupo.titulo}
                </h2>
                <IndicadorProgresoModulo
                  indiceModulo={indiceModulo}
                  progreso={progresoModulo}
                />
              </div>

              <div className="relative z-20 mx-auto flex w-full max-w-md flex-col items-center px-5 lg:hidden">
                {grupo.nodos.map((nodo, indiceEnModulo) => {
                  const idx = indiceLeccionEnNodo(grupo.nodos, indiceEnModulo);
                  const esActivo = nodo.id === nodoActivoId;
                  const esAvatarActual = nodo.id === nodoActivoGlobalId;
                  const esNodoResaltado = nodo.id === nodoResaltadoId;
                  const layout = layoutsMobile[indiceEnModulo]!;

                  return (
                    <div key={`${nodo.id}-mobile`} className="relative flex w-full flex-col items-center">
                      <AssetEstacion layout={layout} variant="mobile" />
                      <div
                        id={`roadmap-node-mobile-${nodo.id}`}
                        data-roadmap-node-id={nodo.id}
                        data-roadmap-node={nodo.id}
                        className={cn(
                          "relative",
                          nodo.id === nodoCompletadoAnimadoId && "roadmap-node-just-completed",
                          esNodoResaltado && "roadmap-node-next-highlight",
                        )}
                      >
                        <NodoEnlace
                          nodo={nodo}
                          variant="mobile"
                          indiceLeccion={idx}
                          indiceEnModulo={indiceEnModulo}
                          totalModulo={grupo.nodos.length}
                          indiceModulo={indiceModulo}
                          esActivo={esActivo || esNodoResaltado}
                          soloIcono
                        />
                        {(esAvatarActual || esNodoResaltado) && <AvatarRoadmap variant="mobile" />}
                      </div>
                      <div className="relative z-30 mt-3 w-full">
                        <EtiquetaNodo nodo={nodo} alineacion="center" />
                      </div>
                      {nodo.id !== ultimoNodoGrupo && (
                        <div
                          aria-hidden="true"
                          className={cn(
                            "roadmap-connector relative z-10 my-4 h-16",
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
                grupo={grupo}
                indiceModulo={indiceModulo}
                nodoActivoGlobalId={nodoActivoGlobalId}
                nodoCompletadoAnimadoId={nodoCompletadoAnimadoId}
                nodoResaltadoId={nodoResaltadoId}
              />

              {progresoModulo.completo && (
                <CierreModulo
                  indiceModulo={indiceModulo}
                  esUltimoModulo={esUltimoModulo}
                  hrefSiguienteModulo={hrefSiguienteModulo}
                />
              )}
            </div>
          );
        })}
      </div>
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
  tipoRama = "compacta",
}: {
  nodo: NodoRuta;
  alineacion: AlineacionEtiqueta;
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
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full bg-[#e9f8f5] text-[#087c72]",
            nodo.completado && "bg-[#13a476] text-white",
            nodo.tipo === "evaluacion" && "rounded-lg bg-[#d7ad30] text-white",
            nodo.bloqueado && "bg-slate-200 text-slate-500",
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
  soloIcono = false,
}: {
  nodo: NodoRuta;
  variant: VarianteRoadmap;
  indiceLeccion: number;
  indiceEnModulo: number;
  totalModulo: number;
  indiceModulo: number;
  esActivo: boolean;
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
