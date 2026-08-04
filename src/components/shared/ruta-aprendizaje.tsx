import Link from "next/link";
import type { CSSProperties } from "react";
import {
  BookOpen,
  Check,
  ClipboardCheck,
  FileText,
  Lock,
  Play,
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

/** Secuencia fija por módulo: intro → práctica → lectura → actividad. */
const ICONOS_LECCION: LucideIcon[] = [BookOpen, Play, FileText, Wrench];

type EstadoEstacion = "completado" | "activo" | "pendiente" | "bloqueado";

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

function AnilloEstacion({
  nodoId,
  estado,
  progreso,
  esQuiz,
  colorModulo,
}: {
  nodoId: string;
  estado: EstadoEstacion;
  progreso: number;
  esQuiz: boolean;
  colorModulo: ColorModulo;
}) {
  const circunferencia = 2 * Math.PI * RADIO_ANILLO;
  const offset = circunferencia * (1 - progreso / 100);
  const gradId = `ring-grad-${nodoId}`;
  const quizGoldId = `quiz-gold-${nodoId}`;
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
  esActivo,
  Icono,
}: {
  nodo: NodoRuta;
  esActivo: boolean;
  Icono: LucideIcon;
}) {
  const puntos = "32,5 56,17.5 56,46.5 32,59 8,46.5 8,17.5";
  const gradId = `hex-${nodo.id}`;

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
  indiceLeccion,
  indiceEnModulo,
  totalModulo,
  indiceModulo,
  esActivo,
}: {
  nodo: NodoRuta;
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
      className="relative flex shrink-0 items-center justify-center overflow-visible"
      style={{ width: ANILLO, height: ANILLO }}
    >
      {estado === "activo" && <OndasEstacionActiva />}
      <AnilloEstacion
        nodoId={nodo.id}
        estado={estado}
        progreso={progreso}
        esQuiz={esQuiz}
        colorModulo={colorModulo}
      />
      {esQuiz ? (
        <NucleoHexagonal nodo={nodo} esActivo={esActivo} Icono={Icono} />
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
  legacy = false,
}: {
  grupos: GrupoRuta[];
  legacy?: boolean;
}) {
  if (!legacy) {
    return (
      <div className="relative z-10 w-full overflow-x-clip lg:overflow-x-visible">
        {grupos.map((grupo, indiceModulo) => {
          const ultimoNodoGrupo = grupo.nodos.at(-1)?.id;
          const nodoActivoId = idNodoActivoModulo(grupo.nodos);
          let indiceLeccion = 0;

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
              </div>

              <div className="relative z-20 mx-auto flex w-full max-w-md flex-col items-center px-5 lg:hidden">
                {grupo.nodos.map((nodo, indiceEnModulo) => {
                  const idx = nodo.tipo === "leccion" ? indiceLeccion++ : 0;
                  const esActivo = nodo.id === nodoActivoId;

                  return (
                    <div key={nodo.id} className="relative flex w-full flex-col items-center">
                      <NodoEnlace
                        nodo={nodo}
                        indiceLeccion={idx}
                        indiceEnModulo={indiceEnModulo}
                        totalModulo={grupo.nodos.length}
                        indiceModulo={indiceModulo}
                        esActivo={esActivo}
                        soloIcono
                      />
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

              <div className="relative z-20 mx-auto hidden w-full max-w-[760px] overflow-visible lg:block">
                {grupo.nodos.map((nodo, indice) => {
                  const idx = nodo.tipo === "leccion" ? indiceLeccion++ : 0;
                  const esActivo = nodo.id === nodoActivoId;
                  const columnas = [0, 1, 2, 1] as const;
                  const posiciones = [300, 380, 460] as const;
                  const anchoTrack = 760;
                  const columna = columnas[indice % columnas.length] ?? 0;
                  const siguienteColumna = columnas[(indice + 1) % columnas.length] ?? 0;
                  const textoALaIzquierda =
                    columna === 0 || (columna === 1 && indice % columnas.length === 3);
                  const leftPct = (posiciones[columna] / anchoTrack) * 100;
                  const gapNodoTexto = 24;
                  const gradCompletado = `roadmap-completed-${nodo.id}`;
                  const gradPendiente = `roadmap-pending-${nodo.id}`;

                  return (
                    <div key={nodo.id} className="relative h-36 w-full overflow-visible">
                      {nodo.id !== ultimoNodoGrupo && (
                        <svg
                          aria-hidden="true"
                          className="pointer-events-none absolute left-0 top-1/2 z-10 h-36 w-full overflow-visible"
                          viewBox={`0 0 ${anchoTrack} 144`}
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id={gradCompletado} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#117d8b" />
                              <stop offset="55%" stopColor="#17b8d4" />
                              <stop offset="100%" stopColor="#0454bd" />
                            </linearGradient>
                            <linearGradient id={gradPendiente} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#d7e6e3" />
                              <stop offset="100%" stopColor="#c8d9d6" />
                            </linearGradient>
                          </defs>
                          <line
                            x1={posiciones[columna]}
                            y1="0"
                            x2={posiciones[siguienteColumna]}
                            y2="144"
                            stroke={
                              nodo.completado
                                ? `url(#${gradCompletado})`
                                : `url(#${gradPendiente})`
                            }
                            className={cn(
                              "roadmap-connector-svg",
                              nodo.completado
                                ? "roadmap-connector-svg-completed"
                                : "roadmap-connector-svg-pending",
                            )}
                          />
                        </svg>
                      )}

                      <div
                        className="absolute top-1/2 z-20 overflow-visible -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${leftPct}%` }}
                      >
                        <NodoEnlace
                          nodo={nodo}
                          indiceLeccion={idx}
                          indiceEnModulo={indice}
                          totalModulo={grupo.nodos.length}
                          indiceModulo={indiceModulo}
                          esActivo={esActivo}
                          soloIcono
                        />
                      </div>

                      <div
                        className="absolute top-1/2 z-30 w-[min(240px,34%)]"
                        style={
                          textoALaIzquierda
                            ? {
                                left: `calc(${leftPct}% - ${ANILLO / 2 + gapNodoTexto}px)`,
                                transform: "translate(-100%, -50%)",
                              }
                            : {
                                left: `calc(${leftPct}% + ${ANILLO / 2 + gapNodoTexto}px)`,
                                transform: "translateY(-50%)",
                              }
                        }
                      >
                        <EtiquetaNodo
                          nodo={nodo}
                          alineacion={textoALaIzquierda ? "right" : "left"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
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
}: {
  nodo: NodoRuta;
  alineacion: "left" | "center" | "right";
}) {
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
  indiceLeccion,
  indiceEnModulo,
  totalModulo,
  indiceModulo,
  esActivo,
  soloIcono = false,
}: {
  nodo: NodoRuta;
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
        indiceLeccion={indiceLeccion}
        indiceEnModulo={indiceEnModulo}
        totalModulo={totalModulo}
        indiceModulo={indiceModulo}
        esActivo={esActivo}
      />
    </div>
  );
}
