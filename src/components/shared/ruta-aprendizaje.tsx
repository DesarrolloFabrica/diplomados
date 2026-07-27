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
const ANCHO = MARGEN_X * 2 + (COLUMNAS - 1) * PASO_X;

interface Posicion {
  cx: number;
  cy: number;
  nodo: NodoRuta;
}

export function RutaAprendizaje({ grupos }: { grupos: GrupoRuta[] }) {
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
      nodos.push({ cx: MARGEN_X + columna * PASO_X, cy: y, nodo });
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
    <div className="relative mx-auto" style={{ width: ANCHO, height: alto }}>
      <svg className="absolute inset-0" width={ANCHO} height={alto} aria-hidden>
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
        <NodoBoton key={nodo.id} cx={cx} cy={cy} nodo={nodo} />
      ))}
    </div>
  );
}

function NodoBoton({ cx, cy, nodo }: { cx: number; cy: number; nodo: NodoRuta }) {
  const Icono = nodo.completado
    ? Check
    : nodo.bloqueado
      ? Lock
      : nodo.tipo === "evaluacion"
        ? Trophy
        : Play;

  const circulo = (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-4 shadow-md transition-transform",
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

  const contenido = (
    <>
      {circulo}
      <span className="line-clamp-2 w-32 text-center text-xs font-medium leading-tight text-foreground">
        {nodo.titulo}
      </span>
    </>
  );

  return (
    <div
      className="absolute flex flex-col items-center gap-1.5"
      style={{ left: cx - 64, top: cy - NODO / 2, width: 128 }}
    >
      {nodo.bloqueado ? (
        <div className="flex cursor-not-allowed flex-col items-center gap-1.5 opacity-70">
          {contenido}
        </div>
      ) : (
        <Link href={nodo.href} className="flex flex-col items-center gap-1.5">
          {contenido}
        </Link>
      )}
    </div>
  );
}
