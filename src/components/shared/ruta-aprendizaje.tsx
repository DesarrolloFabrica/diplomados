import Link from "next/link";
import { Check, Lock, Play, Trophy } from "lucide-react";
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
      <div className="mx-auto w-full max-w-5xl overflow-x-clip">
        {grupos.map((grupo) => {
          const ultimoNodoGrupo = grupo.nodos.at(-1)?.id;

          return (
            <section key={grupo.titulo} className="mb-14 w-full last:mb-0">
              <div className="mb-10 w-full">
                <h2 className="w-full max-w-[420px] whitespace-normal break-words text-2xl font-bold leading-tight text-foreground">
                  {grupo.titulo}
                </h2>
              </div>

              {/* Móvil y tablet: recorrido vertical centrado. */}
              <div className="mx-auto flex w-full max-w-md flex-col items-center px-5 lg:hidden">
                {grupo.nodos.map((nodo) => (
                  <div key={nodo.id} className="relative flex w-full flex-col items-center">
                    <NodoEnlace nodo={nodo} soloIcono />
                    <div className="relative z-10 mt-3 w-full">
                      <EtiquetaNodo nodo={nodo} alineacion="center" />
                    </div>
                    {nodo.id !== ultimoNodoGrupo && (
                      <div
                        aria-hidden="true"
                        className={cn(
                          "roadmap-connector relative z-0 my-4 h-16",
                          nodo.completado
                            ? "roadmap-connector-completed"
                            : "roadmap-connector-pending",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Escritorio: zigzag; el texto se ancla al nodo (~24px). */}
              <div className="relative mx-auto hidden w-full max-w-[760px] lg:block">
                {grupo.nodos.map((nodo, indice) => {
                  const columnas = [0, 1, 2, 1] as const;
                  // Márgenes laterales para texto a ~24px del nodo sin recorte.
                  const posiciones = [300, 380, 460] as const;
                  const anchoTrack = 760;
                  const columna = columnas[indice % columnas.length] ?? 0;
                  const siguienteColumna = columnas[(indice + 1) % columnas.length] ?? 0;
                  const textoALaIzquierda =
                    columna === 0 || (columna === 1 && indice % columnas.length === 3);
                  const leftPct = (posiciones[columna] / anchoTrack) * 100;
                  const gapNodoTexto = 24;

                  return (
                    <div key={nodo.id} className="relative h-36 w-full">
                      {nodo.id !== ultimoNodoGrupo && (
                        <svg
                          aria-hidden="true"
                          className="pointer-events-none absolute left-0 top-1/2 z-0 h-36 w-full overflow-visible"
                          viewBox={`0 0 ${anchoTrack} 144`}
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient
                              id="roadmap-completed"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#43d5b1" />
                              <stop offset="55%" stopColor="#7ef0d0" />
                              <stop offset="100%" stopColor="#a6f5e1" />
                            </linearGradient>
                            <linearGradient
                              id="roadmap-pending"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#d7e6e3" />
                              <stop offset="100%" stopColor="#c8d9d6" />
                            </linearGradient>
                          </defs>
                          <line
                            x1={posiciones[columna]}
                            y1="0"
                            x2={posiciones[siguienteColumna]}
                            y2="144"
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
                        className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${leftPct}%` }}
                      >
                        <NodoEnlace nodo={nodo} soloIcono />
                      </div>

                      <div
                        className="absolute top-1/2 z-10 w-[min(240px,34%)]"
                        style={
                          textoALaIzquierda
                            ? {
                                left: `calc(${leftPct}% - ${NODO / 2 + gapNodoTexto}px)`,
                                transform: "translate(-100%, -50%)",
                              }
                            : {
                                left: `calc(${leftPct}% + ${NODO / 2 + gapNodoTexto}px)`,
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
            </section>
          );
        })}
      </div>
    );
  }

  const titulos: { texto: string; y: number }[] = [];
  const nodos: Posicion[] = [];

  let y = ALTO_TITULO / 2;

  for (const grupo of grupos) {
    titulos.push({ texto: grupo.titulo, y });
    y += ALTO_TITULO;

    // Escalera en zigzag: cada módulo arranca su propio tramo desde la
    // izquierda y va "rebotando" entre las columnas disponibles, bajando
    // un escalón (PASO_Y) en cada nodo — nunca una columna vertical fija.
    let columna = 0;
    let direccion = 1;

    for (const nodo of grupo.nodos) {
      nodos.push({
        cx: MARGEN_X + columna * PASO_X,
        cy: y,
        nodo,
      });
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

      {nodos.map(({ cx, cy, nodo }) => (
        <NodoLegacy key={nodo.id} cx={cx} cy={cy} nodo={nodo} />
      ))}
    </div>
  );
}

function NodoIcono({ nodo }: { nodo: NodoRuta }) {
  const Icono = nodo.completado
    ? Check
    : nodo.bloqueado
      ? Lock
      : nodo.tipo === "evaluacion"
        ? Trophy
        : Play;

  return (
    <div
      className={cn(
        "relative z-10 flex shrink-0 items-center justify-center rounded-full border-4 shadow-md transition-transform",
        nodo.completado && "border-success bg-success text-success-foreground",
        !nodo.completado &&
          !nodo.bloqueado &&
          "border-primary bg-primary text-primary-foreground hover:scale-105",
        nodo.bloqueado && "border-border bg-muted text-muted-foreground",
      )}
      style={{ width: NODO, height: NODO }}
    >
      <Icono className="h-6 w-6" />
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
  soloIcono = false,
}: {
  nodo: NodoRuta;
  soloIcono?: boolean;
}) {
  const contenido = (
    <>
      <NodoIcono nodo={nodo} />
      {!soloIcono && (
        <span className="w-32 whitespace-normal break-words text-center text-xs font-medium leading-tight text-foreground">
          {nodo.titulo}
        </span>
      )}
    </>
  );

  const clase = cn(
    "relative z-10 flex flex-col items-center gap-1.5",
    soloIcono && "shrink-0 gap-0",
    nodo.bloqueado && "cursor-not-allowed opacity-70",
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
}: {
  cx: number;
  cy: number;
  nodo: NodoRuta;
}) {
  return (
    <div
      className="absolute z-10 flex flex-col items-center gap-1.5"
      style={{ left: cx - 64, top: cy - NODO / 2, width: 128 }}
    >
      <NodoEnlace nodo={nodo} />
    </div>
  );
}
