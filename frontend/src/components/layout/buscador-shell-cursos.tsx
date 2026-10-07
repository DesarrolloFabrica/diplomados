"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ElementoBusquedaShell } from "@backend/server/queries/mis-cursos";

const IndiceBusquedaCursosContext = createContext<ElementoBusquedaShell[]>([]);
const LIMITE_RESULTADOS = 8;
type FiltroBusqueda = "todos" | ElementoBusquedaShell["tipo"];

const FILTROS_BUSQUEDA: ReadonlyArray<{ id: FiltroBusqueda; etiqueta: string }> = [
  { id: "todos", etiqueta: "Todo" },
  { id: "curso", etiqueta: "Cursos" },
  { id: "leccion", etiqueta: "Clases" },
];

export function IndiceBusquedaCursosProvider({
  elementos,
  children,
}: {
  elementos: ElementoBusquedaShell[];
  children: ReactNode;
}) {
  return (
    <IndiceBusquedaCursosContext.Provider value={elementos}>
      {children}
    </IndiceBusquedaCursosContext.Provider>
  );
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

export function BuscadorCatalogoCursos() {
  const elementos = useContext(IndiceBusquedaCursosContext);
  const idBase = useId().replace(/:/g, "");
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const [consulta, setConsulta] = useState("");
  const [enfocado, setEnfocado] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [filtro, setFiltro] = useState<FiltroBusqueda>("todos");

  const resultados = useMemo(() => {
    const termino = normalizar(consulta);
    if (!termino) return [];

    return elementos
      .filter((elemento) => filtro === "todos" || elemento.tipo === filtro)
      .map((elemento) => {
        const titulo = normalizar(elemento.titulo);
        const contexto = normalizar(elemento.contexto);
        const puntaje = titulo === termino
          ? 0
          : titulo.startsWith(termino)
            ? 1
            : titulo.includes(termino)
              ? 2
              : contexto.includes(termino)
                ? 3
                : 99;
        return { elemento, puntaje };
      })
      .filter(({ puntaje }) => puntaje < 99)
      .sort(
        (a, b) =>
          a.puntaje - b.puntaje ||
          a.elemento.titulo.localeCompare(b.elemento.titulo, "es"),
      )
      .slice(0, LIMITE_RESULTADOS)
      .map(({ elemento }) => elemento);
  }, [consulta, elementos, filtro]);

  const abierto = enfocado && Boolean(consulta.trim());

  useEffect(() => {
    setIndiceActivo(0);
  }, [consulta, filtro]);

  useEffect(() => {
    if (!enfocado) return;

    function cerrarAlHacerClickFuera(evento: PointerEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) setEnfocado(false);
    }

    document.addEventListener("pointerdown", cerrarAlHacerClickFuera);
    return () => document.removeEventListener("pointerdown", cerrarAlHacerClickFuera);
  }, [enfocado]);

  function limpiar() {
    setConsulta("");
    setIndiceActivo(0);
  }

  function manejarTeclado(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Escape") {
      evento.preventDefault();
      setEnfocado(false);
      return;
    }
    if (resultados.length === 0) return;
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setIndiceActivo((actual) => (actual + 1) % resultados.length);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndiceActivo((actual) => (actual - 1 + resultados.length) % resultados.length);
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      document.getElementById(`${idBase}-resultado-${indiceActivo}`)?.click();
    }
  }

  return (
    <div ref={contenedorRef} className="relative z-[70] w-full max-w-4xl">
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] px-4 text-[var(--interface-text)] shadow-[var(--interface-card-shadow)] backdrop-blur-xl transition-[border-color,box-shadow] focus-within:border-[var(--interface-accent-secondary)] focus-within:shadow-[var(--interface-glow)] sm:px-5">
          <Search
            className="size-5 shrink-0 text-[var(--interface-accent-secondary)]"
            aria-hidden="true"
          />
          <span className="sr-only">Buscar cursos y clases por nombre</span>
          <input
            type="search"
            role="combobox"
            aria-label="Buscar cursos y clases por nombre"
            aria-expanded={abierto}
            aria-controls={`${idBase}-resultados`}
            aria-activedescendant={
              abierto && resultados[indiceActivo]
                ? `${idBase}-resultado-${indiceActivo}`
                : undefined
            }
            autoComplete="off"
            value={consulta}
            onFocus={() => setEnfocado(true)}
            onChange={(evento) => setConsulta(evento.target.value)}
            onKeyDown={manejarTeclado}
            placeholder="Buscar cursos o clases por nombre..."
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--interface-text)] outline-none placeholder:text-[var(--interface-text-muted)]"
          />
          {consulta && (
            <button
              type="button"
              onClick={limpiar}
              aria-label="Limpiar búsqueda"
              className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--interface-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--interface-accent)_10%,transparent)] hover:text-[var(--interface-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </label>

        <div
          role="group"
          aria-label="Filtrar búsqueda por tipo"
          className="flex min-h-12 shrink-0 items-center gap-1 rounded-full border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] p-1 shadow-[var(--interface-card-shadow)] backdrop-blur-xl"
        >
          {FILTROS_BUSQUEDA.map((opcion) => {
            const activo = filtro === opcion.id;
            const esCurso = opcion.id === "curso";
            const esClase = opcion.id === "leccion";
            return (
              <button
                key={opcion.id}
                type="button"
                aria-pressed={activo}
                onClick={() => {
                  setFiltro(opcion.id);
                  setEnfocado(true);
                }}
                className={cn(
                  "min-h-9 flex-1 rounded-full px-3 text-xs font-bold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] sm:flex-none sm:px-4",
                  activo
                    ? esCurso
                      ? "bg-[var(--interface-accent)] text-[var(--interface-accent-foreground)] shadow-sm"
                      : esClase
                        ? "bg-[var(--interface-accent-secondary)] text-[#061120] shadow-sm"
                        : "bg-[var(--interface-text)] text-[var(--interface-bg)] shadow-sm"
                    : "text-[var(--interface-text-muted)] hover:bg-[color-mix(in_srgb,var(--interface-text)_8%,transparent)] hover:text-[var(--interface-text)]",
                )}
              >
                {opcion.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      {abierto && (
        <div
          id={`${idBase}-resultados`}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.65rem)] overflow-hidden rounded-2xl border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] shadow-[0_24px_70px_rgba(2,12,24,0.34)] backdrop-blur-2xl"
        >
          <div className="max-h-[min(58vh,420px)] overflow-y-auto p-2">
            {resultados.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-[var(--interface-text-muted)]">
                No encontramos {filtro === "curso" ? "cursos" : filtro === "leccion" ? "clases" : "resultados"} para “{consulta.trim()}”.
              </p>
            ) : (
              resultados.map((resultado, indice) => {
                const esCurso = resultado.tipo === "curso";
                const Icono = esCurso ? GraduationCap : BookOpen;
                const activo = indice === indiceActivo;
                return (
                  <Link
                    id={`${idBase}-resultado-${indice}`}
                    key={resultado.id}
                    href={resultado.href}
                    role="option"
                    aria-selected={activo}
                    onMouseEnter={() => setIndiceActivo(indice)}
                    onFocus={() => setIndiceActivo(indice)}
                    onClick={() => {
                      limpiar();
                      setEnfocado(false);
                    }}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border-l-2 px-3 py-2.5 outline-none transition-colors",
                      esCurso
                        ? "border-l-[var(--interface-accent)]"
                        : "border-l-[var(--interface-accent-secondary)]",
                      activo
                        ? esCurso
                          ? "bg-[color-mix(in_srgb,var(--interface-accent)_14%,transparent)]"
                          : "bg-[color-mix(in_srgb,var(--interface-accent-secondary)_16%,transparent)]"
                        : "hover:bg-[color-mix(in_srgb,var(--interface-text)_7%,transparent)]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border",
                        esCurso
                          ? "border-[var(--interface-accent)] bg-[color-mix(in_srgb,var(--interface-accent)_16%,transparent)] text-[var(--interface-accent)]"
                          : "border-[var(--interface-accent-secondary)] bg-[color-mix(in_srgb,var(--interface-accent-secondary)_16%,transparent)] text-[var(--interface-accent-secondary)]",
                      )}
                    >
                      <Icono className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-bold">
                          {resultado.titulo}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em]",
                            esCurso
                              ? "bg-[color-mix(in_srgb,var(--interface-accent)_18%,transparent)] text-[var(--interface-accent)]"
                              : "bg-[color-mix(in_srgb,var(--interface-accent-secondary)_18%,transparent)] text-[var(--interface-accent-secondary)]",
                          )}
                        >
                          {esCurso ? "Curso" : "Clase"}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--interface-text-muted)]">
                        {resultado.contexto}
                      </span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
