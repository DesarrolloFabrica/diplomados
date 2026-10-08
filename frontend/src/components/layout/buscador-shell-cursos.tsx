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
import { BookOpen, Check, GraduationCap, Search, SlidersHorizontal, X } from "lucide-react";
import { useInterfaceVariant } from "@/components/providers/interface-variant-provider";
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

export function BuscadorCatalogoCursos({
  compacto = false,
  mostrarFiltros = true,
}: {
  compacto?: boolean;
  mostrarFiltros?: boolean;
}) {
  const { config } = useInterfaceVariant();
  const esCreativa = config.id === "creative";
  const elementos = useContext(IndiceBusquedaCursosContext);
  const idBase = useId().replace(/:/g, "");
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const [consulta, setConsulta] = useState("");
  const [enfocado, setEnfocado] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
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
    if (!enfocado && !filtrosAbiertos) return;

    function cerrarAlHacerClickFuera(evento: PointerEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) {
        setEnfocado(false);
        setFiltrosAbiertos(false);
      }
    }

    document.addEventListener("pointerdown", cerrarAlHacerClickFuera);
    return () => document.removeEventListener("pointerdown", cerrarAlHacerClickFuera);
  }, [enfocado, filtrosAbiertos]);

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
    <div
      ref={contenedorRef}
      className={cn(
        "relative z-[70] w-full min-w-0",
        compacto ? "max-w-3xl lg:flex-1" : "max-w-4xl",
        esCreativa &&
          "[--interface-border:rgba(255,255,255,0.82)] [--interface-surface-strong:rgba(238,242,247,0.94)] [--interface-text-muted:#536273] [--interface-text:#0b1b2b]",
      )}
    >
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <label
          className={cn(
            "relative flex min-w-0 flex-1 items-center rounded-full border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] shadow-[var(--interface-card-shadow)] backdrop-blur-xl transition-[border-color,box-shadow] focus-within:border-[var(--interface-accent-secondary)] focus-within:shadow-[var(--interface-glow)]",
            compacto ? "min-h-10 gap-2.5 px-3.5" : "min-h-12 gap-3 px-4 sm:px-5",
          )}
        >
          <Search
            className={cn(
              "shrink-0 text-[var(--interface-accent-secondary)]",
              compacto ? "size-4" : "size-5",
            )}
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
            className={cn(
              "shell-course-search-input min-w-0 flex-1 bg-transparent font-medium text-[var(--interface-text)] outline-none placeholder:text-[var(--interface-text-muted)]",
              compacto ? "text-xs" : "text-sm",
            )}
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
          {mostrarFiltros ? (
            <button
              type="button"
              aria-label={`Filtrar búsqueda. Opción actual: ${FILTROS_BUSQUEDA.find((opcion) => opcion.id === filtro)?.etiqueta ?? "Todo"}`}
              aria-haspopup="menu"
              aria-expanded={filtrosAbiertos}
              onClick={(evento) => {
                evento.preventDefault();
                setFiltrosAbiertos((abiertoActual) => !abiertoActual);
                setEnfocado(false);
              }}
              className={cn(
                "relative grid shrink-0 place-items-center rounded-full border border-[var(--interface-border)] text-[var(--interface-text-muted)] transition-colors hover:border-[var(--interface-accent-secondary)] hover:bg-[color-mix(in_srgb,var(--interface-accent-secondary)_10%,transparent)] hover:text-[var(--interface-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]",
                compacto ? "size-8" : "size-9",
              )}
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {filtro !== "todos" ? (
                <span
                  className="absolute right-0 top-0 size-2 rounded-full bg-[var(--interface-accent-secondary)] ring-2 ring-[var(--interface-surface-strong)]"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          ) : null}
        </label>
      </div>

      {mostrarFiltros && filtrosAbiertos ? (
        <div
          role="menu"
          aria-label="Filtrar búsqueda por tipo"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-44 overflow-hidden rounded-2xl border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] p-1.5 text-[var(--interface-text)] shadow-[0_18px_48px_rgba(2,12,24,0.3)] backdrop-blur-2xl"
        >
          {FILTROS_BUSQUEDA.map((opcion) => {
            const activo = filtro === opcion.id;
            return (
              <button
                key={opcion.id}
                type="button"
                role="menuitemradio"
                aria-checked={activo}
                onClick={() => {
                  setFiltro(opcion.id);
                  setFiltrosAbiertos(false);
                  setEnfocado(Boolean(consulta.trim()));
                }}
                className={cn(
                  "flex min-h-9 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]",
                  activo
                    ? "bg-[color-mix(in_srgb,var(--interface-accent-secondary)_16%,transparent)] text-[var(--interface-text)]"
                    : "text-[var(--interface-text-muted)] hover:bg-[color-mix(in_srgb,var(--interface-text)_7%,transparent)] hover:text-[var(--interface-text)]",
                )}
              >
                {opcion.etiqueta}
                {activo ? (
                  <Check className="size-4 text-[var(--interface-accent-secondary)]" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

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
