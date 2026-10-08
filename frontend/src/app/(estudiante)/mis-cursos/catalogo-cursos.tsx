"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  Bell,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Play,
  Search,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { BuscadorCatalogoCursos } from "@/components/layout/buscador-shell-cursos";
import { AnilloProgreso } from "@/components/shared/anillo-progreso";
import { BotonDesinscribirmePrueba } from "@/components/shared/boton-desinscribirme-prueba";
import { useInterfaceVariant } from "@/components/providers/interface-variant-provider";
import { estiloFondoInterfaz } from "@/lib/interface-assets";
import { hrefContinuarCurso } from "@/lib/href-continuar-curso";
import { cn } from "@/lib/utils";
import type { SchoolVisualId } from "@/config/visual-themes/types";
import { CLASE_HERO_PANEL, CLASE_PANEL_GLASS } from "@/config/paneles-glass";
import type { CursoCatalogoFila } from "@backend/server/queries/mis-cursos";

interface CatalogoCursosProps {
  pagina: "home" | "mis-cursos";
  seccionHome?: "descubrir" | "diplomados" | "nuevos";
  misCursos: CursoCatalogoFila[];
  disponibles: CursoCatalogoFila[];
  nombre: string | null;
}

const CATEGORIAS = ["Curso", "Educacion", "Creatividad", "Pensamiento", "Cortos"];

type CatalogSection = "mis-cursos" | "diplomados" | "nuevos" | "descubrir" | "categoria";
type NivelCatalogo = CursoCatalogoFila["nivelDificultad"];
type FiltroNivel = "todos" | NivelCatalogo;
type EscuelaCatalogo = Exclude<SchoolVisualId, "neutral">;
type VarianteCatalogoVisual = "default" | "adventure" | "educational";

const NEW_COURSE_DAYS = 30;

const NIVELES_CATALOGO: ReadonlyArray<{ id: FiltroNivel; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "basico", label: "Básico" },
  { id: "intermedio", label: "Intermedio" },
  { id: "avanzado", label: "Avanzado" },
];

/** Oculta temporalmente buscador, categorías y perfil del catálogo. */
const MOSTRAR_BARRA_SUPERIOR_CATALOGO = false;

/**
 * Mapeo aproximado de los chips de categoría de `BarraSuperior` (una lista
 * decorativa que no corresponde 1 a 1 a ninguna escuela real) hacia la
 * escuela más parecida de `ESCUELAS_CATALOGO`, para que el clic navegue a la
 * sección "Por categoria" ya existente. "Curso" no tiene escuela asociada:
 * actúa como "quitar filtro" (vuelve a "Mis cursos").
 */
const ESCUELA_POR_CATEGORIA: Partial<Record<(typeof CATEGORIAS)[number], EscuelaCatalogo>> = {
  Educacion: "sociales",
  Creatividad: "diseno",
  Pensamiento: "ingenieria",
  Cortos: "empresarial",
};

const CLASE_TARJETA_GLASS = cn(
  "group relative flex aspect-[4/5] min-h-[300px] w-[82vw] max-w-[286px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[24px] text-left outline-none transition-[transform,box-shadow,border-color] duration-300 sm:w-[270px] lg:w-[280px]",
  CLASE_PANEL_GLASS,
  "hover:-translate-y-1 hover:border-white/65 hover:shadow-[0_18px_48px_rgba(6,17,32,0.24),inset_0_1px_0_rgba(255,255,255,0.5)]",
  "focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]",
);

export function CatalogoCursos({
  pagina,
  seccionHome = "descubrir",
  misCursos,
  disponibles,
  nombre,
}: CatalogoCursosProps) {
  const { config } = useInterfaceVariant();
  const esBusiness = config.id === "business";
  const esEducational = config.id === "educational";
  const esGamified = config.id === "gamified";
  const todosCursos = useMemo(() => [...misCursos, ...disponibles], [disponibles, misCursos]);
  const [nivelActivo, setNivelActivo] = useState<FiltroNivel>("todos");
  const cursosPendientesInscritos = useMemo(
    () =>
      [...misCursos]
        .filter(
          (curso) =>
            Boolean(curso.inscripcionId) &&
            !cursoCompletado(curso, porcentajeCurso(curso)),
        )
        .sort(
          (a, b) =>
            prioridadInscripcion(b) - prioridadInscripcion(a) ||
            porcentajeCurso(b) - porcentajeCurso(a),
        ),
    [misCursos],
  );
  const cursoDestacado =
    cursosPendientesInscritos[0] ??
    misCursos[0] ??
    (pagina === "home" ? disponibles[0] : null) ??
    null;
  const cursosHero =
    cursosPendientesInscritos.length > 0
      ? cursosPendientesInscritos
      : cursoDestacado
        ? [cursoDestacado]
        : [];
  const misCursosOrdenados = useMemo(
    () =>
      misCursos
        .filter((curso) => Boolean(curso.inscripcionId))
        .sort(
          (a, b) =>
            prioridadInscripcion(b) - prioridadInscripcion(a) ||
            porcentajeCurso(b) - porcentajeCurso(a),
        ),
    [misCursos],
  );
  const misCursosFiltrados = useMemo(
    () =>
      nivelActivo === "todos"
        ? misCursosOrdenados
        : misCursosOrdenados.filter(
            (curso) => normalizarNivel(curso.nivelDificultad) === nivelActivo,
          ),
    [misCursosOrdenados, nivelActivo],
  );
  const nuevos = useMemo(() => {
    const fechaLimite = Date.now() - NEW_COURSE_DAYS * 24 * 60 * 60 * 1000;

    return todosCursos
      .filter((curso) => new Date(curso.createdAt).getTime() >= fechaLimite)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [todosCursos]);
  const cursoReferenciaDescubrimiento = useMemo(
    () =>
      misCursosOrdenados
        .filter(
          (curso) =>
            cursoEnProgreso(curso) &&
            !cursoCompletado(curso, porcentajeCurso(curso)),
        )
        .sort(
          (a, b) =>
            porcentajeCurso(b) - porcentajeCurso(a) ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0] ?? null,
    [misCursosOrdenados],
  );
  const cursosRelacionados = useMemo(() => {
    if (!cursoReferenciaDescubrimiento) return [];

    return todosCursos
      .filter(
        (curso) =>
          curso.id !== cursoReferenciaDescubrimiento.id &&
          !cursoCompletado(curso, porcentajeCurso(curso)),
      )
      .sort((a, b) => compararRelacionados(cursoReferenciaDescubrimiento, a, b));
  }, [cursoReferenciaDescubrimiento, todosCursos]);
  const recomendadosEmpresa = useMemo(
    () =>
      disponibles.filter(
        (curso) => !cursoCompletado(curso, porcentajeCurso(curso)),
      ),
    [disponibles],
  );
  const resumenBusiness = useMemo(() => {
    const activos = misCursosOrdenados.filter(
      (curso) =>
        Boolean(curso.inscripcionId) &&
        !cursoCompletado(curso, porcentajeCurso(curso)),
    );
    const completados = misCursosOrdenados.filter((curso) =>
      cursoCompletado(curso, porcentajeCurso(curso)),
    );
    const progresoPromedio =
      misCursosOrdenados.length === 0
        ? 0
        : Math.round(
            misCursosOrdenados.reduce(
              (total, curso) => total + porcentajeCurso(curso),
              0,
            ) / misCursosOrdenados.length,
          );

    return { activos: activos.length, completados: completados.length, progresoPromedio };
  }, [misCursosOrdenados]);

  const cursosDescubrimiento = useMemo(() => {
    const vistos = new Set<string>();
    return [...cursosRelacionados, ...recomendadosEmpresa, ...todosCursos].filter((curso) => {
      if (vistos.has(curso.id)) return false;
      vistos.add(curso.id);
      return true;
    });
  }, [cursosRelacionados, recomendadosEmpresa, todosCursos]);
  const cursosParaNuevos =
    nuevos.length > 0
      ? nuevos
      : disponibles.length > 0
        ? disponibles
        : cursosRelacionados;
  const tituloSeccionNuevos =
    nuevos.length > 0
      ? "Nuevos lanzamientos"
      : disponibles.length > 0
        ? "Cursos que aún no has explorado"
        : cursoReferenciaDescubrimiento
          ? `Porque viste ${cursoReferenciaDescubrimiento.titulo}`
          : "Recomendados para ti";

  const catalogoContenido = (
    <ContenidoCatalogo
      pagina={pagina}
      seccionHome={seccionHome}
      nivelActivo={nivelActivo}
      onCambiarNivel={setNivelActivo}
      misCursos={misCursosFiltrados}
      todosCursos={todosCursos}
      cursosDescubrimiento={cursosDescubrimiento}
      cursosParaNuevos={cursosParaNuevos}
      tituloSeccionNuevos={tituloSeccionNuevos}
      variante={esGamified ? "adventure" : esEducational ? "educational" : "default"}
    />
  );

  return (
    <div
      data-dashboard-layout={config.dashboard.layout}
      className="flex w-full max-w-[1500px] flex-col items-start gap-5"
    >
      {!esGamified ? (
        <div className="flex w-full flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <BuscadorCatalogoCursos compacto />
          <SelectorCatalogo
            pagina={pagina}
            seccionHome={seccionHome}
            variante={esEducational ? "educational" : "default"}
          />
        </div>
      ) : null}

      {MOSTRAR_BARRA_SUPERIOR_CATALOGO && <BarraSuperior nombre={nombre} />}

      {esEducational && (
        <DashboardEducativoColaborador
          nombre={nombre}
          cursoActual={cursoDestacado}
          cursosInscritos={misCursosOrdenados}
          cursoExplorable={pagina === "home" ? disponibles[0] ?? null : null}
          mostrarExplorar={pagina === "home"}
        />
      )}

      {esGamified && (
        <DashboardGamificadoColaborador
          nombre={nombre}
          cursosActivos={misCursosOrdenados}
          controlesCatalogo={
            <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-2">
              <BuscadorCatalogoCursos compacto mostrarFiltros={false} />
              <SelectorCatalogo
                pagina={pagina}
                seccionHome={seccionHome}
                variante="adventure"
              />
            </div>
          }
        >
          {catalogoContenido}
        </DashboardGamificadoColaborador>
      )}

      {esBusiness && (
        <ResumenDashboardBusiness
          nombre={nombre}
          activos={resumenBusiness.activos}
          completados={resumenBusiness.completados}
          progresoPromedio={resumenBusiness.progresoPromedio}
        />
      )}

      {!esEducational && !esGamified && cursosHero.length > 0 && (
        <HeroDestacado cursos={cursosHero} />
      )}

      {!esGamified && catalogoContenido}
    </div>
  );
}

function ContenidoCatalogo({
  pagina,
  seccionHome,
  nivelActivo,
  onCambiarNivel,
  misCursos,
  todosCursos,
  cursosDescubrimiento,
  cursosParaNuevos,
  tituloSeccionNuevos,
  variante = "default",
}: {
  pagina: "home" | "mis-cursos";
  seccionHome: "descubrir" | "diplomados" | "nuevos";
  nivelActivo: FiltroNivel;
  onCambiarNivel: (nivel: FiltroNivel) => void;
  misCursos: CursoCatalogoFila[];
  todosCursos: CursoCatalogoFila[];
  cursosDescubrimiento: CursoCatalogoFila[];
  cursosParaNuevos: CursoCatalogoFila[];
  tituloSeccionNuevos: string;
  variante?: VarianteCatalogoVisual;
}) {
  return (
    <section
      data-catalog-density={variante === "adventure" ? "adventure" : undefined}
      className={cn(
        "min-w-0 w-full overflow-hidden",
        variante === "adventure" ? "space-y-4 pt-1" : "space-y-5",
      )}
      aria-labelledby="titulo-catalogo"
    >
      <h2 id="titulo-catalogo" className="sr-only">
        {pagina === "home" ? "Home" : "Mis cursos"}
      </h2>

      {pagina === "home" && seccionHome === "diplomados" ? (
        <FilaCatalogo
          titulo="Diplomados"
          cursos={todosCursos.filter((curso) => curso.esDiplomado)}
          mensajeVacio="No hay diplomados disponibles en este momento."
          variante={variante}
        />
      ) : pagina === "home" && seccionHome === "nuevos" ? (
        <FilaCatalogo
          titulo={tituloSeccionNuevos}
          cursos={cursosParaNuevos}
          mensajeVacio="No hay recomendaciones disponibles en este momento."
          variante={variante}
        />
      ) : pagina === "home" ? (
        <div className="space-y-8">
          <FilaCatalogo
            titulo="Descubrir"
            cursos={cursosDescubrimiento}
            mensajeVacio="No hay cursos disponibles para descubrir en este momento."
            variante={variante}
          />

          <FilaCatalogo
            titulo={tituloSeccionNuevos}
            cursos={cursosParaNuevos}
            mensajeVacio="No hay recomendaciones disponibles en este momento."
            variante={variante}
          />

          {NIVELES_CATALOGO.filter((nivel) => nivel.id !== "todos").map((nivel) => (
            <FilaCatalogo
              key={nivel.id}
              titulo={`Nivel ${nivel.label.toLowerCase()}`}
              cursos={todosCursos.filter(
                (curso) => normalizarNivel(curso.nivelDificultad) === nivel.id,
              )}
              mensajeVacio={`No hay cursos de nivel ${nivel.label.toLowerCase()}.`}
              variante={variante}
            />
          ))}
        </div>
      ) : (
        <FilaCatalogo
          titulo="Mis cursos"
          cursos={misCursos}
          mensajeVacio={
            nivelActivo === "todos"
              ? "Todavía no tienes cursos inscritos."
              : `No tienes cursos inscritos de nivel ${nivelActivo}.`
          }
          variante={variante}
          controles={
            <SelectorSecundario
              ariaLabel="Filtrar mis cursos por nivel"
              items={NIVELES_CATALOGO}
              value={nivelActivo}
              onChange={onCambiarNivel}
              variante={variante}
            />
          }
        />
      )}
    </section>
  );
}

function DashboardEducativoColaborador({
  nombre,
  cursoActual,
  cursosInscritos,
  cursoExplorable,
  mostrarExplorar,
}: {
  nombre: string | null;
  cursoActual: CursoCatalogoFila | null;
  cursosInscritos: CursoCatalogoFila[];
  cursoExplorable: CursoCatalogoFila | null;
  mostrarExplorar: boolean;
}) {
  const [indiceCurso, setIndiceCurso] = useState(0);
  const primerNombre = nombre?.trim().split(/\s+/)[0];
  const titulo = primerNombre
    ? `Tu aprendizaje continua, ${primerNombre}`
    : "Tu aprendizaje continua";
  const indiceCursoSeguro = cursosInscritos.length > 0
    ? Math.min(indiceCurso, cursosInscritos.length - 1)
    : 0;
  const cursoSeleccionado = cursosInscritos[indiceCursoSeguro] ?? cursoActual;
  const porcentajeSeleccionado = cursoSeleccionado
    ? porcentajeCurso(cursoSeleccionado)
    : 0;
  const cursoSeleccionadoCompletado = cursoSeleccionado
    ? cursoCompletado(cursoSeleccionado, porcentajeSeleccionado)
    : false;
  const hrefContinuar = cursoSeleccionado
    ? cursoSeleccionado.inscripcionId
      ? cursoSeleccionadoCompletado
        ? `/mis-cursos/${cursoSeleccionado.id}`
        : hrefContinuarCurso(cursoSeleccionado.id)
      : `/mis-cursos/${cursoSeleccionado.id}/informacion`
    : "#titulo-catalogo";
  const hrefExplorar = cursoExplorable
    ? `/mis-cursos/${cursoExplorable.id}/informacion`
    : "#cursos-activos";
  const estiloHero = estiloFondoInterfaz("educational", "dashboardBackground");
  const hayVariosCursos = cursosInscritos.length > 1;

  function seleccionarCurso(delta: -1 | 1) {
    if (!hayVariosCursos) return;
    setIndiceCurso((indiceActual) => {
      const base = Math.min(indiceActual, cursosInscritos.length - 1);
      return (base + delta + cursosInscritos.length) % cursosInscritos.length;
    });
  }

  return (
    <div className="w-full space-y-6 text-[var(--interface-text)] sm:space-y-7">
      <section
        className="educational-hero relative isolate min-h-[360px] overflow-hidden rounded-[22px] border border-solid border-[#263d32] bg-[#061120] bg-clip-padding text-white shadow-[0_24px_70px_rgba(6,17,32,0.18)] ring-1 ring-inset ring-white/10 sm:min-h-[360px] sm:rounded-[28px]"
        style={estiloHero}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,17,32,0.96)_0%,rgba(6,17,32,0.84)_35%,rgba(6,17,32,0.36)_64%,rgba(6,17,32,0.04)_100%)]"
        />
        <div className="relative z-10 flex min-h-[360px] max-w-3xl flex-col justify-center px-5 py-8 sm:min-h-[360px] sm:px-8 lg:px-12">
          <h1 className="max-w-2xl text-2xl font-bold tracking-tight text-white min-[430px]:text-3xl lg:text-5xl">
            {titulo}
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/72 lg:text-lg">
            Continua avanzando en tus diplomados y completa tu ruta de aprendizaje.
          </p>
          {cursoSeleccionado ? (
            <div
              className="mt-6 max-w-xl rounded-2xl border border-white/25 bg-[#061120]/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b8f25c]">
                    {cursoSeleccionado.inscripcionId ? "Continuar en" : "Curso recomendado"}
                  </p>
                  <h2 className="mt-1 truncate text-lg font-bold text-white sm:text-xl">
                    {cursoSeleccionado.titulo}
                  </h2>
                </div>

                {cursosInscritos.length > 0 ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="mr-1 text-xs font-semibold tabular-nums text-white/70">
                      {indiceCursoSeguro + 1}/{cursosInscritos.length}
                    </span>
                    <button
                      type="button"
                      aria-label="Curso inscrito anterior"
                      disabled={!hayVariosCursos}
                      onClick={() => seleccionarCurso(-1)}
                      className="grid size-9 place-items-center rounded-full border border-white/35 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Siguiente curso inscrito"
                      disabled={!hayVariosCursos}
                      onClick={() => seleccionarCurso(1)}
                      className="grid size-9 place-items-center rounded-full border border-white/35 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </div>

              {cursoSeleccionado.inscripcionId ? (
                <div className="mt-3 flex items-center gap-3">
                  <div
                    role="progressbar"
                    aria-label={`Progreso de ${cursoSeleccionado.titulo}: ${porcentajeSeleccionado}%`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={porcentajeSeleccionado}
                    className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/20"
                  >
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#91DC00,#2fb9a5)] transition-[width] duration-500"
                      style={{ width: `${porcentajeSeleccionado}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-white">
                    {porcentajeSeleccionado}%
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={hrefContinuar}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#91DC00] px-6 text-sm font-semibold text-[#061120] shadow-[0_10px_24px_rgba(145,220,0,0.24)] transition hover:-translate-y-0.5 hover:bg-[#91DC00]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]"
            >
              Continuar aprendiendo
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
            {mostrarExplorar && (
              <Link
                href={hrefExplorar}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/50 bg-transparent px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]"
              >
                Explorar cursos
              </Link>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

function DashboardGamificadoColaborador({
  nombre,
  cursosActivos,
  controlesCatalogo,
  children,
}: {
  nombre: string | null;
  cursosActivos: CursoCatalogoFila[];
  controlesCatalogo: ReactNode;
  children: ReactNode;
}) {
  const primerNombre = nombre?.trim().split(/\s+/)[0];

  const progresoGeneral =
    cursosActivos.length === 0
      ? 0
      : Math.round(
          cursosActivos.reduce((total, curso) => total + porcentajeCurso(curso), 0) /
            cursosActivos.length,
        );
  const cursosEnCurso = cursosActivos.filter(
    (curso) => !cursoCompletado(curso, porcentajeCurso(curso)),
  ).length;
  const certificados = cursosActivos.filter(
    (curso) => curso.esDiplomado && cursoCompletado(curso, porcentajeCurso(curso)),
  ).length;

  return (
    <div className="w-full space-y-4 text-[var(--interface-text)] sm:space-y-5">
      <div className="flex items-center gap-3 px-1 sm:px-0">
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-sm">
          <UserRound className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white drop-shadow-[0_2px_6px_rgba(2,10,20,0.6)]">
            {primerNombre ? `Hola, ${primerNombre}` : "Hola"}
          </p>
          <p className="text-xs text-white/75 drop-shadow-[0_2px_6px_rgba(2,10,20,0.6)]">
            Tu aprendizaje construye un mejor mañana
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-2 sm:grid-cols-3">
        <div className="flex min-h-14 items-center gap-3 rounded-xl border border-white/15 bg-[rgba(4,15,30,0.55)] px-3 py-2 backdrop-blur-md">
          <AnilloProgreso
            porcentaje={progresoGeneral}
            tamano={36}
            grosor={4}
            claseTrack="stroke-white/20"
            claseProgreso="stroke-[var(--interface-accent)]"
          />
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none text-white">{progresoGeneral}%</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/70">
              Progreso general
            </p>
          </div>
        </div>

        <div className="flex min-h-14 items-center gap-3 rounded-xl border border-white/15 bg-[rgba(4,15,30,0.55)] px-3 py-2 backdrop-blur-md">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[var(--interface-accent-secondary)]">
            <BookOpen className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none text-white">{cursosEnCurso}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/70">
              Cursos activos
            </p>
          </div>
        </div>

        <div className="flex min-h-14 items-center gap-3 rounded-xl border border-white/15 bg-[rgba(4,15,30,0.55)] px-3 py-2 backdrop-blur-md">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[var(--interface-accent)]">
            <Award className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none text-white">{certificados}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/70">
              Certificados
            </p>
          </div>
        </div>
      </div>

      <div className="pt-1 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white drop-shadow-[0_3px_10px_rgba(2,10,20,0.55)] min-[430px]:text-3xl">
          Selecciona tu curso
        </h1>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 sm:text-xs sm:tracking-[0.3em]">
          Explora · Aprende · Transforma
        </p>
      </div>

      {controlesCatalogo}

      {children}
    </div>
  );
}

function ResumenDashboardBusiness({
  nombre,
  activos,
  completados,
  progresoPromedio,
}: {
  nombre: string | null;
  activos: number;
  completados: number;
  progresoPromedio: number;
}) {
  const primerNombre = nombre?.trim().split(/\s+/)[0] ?? "Usuario";

  return (
    <section className="business-dashboard-summary w-full rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] p-5 text-[var(--interface-text)] [box-shadow:var(--interface-shadow)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--interface-accent)]">
            Tu aprendizaje
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-normal sm:text-3xl">
            Bienvenido, {primerNombre}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--interface-text-muted)]">
            Revisa tu avance y continua con las acciones pendientes de tu ruta de formacion.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[520px]">
          <IndicadorBusiness icono={LayoutDashboard} etiqueta="Cursos activos" valor={String(activos)} />
          <IndicadorBusiness icono={CheckCircle2} etiqueta="Completados" valor={String(completados)} />
          <IndicadorBusiness icono={TrendingUp} etiqueta="Progreso" valor={`${progresoPromedio}%`} />
        </div>
      </div>
    </section>
  );
}

function IndicadorBusiness({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: LucideIcon;
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--interface-border)] bg-white/72 p-4 dark:bg-white/[0.04]">
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--interface-text-muted)]">
        <Icono className="size-4 text-[var(--interface-accent)]" aria-hidden="true" />
        {etiqueta}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--interface-text)]">{valor}</p>
    </div>
  );
}

function SelectorCatalogo({
  pagina,
  seccionHome,
  variante = "default",
}: {
  pagina: "home" | "mis-cursos";
  seccionHome: "descubrir" | "diplomados" | "nuevos";
  variante?: VarianteCatalogoVisual;
}) {
  const secciones = [
    { id: "home" as const, label: "Home", href: "/home", seccion: "descubrir" as const },
    { id: "mis-cursos" as const, label: "Mis cursos", href: "/mis-cursos", seccion: null },
    {
      id: "diplomados" as const,
      label: "Diplomados",
      href: "/home?seccion=diplomados",
      seccion: "diplomados" as const,
    },
    {
      id: "nuevos" as const,
      label: "Nuevos",
      href: "/home?seccion=nuevos",
      seccion: "nuevos" as const,
    },
  ];

  return (
    <nav
      aria-label="Secciones principales"
      className={cn(
        "flex max-w-full shrink-0 gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        variante === "adventure" && "snap-x snap-mandatory justify-start lg:justify-center",
      )}
    >
      {secciones.map((seccion) => {
        const activa =
          seccion.id === "mis-cursos"
            ? pagina === "mis-cursos"
            : pagina === "home" && seccion.seccion === seccionHome;

        return (
          <Link
            key={seccion.id}
            href={seccion.href}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-xl transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent)]",
              "min-h-11 px-5 text-sm",
              variante === "adventure" && "snap-start",
              activa
                ? variante === "adventure"
                  ? "border-[#91dc00]/80 bg-[#123b25] text-white shadow-[0_0_0_1px_rgba(145,220,0,0.18),0_0_24px_rgba(145,220,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]"
                  : variante === "educational"
                    ? "border-white/40 bg-[linear-gradient(135deg,#022c22_0%,#065f46_58%,#047857_100%)] text-white shadow-[0_8px_22px_rgba(2,44,34,0.26),inset_0_1px_0_rgba(255,255,255,0.22)]"
                  : "border-white/75 bg-white/30 text-white shadow-[0_8px_22px_rgba(6,17,32,0.14),inset_0_1px_0_rgba(255,255,255,0.65)]"
                : variante === "adventure"
                  ? "border-white/34 bg-[#202b3b]/30 text-white shadow-[0_8px_20px_rgba(6,17,32,0.3),inset_0_1px_0_rgba(255,255,255,0.16)] hover:border-white/60 hover:bg-[#2b394c] hover:text-white"
                  : variante === "educational"
                    ? "border-white/20 bg-[linear-gradient(135deg,rgba(2,44,34,0.88)_0%,rgba(6,95,70,0.82)_58%,rgba(4,120,87,0.76)_100%)] text-white/90 shadow-[0_6px_16px_rgba(2,44,34,0.2),inset_0_1px_0_rgba(255,255,255,0.16)] hover:border-white/40 hover:bg-[linear-gradient(135deg,#022c22_0%,#065f46_58%,#047857_100%)] hover:text-white"
                  : "border-white/30 bg-[#061120]/28 text-white hover:border-white/50 hover:bg-white/22",
            )}
          >
            {seccion.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SelectorSecundario<T extends string>({
  ariaLabel,
  items,
  value,
  onChange,
  variante = "default",
}: {
  ariaLabel: string;
  items: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  variante?: VarianteCatalogoVisual;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        variante === "adventure" && "snap-x snap-mandatory justify-start sm:justify-center",
      )}
    >
      {items.map((item) => {
        const activo = item.id === value;

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(item.id)}
            className={cn(
              "min-h-9 shrink-0 whitespace-nowrap rounded-full border px-4 text-xs font-bold backdrop-blur-lg transition-[transform,background-color,border-color,color] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent)]",
              variante === "adventure" && "snap-start",
              activo
                ? variante === "adventure"
                  ? "border-[#91dc00]/80 bg-[#123b25] text-white shadow-[0_0_0_1px_rgba(145,220,0,0.18),0_0_20px_rgba(145,220,0,0.46),inset_0_1px_0_rgba(255,255,255,0.18)]"
                  : variante === "educational"
                    ? "border-white/40 bg-[linear-gradient(135deg,#022c22_0%,#065f46_58%,#047857_100%)] text-white shadow-[0_6px_16px_rgba(2,44,34,0.22)]"
                  : "border-[#83E6D4]/80 bg-[#83E6D4]/75 text-[#061120]"
                : variante === "adventure"
                  ? "border-white/32 bg-[#202b3b]/30 text-white shadow-[0_6px_16px_rgba(6,17,32,0.28),inset_0_1px_0_rgba(255,255,255,0.14)] hover:border-white/58 hover:bg-[#2b394c] hover:text-white"
                  : variante === "educational"
                    ? "border-white/20 bg-[linear-gradient(135deg,rgba(2,44,34,0.78)_0%,rgba(6,95,70,0.72)_58%,rgba(4,120,87,0.66)_100%)] text-white/86 hover:border-white/38 hover:bg-[linear-gradient(135deg,#022c22_0%,#065f46_58%,#047857_100%)] hover:text-white"
                  : "border-white/25 bg-[#061120]/24 text-white/90 hover:bg-white/20",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function FilaCatalogo({
  titulo,
  cursos,
  mensajeVacio,
  controles,
  ocultarTitulo = false,
  variante = "default",
}: {
  titulo: string;
  cursos: CursoCatalogoFila[];
  mensajeVacio: string;
  controles?: ReactNode;
  ocultarTitulo?: boolean;
  variante?: VarianteCatalogoVisual;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [puedeRetroceder, setPuedeRetroceder] = useState(false);
  const [puedeAvanzar, setPuedeAvanzar] = useState(false);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0);
  const indiceSeguro = cursos.length === 0 ? 0 : Math.min(indiceSeleccionado, cursos.length - 1);

  useEffect(() => {
    const carrusel = carouselRef.current;
    if (!carrusel) return undefined;

    function actualizarLimites() {
      if (!carrusel) return;
      const maximo = carrusel.scrollWidth - carrusel.clientWidth;
      setPuedeRetroceder(carrusel.scrollLeft > 8);
      setPuedeAvanzar(maximo - carrusel.scrollLeft > 8);
    }

    carrusel.scrollTo({ left: 0 });
    actualizarLimites();
    carrusel.addEventListener("scroll", actualizarLimites, { passive: true });
    window.addEventListener("resize", actualizarLimites);

    const observer = new ResizeObserver(actualizarLimites);
    observer.observe(carrusel);

    return () => {
      carrusel.removeEventListener("scroll", actualizarLimites);
      window.removeEventListener("resize", actualizarLimites);
      observer.disconnect();
    };
  }, [cursos]);

  useEffect(() => {
    setIndiceSeleccionado(0);
  }, [cursos]);

  function desplazar(direccion: -1 | 1) {
    const carrusel = carouselRef.current;
    if (!carrusel) return;

    carrusel.scrollBy({
      left: direccion * Math.min(360, carrusel.clientWidth * 0.85),
      behavior: "smooth",
    });
  }

  return (
    <div className="min-w-0 space-y-3">
      {!ocultarTitulo && (
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white drop-shadow-sm">{titulo}</h2>
            {cursos.length > 0 && (
              <p className="mt-1 text-xs font-semibold text-white/65">
                {cursos.length} {cursos.length === 1 ? "curso" : "cursos"}
              </p>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              aria-label="Ver cursos anteriores"
              disabled={!puedeRetroceder}
              onClick={() => desplazar(-1)}
              className="flex size-10 items-center justify-center rounded-full border border-white/35 bg-[#061120]/32 text-white backdrop-blur-xl transition hover:-translate-y-px hover:bg-white/24 disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Ver cursos siguientes"
              disabled={!puedeAvanzar}
              onClick={() => desplazar(1)}
              className="flex size-10 items-center justify-center rounded-full border border-white/35 bg-[#061120]/32 text-white backdrop-blur-xl transition hover:-translate-y-px hover:bg-white/24 disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {controles}

      {cursos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/30 bg-[#061120]/24 px-6 py-8 text-center text-sm font-semibold text-white/80 backdrop-blur-lg">
          {mensajeVacio}
        </p>
      ) : variante === "adventure" ? (
        <div className="space-y-5">
          <div
            tabIndex={0}
            aria-label={`Cursos de ${titulo}`}
            className="flex min-w-0 items-end justify-start gap-3 overflow-x-auto scroll-smooth px-1 pb-5 pt-4 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-[#91DC00]/80 sm:justify-center sm:gap-4 sm:pb-6 sm:pt-7 [&::-webkit-scrollbar]:hidden"
          >
            {cursos.map((curso, indice) => (
              <TarjetaCursoAventuraSeleccionable
                key={curso.id}
                curso={curso}
                seleccionado={indice === indiceSeguro}
                onSeleccionar={() => setIndiceSeleccionado(indice)}
              />
            ))}
          </div>

        </div>
      ) : variante === "educational" ? (
        <div
          ref={carouselRef}
          tabIndex={0}
          aria-label={`Cursos de ${titulo}`}
          className="grid min-w-0 grid-cols-1 gap-4 outline-none focus-visible:ring-2 focus-visible:ring-[#065f46]/70 lg:grid-cols-2"
        >
          {cursos.map((curso) => (
            <TarjetaCursoCatalogoEducativa key={curso.id} curso={curso} />
          ))}
        </div>
      ) : (
        <div className="relative min-w-0">
          <div
            ref={carouselRef}
            tabIndex={0}
            aria-label={`Cursos de ${titulo}`}
            className="flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 pr-4 outline-none [scrollbar-color:rgba(255,255,255,0.32)_transparent] focus-visible:ring-2 focus-visible:ring-[#91DC00]/80 sm:gap-5"
          >
            {cursos.map((curso) => (
              <TarjetaCursoCatalogo key={curso.id} curso={curso} />
            ))}
          </div>

          {puedeRetroceder && (
            <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-12 bg-gradient-to-r from-[#061120]/45 to-transparent md:block" />
          )}
          {puedeAvanzar && (
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-[#061120]/45 to-transparent md:block" />
          )}
        </div>
      )}
    </div>
  );
}

function TarjetaCursoAventuraSeleccionable({
  curso,
  seleccionado,
  onSeleccionar,
}: {
  curso: CursoCatalogoFila;
  seleccionado: boolean;
  onSeleccionar: () => void;
}) {
  const porcentaje = porcentajeCurso(curso);
  const completado = cursoCompletado(curso, porcentaje);
  const inscrito = Boolean(curso.inscripcionId);
  const hrefDestino = inscrito
    ? completado
      ? `/mis-cursos/${curso.id}`
      : hrefContinuarCurso(curso.id)
    : `/mis-cursos/${curso.id}/informacion`;

  return (
    <article
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-[26px] text-left transition-all duration-300",
        seleccionado
          ? "w-[min(74vw,230px)] -translate-y-2 border-2 border-[var(--interface-accent)] shadow-[0_0_32px_rgba(79,138,0,0.55),0_22px_44px_rgba(2,10,6,0.45)] sm:w-[220px] sm:-translate-y-3"
          : "w-[min(62vw,190px)] border border-white/15 opacity-80 hover:-translate-y-1 hover:opacity-100 sm:w-[176px]",
      )}
    >
      <button
        type="button"
        onClick={onSeleccionar}
        aria-pressed={seleccionado}
        aria-label={`Seleccionar ${curso.titulo}`}
        className="flex w-full flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#91dc00]"
      >
        <div
          className={cn(
            "relative w-full shrink-0 overflow-hidden bg-white/5",
            seleccionado ? "h-[270px] sm:h-[250px]" : "h-[235px] sm:h-[215px]",
          )}
        >
        <PortadaCurso
          cursoId={curso.id}
          imagenPortadaUrl={curso.imagenPortadaUrl}
          esDiplomado={curso.esDiplomado}
          titulo={curso.titulo}
          fallback="abstract"
          className={cn("absolute inset-0 rounded-none object-cover", !inscrito && "grayscale-[0.25]")}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,16,0.05)_35%,rgba(2,8,16,0.85)_100%)]"
        />
        {!inscrito && (
          <span className="absolute right-3.5 top-3.5 grid size-9 place-items-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur-sm">
            <Lock className="size-4" aria-hidden="true" />
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3.5 sm:p-4">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-white/15 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {curso.esDiplomado ? (
              <GraduationCap className="size-3.5" aria-hidden="true" />
            ) : (
              <BookOpen className="size-3.5" aria-hidden="true" />
            )}
            {curso.esDiplomado ? "Diplomado" : "Curso"}
          </span>
          <p className="line-clamp-2 text-sm font-bold leading-snug text-white min-[430px]:text-base sm:text-lg">
            {curso.titulo}
          </p>
        </div>
        </div>

        <div
          className={cn(
            "flex flex-col gap-1.5 px-4 py-3.5",
            seleccionado ? "bg-[#04140d]" : "bg-[rgba(4,15,10,0.85)]",
          )}
        >
        {inscrito ? (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--interface-accent),var(--interface-accent-secondary))]"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-white/70">
              {completado ? "Completado" : `${porcentaje}% completado`}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-white/85">Disponible</p>
            <p className="text-xs text-white/55">Explora este recorrido</p>
          </>
        )}
        </div>
      </button>

      {seleccionado && (
        <Link
          href={hrefDestino}
          aria-label={`${inscrito ? "Continuar" : "Explorar"} ${curso.titulo}`}
          className="absolute left-1/2 top-[42%] z-20 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#b8f25c] bg-[#123b25] text-white shadow-[0_0_0_7px_rgba(145,220,0,0.16),0_0_30px_rgba(145,220,0,0.72),0_12px_28px_rgba(2,10,6,0.5)] transition-[transform,background-color,box-shadow] duration-200 hover:scale-110 hover:bg-[#195231] hover:shadow-[0_0_0_9px_rgba(145,220,0,0.2),0_0_38px_rgba(145,220,0,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#123b25]"
        >
          <Play className="ml-1 size-7 fill-current" aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}

function TarjetaCursoCatalogoEducativa({ curso }: { curso: CursoCatalogoFila }) {
  const porcentaje = porcentajeCurso(curso);
  const inscrito = Boolean(curso.inscripcionId);
  const completado = cursoCompletado(curso, porcentaje);
  const nivel = normalizarNivel(curso.nivelDificultad) ?? curso.nivelDificultad;
  const hrefDestino = !inscrito
    ? `/mis-cursos/${curso.id}/informacion`
    : completado
      ? `/mis-cursos/${curso.id}`
      : hrefContinuarCurso(curso.id);
  const textoAccion = inscrito && completado ? "Revisar curso" : inscrito ? "Continuar" : "Conocer curso";

  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#ded4bf] bg-[#fffdf7]/95 p-5 text-[#061120] shadow-[0_8px_22px_rgba(61,45,20,0.1)] transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-[#cfc2aa] hover:shadow-[0_14px_34px_rgba(61,45,20,0.14)] sm:p-6">
      {inscrito && <BotonDesinscribirmePrueba cursoId={curso.id} />}
      <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#e6ddc8] sm:w-48 sm:shrink-0">
          <PortadaCurso
            cursoId={curso.id}
            imagenPortadaUrl={curso.imagenPortadaUrl}
            esDiplomado={curso.esDiplomado}
            titulo={curso.titulo}
            fallback="abstract"
            className="absolute inset-0 rounded-none object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#0b3d2e] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              {curso.esDiplomado ? "Diplomado" : "Curso"}
            </span>
            <span className="rounded-full bg-[#efe8d8] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#6f644e]">
              {capitalizar(nivel)}
            </span>
          </div>

          <h3 className="line-clamp-2 text-lg font-bold uppercase leading-tight tracking-wide sm:text-xl">
            {curso.titulo}
          </h3>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="text-[#6f644e]">Progreso</span>
              <span className="font-bold tabular-nums text-[#061120]">{porcentaje}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#ded8ca]">
              <div
                className="h-full rounded-full bg-[#91DC00] transition-[width] duration-500"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>

          <div className="mt-5">
            <Link
              href={hrefDestino}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#91DC00] px-5 text-sm font-medium text-[#061120] transition hover:-translate-y-0.5 hover:bg-[#91DC00]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2"
            >
              {textoAccion}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function BarraSuperior({
  nombre,
  onSeleccionarCategoria,
  seccionActiva,
  escuelaActiva,
}: {
  nombre: string | null;
  onSeleccionarCategoria?: (categoria: string) => void;
  seccionActiva?: CatalogSection;
  escuelaActiva?: EscuelaCatalogo;
}) {
  const { config } = useInterfaceVariant();
  // Pedido explícito: en educational esta barra se aparta del ivory/dorado
  // del resto de la interfaz — degradado verde esmeralda oscuro con texto
  // blanco (corrección sobre un primer intento en azul sólido). Es una
  // desviación deliberada, no una filtración de otra variante.
  const esEducational = config.id === "educational";
  const primerNombre = nombre?.trim().split(/\s+/)[0] ?? "Usuario";
  const claseDegradadoEsmeralda = "bg-[linear-gradient(135deg,#022c22_0%,#065f46_60%,#047857_100%)]";

  return (
    <div className="flex w-full flex-col items-start gap-4 xl:flex-row xl:flex-wrap xl:items-center xl:justify-start">
      <label
        className={cn(
          "flex min-h-12 w-full items-center gap-3 rounded-full px-5 xl:max-w-md",
          esEducational
            ? cn("border border-white/25 text-white", claseDegradadoEsmeralda)
            : CLASE_PANEL_GLASS,
        )}
      >
        <Search className="size-5 shrink-0" aria-hidden="true" />
        <span className="sr-only">Buscar cursos, temas o habilidades</span>
        <input
          type="search"
          placeholder="Buscar cursos, temas o habilidades"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-sm font-medium focus:outline-none",
            esEducational ? "placeholder:text-white/65" : "placeholder:text-[#061120]/60",
          )}
        />
      </label>

      <nav aria-label="Categorias de cursos" className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
        {CATEGORIAS.map((categoria) => {
          const escuela = ESCUELA_POR_CATEGORIA[categoria as keyof typeof ESCUELA_POR_CATEGORIA];
          const activo = escuela
            ? seccionActiva === "categoria" && escuelaActiva === escuela
            : seccionActiva !== "categoria";
          return (
            <button
              key={categoria}
              type="button"
              onClick={() => onSeleccionarCategoria?.(categoria)}
              aria-pressed={activo}
              className={cn(
                "min-h-11 whitespace-nowrap rounded-full border px-6 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl transition-colors",
                esEducational
                  ? activo
                    ? cn("border-white text-white", claseDegradadoEsmeralda)
                    : "border-white/30 bg-[#047857]/70 text-white hover:bg-[#059669]/80"
                  : activo
                    ? "border-white/70 bg-white/82 text-[#061120]"
                    : "border-white/30 bg-white/18 text-white hover:bg-white/28",
              )}
            >
              {categoria}
            </button>
          );
        })}
      </nav>

      <div className="flex w-full items-center justify-start gap-3 xl:ml-auto xl:w-auto">
        <button
          type="button"
          aria-label="Notificaciones"
          className={cn(
            "relative flex size-12 shrink-0 items-center justify-center rounded-full",
            esEducational
              ? cn("border border-white/25 text-white", claseDegradadoEsmeralda)
              : cn("text-[#061120]", CLASE_PANEL_GLASS),
          )}
        >
          <Bell className="size-5" aria-hidden="true" />
          <span
            className={cn(
              "absolute right-2.5 top-2.5 size-2.5 rounded-full",
              esEducational ? "bg-white" : "bg-[#91DC00]",
            )}
          />
        </button>
        <Link
          href="/mis-cursos/perfil"
          className={cn(
            "flex min-h-12 items-center gap-3 rounded-full px-3 py-2 transition-colors",
            esEducational
              ? cn("border border-white/25 text-white hover:brightness-110", claseDegradadoEsmeralda)
              : cn("text-[#061120] hover:bg-white/32", CLASE_PANEL_GLASS),
          )}
        >
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              esEducational ? "bg-white text-[#065f46]" : "bg-[#061120] text-white",
            )}
          >
            {primerNombre.charAt(0).toUpperCase()}
          </span>
          <span className="hidden min-w-0 leading-tight sm:block">
            <span className="block truncate text-sm font-bold">{nombre ?? "Usuario"}</span>
            <span className={cn("block text-xs font-medium", esEducational ? "text-white/70" : "text-[#061120]/65")}>
              Estudiante
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function HeroDestacado({ cursos }: { cursos: CursoCatalogoFila[] }) {
  const { config } = useInterfaceVariant();
  const router = useRouter();
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [mostrarDescripcion, setMostrarDescripcion] = useState(false);

  const indiceSeguro =
    cursos.length === 0 ? 0 : Math.min(indiceActivo, cursos.length - 1);
  const curso = cursos[indiceSeguro] ?? cursos[0];
  if (!curso) return null;

  const inscrito = Boolean(curso.inscripcionId);
  const porcentaje = porcentajeCurso(curso);
  const descripcion =
    curso.descripcion?.trim() || "Continua tu ruta de aprendizaje con una nueva mision.";
  const completado = cursoCompletado(curso, porcentaje);
  const textoAccion = inscrito
    ? completado
      ? "Revisar curso"
      : "Continuar"
    : "Conocer programa";
  const hrefInformacion = `/mis-cursos/${curso.id}/informacion`;
  const hrefCurso = completado ? `/mis-cursos/${curso.id}` : hrefContinuarCurso(curso.id);
  const hayVariosCursos = cursos.length > 1;

  if (config.hero.variant === "corporate") {
    return (
      <HeroDestacadoBusiness
        curso={curso}
        inscrito={inscrito}
        porcentaje={porcentaje}
        descripcion={descripcion}
        completado={completado}
        textoAccion={textoAccion}
        hrefCurso={hrefCurso}
        hrefInformacion={hrefInformacion}
        indiceSeguro={indiceSeguro}
        totalCursos={cursos.length}
        hayVariosCursos={hayVariosCursos}
        mostrarDescripcion={mostrarDescripcion}
        onAlternarDescripcion={(evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          setMostrarDescripcion((valor) => !valor);
        }}
        onCursoAnterior={(evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          setMostrarDescripcion(false);
          setIndiceActivo((actual) => {
            const base = Math.min(actual, cursos.length - 1);
            return (base - 1 + cursos.length) % cursos.length;
          });
        }}
        onCursoSiguiente={(evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          setMostrarDescripcion(false);
          setIndiceActivo((actual) => {
            const base = Math.min(actual, cursos.length - 1);
            return (base + 1) % cursos.length;
          });
        }}
      />
    );
  }

  if (config.hero.variant === "quest") {
    return (
      <HeroDestacadoGamified
        curso={curso}
        inscrito={inscrito}
        porcentaje={porcentaje}
        descripcion={descripcion}
        completado={completado}
        textoAccion={textoAccion}
        hrefCurso={hrefCurso}
        hrefInformacion={hrefInformacion}
      />
    );
  }

  if (config.hero.variant === "academic") {
    return (
      <HeroDestacadoEducational
        curso={curso}
        inscrito={inscrito}
        porcentaje={porcentaje}
        descripcion={descripcion}
        completado={completado}
        textoAccion={textoAccion}
        hrefCurso={hrefCurso}
        hrefInformacion={hrefInformacion}
      />
    );
  }

  function cambiarCurso(delta: number) {
    if (!hayVariosCursos) return;
    setMostrarDescripcion(false);
    setIndiceActivo((actual) => {
      const base = Math.min(actual, cursos.length - 1);
      return (base + delta + cursos.length) % cursos.length;
    });
  }

  function alternarDescripcion(evento: MouseEvent<HTMLButtonElement>) {
    evento.preventDefault();
    evento.stopPropagation();
    setMostrarDescripcion((valor) => !valor);
  }

  function activarCurso() {
    if (inscrito) return;
    router.push(hrefInformacion);
  }

  function activarConTeclado(evento: KeyboardEvent<HTMLElement>) {
    if (evento.key !== "Enter" && evento.key !== " ") return;
    evento.preventDefault();
    activarCurso();
  }

  const contenido = (
    <div className="relative flex min-h-[220px] flex-col justify-between gap-5 p-5 text-white sm:min-h-[240px] sm:p-6 lg:p-7">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md">
          <Flame className="size-3.5 text-orange-300" aria-hidden="true" />
          Tendencia
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full border border-white/35 bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md">
            <Bookmark className="size-4" aria-hidden="true" />
          </span>
          {inscrito && (
            <div className="relative flex size-14 items-center justify-center">
              <AnilloProgreso porcentaje={porcentaje} tamano={56} grosor={5} className="absolute inset-0" />
              <span className="font-display text-xs font-bold text-white">{porcentaje}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl text-left">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/30 bg-white/18 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            {curso.esDiplomado ? "Diplomado" : "Curso"}
          </span>
          <span className="rounded-full border border-white/25 bg-white/14 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md">
            Mejora personal
          </span>
        </div>
        <h1 className="font-display text-2xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-[1.75rem]">
          {curso.titulo}
        </h1>
        <p
          id={`descripcion-hero-${curso.id}`}
          className={cn(
            "mt-2 max-w-xl text-sm font-medium leading-6 text-white/88",
            mostrarDescripcion ? "whitespace-pre-wrap" : "line-clamp-2",
          )}
        >
          {descripcion}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {inscrito ? (
            <Link
              href={hrefCurso}
              className="inline-flex min-h-10 items-center gap-2.5 rounded-full bg-white px-5 text-sm font-bold text-[#061120] shadow-[0_8px_20px_rgba(6,17,32,0.18)] transition-transform duration-300 hover:scale-[1.02]"
            >
              <Play className="size-4 fill-[#061120]" aria-hidden="true" />
              {textoAccion}
            </Link>
          ) : (
            <span className="inline-flex min-h-10 items-center gap-2.5 rounded-full bg-white px-5 text-sm font-bold text-[#061120] shadow-[0_8px_20px_rgba(6,17,32,0.18)] transition-transform duration-300 group-hover:scale-[1.02]">
              <Play className="size-4 fill-[#061120]" aria-hidden="true" />
              {textoAccion}
            </span>
          )}
          <button
            type="button"
            aria-expanded={mostrarDescripcion}
            aria-controls={`descripcion-hero-${curso.id}`}
            onClick={alternarDescripcion}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md transition-colors",
              mostrarDescripcion
                ? "border-white/70 bg-white/30"
                : "border-white/45 bg-white/16 hover:bg-white/24",
            )}
          >
            <BookOpen className="size-4" aria-hidden="true" />
            Descripcion del curso
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {hayVariosCursos && (
          <span className="mr-1 hidden text-xs font-semibold text-white/70 sm:inline">
            {indiceSeguro + 1}/{cursos.length}
          </span>
        )}
        <button
          type="button"
          aria-label="Curso anterior"
          disabled={!hayVariosCursos}
          onClick={(evento) => {
            evento.preventDefault();
            evento.stopPropagation();
            cambiarCurso(-1);
          }}
          className={cn(
            "flex size-9 items-center justify-center rounded-full border border-white/35 bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md transition-colors",
            hayVariosCursos ? "hover:bg-white/30" : "cursor-not-allowed opacity-40",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Siguiente curso"
          disabled={!hayVariosCursos}
          onClick={(evento) => {
            evento.preventDefault();
            evento.stopPropagation();
            cambiarCurso(1);
          }}
          className={cn(
            "flex size-9 items-center justify-center rounded-full border border-white/35 bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md transition-colors",
            hayVariosCursos ? "hover:bg-white/30" : "cursor-not-allowed opacity-40",
          )}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  const claseHero = cn(
    "group relative block w-full max-w-5xl overflow-hidden rounded-[28px] outline-none",
    CLASE_HERO_PANEL,
    "focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]",
  );

  if (inscrito) {
    return (
      <article data-hero-variant={config.hero.variant} className={claseHero}>
        {contenido}
      </article>
    );
  }

  return (
    <article
      data-hero-variant={config.hero.variant}
      role="button"
      tabIndex={0}
      onClick={activarCurso}
      onKeyDown={activarConTeclado}
      className={cn(claseHero, "cursor-pointer text-left")}
    >
      {contenido}
    </article>
  );
}

function HeroDestacadoGamified({
  curso,
  inscrito,
  porcentaje,
  descripcion,
  completado,
  textoAccion,
  hrefCurso,
  hrefInformacion,
}: {
  curso: CursoCatalogoFila;
  inscrito: boolean;
  porcentaje: number;
  descripcion: string;
  completado: boolean;
  textoAccion: string;
  hrefCurso: string;
  hrefInformacion: string;
}) {
  const hrefDestino = inscrito ? hrefCurso : hrefInformacion;

  return (
    <article
      data-hero-variant="quest"
      style={estiloFondoInterfaz("gamified", "heroBackground")}
      className="gamified-hero relative grid w-full overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] [box-shadow:var(--interface-shadow)] lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.95fr)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(103,232,249,0.16),transparent_45%)]"
      />
      <div className="relative z-10 min-w-0 p-5 sm:p-6 lg:p-7">
        <div className="flex flex-wrap gap-2">
          <ChipGamified icono={curso.esDiplomado ? GraduationCap : BookOpen} texto={curso.esDiplomado ? "Diplomado" : "Curso"} />
          {completado && <ChipGamified icono={CheckCircle2} texto="Completado" />}
          {!completado && inscrito && <ChipGamified icono={Flame} texto="Mision en curso" />}
        </div>

        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--interface-accent-secondary)]">
          Mision actual
        </p>
        <h2 className="mt-2 max-w-3xl text-2xl font-bold leading-tight tracking-normal sm:text-3xl lg:text-[2.35rem]">
          {curso.titulo}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--interface-text-muted)] sm:text-base">
          {descripcion}
        </p>

        <div className="mt-6 rounded-2xl border border-[var(--interface-border)] bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold">
            <span className="text-[var(--interface-text-muted)]">Progreso</span>
            <span className="tabular-nums">{porcentaje}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--interface-accent),var(--interface-accent-secondary))] shadow-[0_0_14px_rgba(103,232,249,0.5)] transition-[width] duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        <Link
          href={hrefDestino}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--interface-accent)] px-5 text-sm font-bold text-[#06201c] transition hover:-translate-y-0.5 hover:bg-[var(--interface-accent-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]"
        >
          {inscrito ? "Continuar mision" : textoAccion}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative min-h-[240px] border-t border-[var(--interface-border)] lg:border-l lg:border-t-0">
        <PortadaCurso
          cursoId={curso.id}
          imagenPortadaUrl={curso.imagenPortadaUrl}
          esDiplomado={curso.esDiplomado}
          titulo={curso.titulo}
          fallback="abstract"
          className="absolute inset-3 rounded-2xl border border-[var(--interface-border)] object-cover"
        />
      </div>
    </article>
  );
}

function ChipGamified({ icono: Icono, texto }: { icono: LucideIcon; texto: string }) {
  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--interface-border)] bg-white/[0.05] px-3 text-xs font-bold text-[var(--interface-text)]">
      <Icono className="size-4 text-[var(--interface-accent-secondary)]" aria-hidden="true" />
      {texto}
    </span>
  );
}

function HeroDestacadoEducational({
  curso,
  inscrito,
  porcentaje,
  descripcion,
  completado,
  textoAccion,
  hrefCurso,
  hrefInformacion,
}: {
  curso: CursoCatalogoFila;
  inscrito: boolean;
  porcentaje: number;
  descripcion: string;
  completado: boolean;
  textoAccion: string;
  hrefCurso: string;
  hrefInformacion: string;
}) {
  const hrefDestino = inscrito ? hrefCurso : hrefInformacion;
  const nivel = normalizarNivel(curso.nivelDificultad) ?? curso.nivelDificultad;

  return (
    <article
      data-hero-variant="academic"
      style={estiloFondoInterfaz("educational", "heroBackground")}
      className="educational-hero grid w-full overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] [box-shadow:var(--interface-shadow)] lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,0.75fr)]"
    >
      <div className="min-w-0 p-5 sm:p-6 lg:p-7">
        <div className="flex flex-wrap gap-2">
          <ChipAcademico icono={curso.esDiplomado ? GraduationCap : BookOpen} texto={curso.esDiplomado ? "Diplomado" : "Curso"} />
          <ChipAcademico icono={Gauge} texto={capitalizar(nivel)} />
          {completado && <ChipAcademico icono={CheckCircle2} texto="Completado" />}
        </div>

        <h2 className="mt-5 max-w-3xl text-2xl font-bold leading-tight tracking-normal sm:text-3xl lg:text-[2.35rem]">
          {curso.titulo}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--interface-text-muted)] sm:text-base">
          {descripcion}
        </p>

        <div className="mt-6 rounded-2xl border border-[var(--interface-border)] bg-[var(--interface-surface)] p-4">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold">
            <span className="text-[var(--interface-text-muted)]">Progreso de aprendizaje</span>
            <span className="tabular-nums">{porcentaje}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--interface-border)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--interface-accent),var(--interface-accent-secondary))]"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        <Link
          href={hrefDestino}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--interface-accent)] px-5 text-sm font-bold text-[var(--interface-accent-foreground)] transition hover:-translate-y-0.5 hover:bg-[var(--interface-accent-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]"
        >
          {inscrito ? "Continuar con la siguiente leccion" : textoAccion}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative min-h-[220px] border-t border-[var(--interface-border)] bg-[#f8fafa] lg:border-l lg:border-t-0 dark:bg-white/[0.04]">
        <PortadaCurso
          cursoId={curso.id}
          imagenPortadaUrl={curso.imagenPortadaUrl}
          esDiplomado={curso.esDiplomado}
          titulo={curso.titulo}
          fallback="abstract"
          className="absolute inset-4 rounded-2xl border border-[var(--interface-border)] object-cover"
        />
      </div>
    </article>
  );
}

function ChipAcademico({ icono: Icono, texto }: { icono: LucideIcon; texto: string }) {
  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--interface-border)] bg-[var(--interface-surface)] px-3 text-xs font-bold text-[var(--interface-text)]">
      <Icono className="size-4 text-[var(--interface-accent)]" aria-hidden="true" />
      {texto}
    </span>
  );
}

function HeroDestacadoBusiness({
  curso,
  inscrito,
  porcentaje,
  descripcion,
  completado,
  textoAccion,
  hrefCurso,
  hrefInformacion,
  indiceSeguro,
  totalCursos,
  hayVariosCursos,
  mostrarDescripcion,
  onAlternarDescripcion,
  onCursoAnterior,
  onCursoSiguiente,
}: {
  curso: CursoCatalogoFila;
  inscrito: boolean;
  porcentaje: number;
  descripcion: string;
  completado: boolean;
  textoAccion: string;
  hrefCurso: string;
  hrefInformacion: string;
  indiceSeguro: number;
  totalCursos: number;
  hayVariosCursos: boolean;
  mostrarDescripcion: boolean;
  onAlternarDescripcion: (evento: MouseEvent<HTMLButtonElement>) => void;
  onCursoAnterior: (evento: MouseEvent<HTMLButtonElement>) => void;
  onCursoSiguiente: (evento: MouseEvent<HTMLButtonElement>) => void;
}) {
  const hrefDestino = inscrito ? hrefCurso : hrefInformacion;
  // Pedido explícito: reutiliza la estructura del hero de creative (badge de
  // tendencia, marcador, anillo circular, carrusel con contador y flechas,
  // descripción plegable) porque la referencia visual de business es casi
  // idéntica — solo cambian los tokens de color (navy/cyan en vez del verde
  // de marca) y el fondo, que queda translúcido para dejar ver el mismo
  // --interface-bg-image del resto del dashboard empresarial en vez de
  // duplicarlo en un asset de hero aparte.
  return (
    <article
      data-hero-variant="corporate"
      className="business-hero group relative flex w-full min-h-[220px] flex-col justify-between gap-5 overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[color-mix(in_srgb,#04101c_78%,transparent)] p-5 text-white backdrop-blur-md [box-shadow:var(--interface-shadow)] sm:min-h-[240px] sm:p-6 lg:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
          <TrendingUp className="size-3.5 text-[var(--interface-accent-secondary)]" aria-hidden="true" />
          Tendencia
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md">
            <Bookmark className="size-4" aria-hidden="true" />
          </span>
          {inscrito && (
            <div className="relative flex size-14 items-center justify-center">
              <AnilloProgreso
                porcentaje={porcentaje}
                tamano={56}
                grosor={5}
                className="absolute inset-0"
                claseTrack="stroke-white/20"
                claseProgreso="stroke-[var(--interface-accent-secondary)]"
              />
              <span className="font-display text-xs font-bold text-white">{porcentaje}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl text-left">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            {curso.esDiplomado ? "Diplomado" : "Curso"}
          </span>
          <span className="rounded-full border border-white/15 bg-white/[0.07] px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md">
            Mejora personal
          </span>
          {completado && (
            <span className="rounded-full border border-[var(--interface-accent-secondary)]/40 bg-[color-mix(in_srgb,var(--interface-accent-secondary)_18%,transparent)] px-2.5 py-1 text-[11px] font-semibold text-[var(--interface-accent-secondary)]">
              Completado
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-3xl">
          {curso.titulo}
        </h1>
        <p
          id={`descripcion-hero-business-${curso.id}`}
          className={cn(
            "mt-2 max-w-xl text-sm leading-6 text-white/80",
            mostrarDescripcion ? "whitespace-pre-wrap" : "line-clamp-2",
          )}
        >
          {descripcion}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Link
            href={hrefDestino}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--interface-accent),var(--interface-accent-secondary))] px-5 text-sm font-bold text-[var(--interface-accent-foreground)] shadow-[0_8px_20px_rgba(6,17,32,0.35)] transition-transform duration-300 hover:scale-[1.02]"
          >
            <Play className="size-4 fill-current" aria-hidden="true" />
            {textoAccion}
          </Link>
          <button
            type="button"
            aria-expanded={mostrarDescripcion}
            aria-controls={`descripcion-hero-business-${curso.id}`}
            onClick={onAlternarDescripcion}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold text-white backdrop-blur-md transition-colors",
              mostrarDescripcion
                ? "border-white/50 bg-white/15"
                : "border-white/25 bg-white/5 hover:bg-white/12",
            )}
          >
            <BookOpen className="size-4" aria-hidden="true" />
            Descripcion del curso
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {hayVariosCursos && (
          <span className="mr-1 hidden text-xs font-semibold text-white/60 sm:inline">
            {indiceSeguro + 1}/{totalCursos}
          </span>
        )}
        <button
          type="button"
          aria-label="Curso anterior"
          disabled={!hayVariosCursos}
          onClick={onCursoAnterior}
          className={cn(
            "flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors",
            hayVariosCursos ? "hover:bg-white/20" : "cursor-not-allowed opacity-40",
          )}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Siguiente curso"
          disabled={!hayVariosCursos}
          onClick={onCursoSiguiente}
          className={cn(
            "flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors",
            hayVariosCursos ? "hover:bg-white/20" : "cursor-not-allowed opacity-40",
          )}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function TarjetaCursoCatalogo({ curso }: { curso: CursoCatalogoFila }) {
  const { config } = useInterfaceVariant();
  const inscrito = Boolean(curso.inscripcionId);
  const porcentaje = porcentajeCurso(curso);
  const completado = cursoCompletado(curso, porcentaje);
  const textoAccion = inscrito && completado
    ? "Revisar curso"
    : inscrito
      ? "Continuar"
      : "Conocer curso";
  const hrefDestino = `/mis-cursos/${curso.id}/informacion`;

  const contenido = (
    <ContenidoTarjetaCurso
      curso={curso}
      porcentaje={porcentaje}
      completado={completado}
      mostrarProgreso={inscrito}
      textoAccion={textoAccion}
    />
  );

  if (config.catalog.cardVariant === "business") {
    return (
      <Link
        data-catalog-card="business"
        href={hrefDestino}
        aria-label={`${textoAccion}: ${curso.titulo}`}
        className="business-course-card group relative flex min-h-[330px] w-[min(88vw,310px)] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-left text-[var(--interface-text)] [box-shadow:var(--interface-card-shadow)] outline-none transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--interface-accent)_50%,transparent)] hover:[box-shadow:var(--interface-glow)] focus-visible:ring-2 focus-visible:ring-[var(--interface-accent)]"
      >
        <ContenidoTarjetaCursoBusiness
          curso={curso}
          porcentaje={porcentaje}
          completado={completado}
          mostrarProgreso={inscrito}
          textoAccion={textoAccion}
        />
        {inscrito && <BotonDesinscribirmePrueba cursoId={curso.id} />}
      </Link>
    );
  }

  if (config.catalog.cardVariant === "game") {
    return (
      <Link
        data-catalog-card="game"
        href={hrefDestino}
        aria-label={`${textoAccion}: ${curso.titulo}`}
        className="gamified-course-card group relative flex min-h-[350px] w-[min(88vw,318px)] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-left text-[var(--interface-text)] [box-shadow:var(--interface-shadow)] outline-none transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[var(--interface-accent-secondary)] hover:shadow-[0_0_0_1px_var(--interface-accent-secondary),0_18px_40px_rgba(103,232,249,0.14)] focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]"
      >
        <ContenidoTarjetaCursoGamified
          curso={curso}
          porcentaje={porcentaje}
          completado={completado}
          mostrarProgreso={inscrito}
          textoAccion={textoAccion}
        />
        {inscrito && <BotonDesinscribirmePrueba cursoId={curso.id} />}
      </Link>
    );
  }

  if (config.catalog.cardVariant === "academic") {
    return (
      <Link
        data-catalog-card="academic"
        href={hrefDestino}
        aria-label={`${textoAccion}: ${curso.titulo}`}
        className="educational-course-card group relative flex min-h-[350px] w-[min(88vw,318px)] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-hero-border)] bg-[var(--interface-surface-strong)] text-left text-[var(--interface-text)] [box-shadow:var(--interface-card-shadow)] outline-none transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--interface-accent-secondary)_55%,transparent)] hover:[box-shadow:var(--interface-glow)] focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]"
      >
        <ContenidoTarjetaCursoEducational
          curso={curso}
          porcentaje={porcentaje}
          completado={completado}
          mostrarProgreso={inscrito}
          textoAccion={textoAccion}
        />
        {inscrito && <BotonDesinscribirmePrueba cursoId={curso.id} />}
      </Link>
    );
  }

  return (
    <Link
      data-catalog-card={config.catalog.cardVariant}
      href={hrefDestino}
      aria-label={`${textoAccion}: ${curso.titulo}`}
      className={CLASE_TARJETA_GLASS}
    >
      {contenido}
      {inscrito && <BotonDesinscribirmePrueba cursoId={curso.id} />}
    </Link>
  );
}

function ContenidoTarjetaCursoGamified({
  curso,
  porcentaje,
  completado,
  mostrarProgreso,
  textoAccion,
}: {
  curso: CursoCatalogoFila;
  porcentaje: number;
  completado: boolean;
  mostrarProgreso: boolean;
  textoAccion: string;
}) {
  const nivel = normalizarNivel(curso.nivelDificultad) ?? curso.nivelDificultad;
  const esNuevo =
    !mostrarProgreso &&
    Date.now() - new Date(curso.createdAt).getTime() < NEW_COURSE_DAYS * 24 * 60 * 60 * 1000;

  return (
    <>
      <div className="relative h-36 shrink-0 bg-white/[0.03]">
        <PortadaCurso
          cursoId={curso.id}
          imagenPortadaUrl={curso.imagenPortadaUrl}
          esDiplomado={curso.esDiplomado}
          titulo={curso.titulo}
          fallback="abstract"
          className="absolute inset-0 rounded-none object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
        <span className="absolute right-2.5 top-2.5 rounded-full border border-[var(--interface-border)] bg-black/45 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {capitalizar(nivel)}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-[var(--interface-text)]">
          {curso.titulo}
        </h3>
        <p className="mt-2 text-xs font-semibold text-[var(--interface-text-muted)]">
          {curso.esDiplomado ? "Diplomado" : "Curso"}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {completado && (
            <span
              className="w-fit rounded-lg px-2.5 py-1 text-xs font-bold text-[var(--interface-accent)]"
              style={{
                backgroundColor: "color-mix(in srgb, var(--interface-accent) 15%, transparent)",
              }}
            >
              Completado
            </span>
          )}
          {!completado && mostrarProgreso && (
            <span
              className="w-fit rounded-lg px-2.5 py-1 text-xs font-bold text-[var(--interface-accent-secondary)]"
              style={{
                backgroundColor: "color-mix(in srgb, var(--interface-accent-secondary) 15%, transparent)",
              }}
            >
              En progreso
            </span>
          )}
          {esNuevo && (
            <span
              className="w-fit rounded-lg px-2.5 py-1 text-xs font-bold text-[var(--interface-accent)]"
              style={{
                backgroundColor: "color-mix(in srgb, var(--interface-accent) 15%, transparent)",
              }}
            >
              Nuevo
            </span>
          )}
        </div>

        <div className="mt-auto pt-5">
          {mostrarProgreso ? (
            <>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--interface-text-muted)]">Progreso</span>
                <span className="tabular-nums">{porcentaje}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--interface-accent),var(--interface-accent-secondary))] shadow-[0_0_10px_rgba(103,232,249,0.4)]"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs font-semibold text-[var(--interface-text-muted)]">
              Disponible para comenzar
            </p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-[var(--interface-border)] pt-3 text-sm font-bold text-[var(--interface-accent-secondary)]">
            <span>{textoAccion}</span>
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </div>
        </div>
      </div>
    </>
  );
}

function ContenidoTarjetaCursoEducational({
  curso,
  porcentaje,
  completado,
  mostrarProgreso,
  textoAccion,
}: {
  curso: CursoCatalogoFila;
  porcentaje: number;
  completado: boolean;
  mostrarProgreso: boolean;
  textoAccion: string;
}) {
  const nivel = normalizarNivel(curso.nivelDificultad) ?? curso.nivelDificultad;

  return (
    <>
      <div className="relative h-36 shrink-0 bg-[#f8fafa] dark:bg-white/[0.04]">
        <PortadaCurso
          cursoId={curso.id}
          imagenPortadaUrl={curso.imagenPortadaUrl}
          esDiplomado={curso.esDiplomado}
          titulo={curso.titulo}
          fallback="abstract"
          className="absolute inset-0 rounded-none object-cover transition-transform duration-200 group-hover:scale-[1.01]"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-[var(--interface-text)]">
          {curso.titulo}
        </h3>
        <p className="mt-2 text-xs font-semibold text-[var(--interface-text-muted)]">
          {curso.esDiplomado ? "Diplomado" : "Curso"} · {capitalizar(nivel)}
        </p>
        {completado && (
          <span
            className="mt-3 w-fit rounded-lg px-2.5 py-1 text-xs font-bold text-[var(--interface-accent)]"
            style={{
              backgroundColor: "color-mix(in srgb, var(--interface-accent) 10%, transparent)",
            }}
          >
            Completado
          </span>
        )}

        <div className="mt-auto pt-5">
          {mostrarProgreso ? (
            <>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--interface-text-muted)]">Progreso</span>
                <span className="tabular-nums">{porcentaje}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--interface-border)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--interface-accent),var(--interface-accent-secondary))]"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs font-semibold text-[var(--interface-text-muted)]">
              Disponible en tu ruta de aprendizaje
            </p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-[var(--interface-border)] pt-3 text-sm font-bold text-[var(--interface-accent)]">
            <span>{textoAccion}</span>
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </div>
        </div>
      </div>
    </>
  );
}

function ContenidoTarjetaCursoBusiness({
  curso,
  porcentaje,
  completado,
  mostrarProgreso,
  textoAccion,
}: {
  curso: CursoCatalogoFila;
  porcentaje: number;
  completado: boolean;
  mostrarProgreso: boolean;
  textoAccion: string;
}) {
  const descripcion =
    curso.descripcion?.trim() || "Continua desarrollando tus conocimientos con este curso.";

  return (
    <>
      <div className="relative h-32 shrink-0 bg-[#e8efed] dark:bg-white/[0.04]">
        <PortadaCurso
          cursoId={curso.id}
          imagenPortadaUrl={curso.imagenPortadaUrl}
          esDiplomado={curso.esDiplomado}
          titulo={curso.titulo}
          fallback="abstract"
          className="absolute inset-0 rounded-none object-cover transition-transform duration-200 group-hover:scale-[1.015]"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--interface-accent)]"
            style={{
              backgroundColor: "color-mix(in srgb, var(--interface-accent) 10%, transparent)",
            }}
          >
            {curso.esDiplomado ? "Diplomado" : "Curso"}
          </span>
          {completado && (
            <span
              className="rounded-md px-2 py-1 text-[10px] font-bold text-[var(--interface-accent)]"
              style={{
                backgroundColor: "color-mix(in srgb, var(--interface-accent) 10%, transparent)",
              }}
            >
              Completado
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-base font-bold leading-snug text-[var(--interface-text)]">
          {curso.titulo}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--interface-text-muted)]">
          {descripcion}
        </p>

        <div className="mt-auto pt-4">
          {mostrarProgreso ? (
            <>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--interface-text-muted)]">Progreso</span>
                <span className="tabular-nums">{porcentaje}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--interface-border)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--interface-accent),var(--interface-accent-secondary))] transition-[width] duration-500"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs font-semibold text-[var(--interface-text-muted)]">
              Disponible para comenzar
            </p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-[var(--interface-border)] pt-3 text-sm font-bold text-[var(--interface-accent)]">
            <span>{textoAccion}</span>
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </div>
        </div>
      </div>
    </>
  );
}

function ContenidoTarjetaCurso({
  curso,
  porcentaje,
  completado,
  mostrarProgreso,
  textoAccion,
}: {
  curso: CursoCatalogoFila;
  porcentaje: number;
  completado: boolean;
  mostrarProgreso: boolean;
  textoAccion: string;
}) {
  const descripcion =
    curso.descripcion?.trim() || "Continua desarrollando tus conocimientos con este curso.";
  const categoria = curso.esDiplomado ? "Diplomado" : "Curso";

  return (
    <>
      <PortadaCurso
        cursoId={curso.id}
        imagenPortadaUrl={curso.imagenPortadaUrl}
        esDiplomado={curso.esDiplomado}
        titulo={curso.titulo}
        fallback="abstract"
        className="absolute inset-0 z-0 rounded-none transition-transform duration-500 group-hover:scale-105"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(6,17,32,0.08)_0%,rgba(6,17,32,0.42)_42%,rgba(6,17,32,0.88)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.12),transparent_42%)]"
      />

      <div className="relative z-10 flex flex-col p-4 pb-5 text-white">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/35 bg-white/16 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            {curso.esDiplomado && <GraduationCap className="size-3 text-white" aria-hidden="true" />}
            {categoria}
          </span>
          {completado && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/45 bg-emerald-500/30 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
              <CheckCircle2 className="size-3 text-white" aria-hidden="true" />
              Completado
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-white drop-shadow-sm">
          {curso.titulo}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/92 drop-shadow-sm">
          {descripcion}
        </p>

        <div className="mt-4 flex items-end gap-5">
          {mostrarProgreso ? (
            <div className="min-w-0 flex-1 pb-1">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] font-semibold text-white">
                <span>Progreso</span>
                <span>{porcentaje}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#2FB9A5,#4FC9B3,#91DC00)] transition-[width] duration-500"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1 pb-1 text-xs font-semibold text-white/88">
              Disponible para comenzar
            </div>
          )}

          <span className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white text-[#061120] shadow-[0_8px_18px_rgba(6,17,32,0.2),inset_0_1px_0_rgba(255,255,255,0.85)] transition-[transform,background-color,box-shadow] duration-300 group-hover:scale-110 group-hover:bg-[#91DC00] group-hover:shadow-[0_12px_24px_rgba(145,220,0,0.28)]">
            <Play className="size-4 fill-[#061120]" aria-hidden="true" />
            <span className="sr-only">{textoAccion}</span>
          </span>
        </div>
      </div>
    </>
  );
}

function porcentajeCurso(curso: CursoCatalogoFila): number {
  const porcentaje = Number(curso.porcentajeAvance ?? 0);
  if (!Number.isFinite(porcentaje)) return 0;
  return Math.min(100, Math.max(0, Math.round(porcentaje)));
}

function cursoCompletado(curso: CursoCatalogoFila, porcentaje: number): boolean {
  return porcentaje >= 100 || curso.estadoInscripcion === "finalizado" || curso.estadoInscripcion === "aprobado";
}

function cursoEnProgreso(curso: CursoCatalogoFila): boolean {
  return (
    curso.estadoInscripcion === "en_progreso" ||
    curso.estadoInscripcion === "pendiente_evaluacion"
  );
}

function normalizarNivel(nivel?: string | null): NivelCatalogo | null {
  if (!nivel) return null;

  const normalizado = nivel
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

  if (normalizado === "basico" || normalizado === "intermedio" || normalizado === "avanzado") {
    return normalizado;
  }

  return null;
}

function capitalizar(valor: string): string {
  if (!valor) return valor;
  return `${valor.charAt(0).toUpperCase()}${valor.slice(1)}`;
}

function compararRelacionados(
  referencia: CursoCatalogoFila,
  a: CursoCatalogoFila,
  b: CursoCatalogoFila,
): number {
  const criterios: Array<(curso: CursoCatalogoFila) => boolean> = [
    (curso) => curso.escuela === referencia.escuela,
    (curso) => normalizarNivel(curso.nivelDificultad) === normalizarNivel(referencia.nivelDificultad),
    (curso) => curso.esDiplomado === referencia.esDiplomado,
  ];

  for (const coincide of criterios) {
    const diferencia = Number(coincide(b)) - Number(coincide(a));
    if (diferencia !== 0) return diferencia;
  }

  return (
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
    a.id.localeCompare(b.id)
  );
}

function prioridadInscripcion(curso: CursoCatalogoFila): number {
  if (curso.estadoInscripcion === "en_progreso" || curso.estadoInscripcion === "pendiente_evaluacion") {
    return 3;
  }
  if (curso.estadoInscripcion === "no_iniciado") return 2;
  if (curso.estadoInscripcion === "aprobado" || curso.estadoInscripcion === "finalizado") return 0;
  return 1;
}
