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
  LibraryBig,
  Play,
  Search,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { AnilloProgreso } from "@/components/shared/anillo-progreso";
import { useInterfaceVariant } from "@/components/providers/interface-variant-provider";
import { estiloFondoInterfaz } from "@/lib/interface-assets";
import { cn } from "@/lib/utils";
import type { SchoolVisualId } from "@/config/visual-themes/types";
import { CLASE_HERO_PANEL, CLASE_PANEL_GLASS } from "@/config/paneles-glass";
import type { CursoCatalogoFila } from "@backend/server/queries/mis-cursos";

interface CatalogoCursosProps {
  misCursos: CursoCatalogoFila[];
  disponibles: CursoCatalogoFila[];
  nombre: string | null;
}

const CATEGORIAS = ["Curso", "Educacion", "Creatividad", "Pensamiento", "Cortos"];

type CatalogSection = "mis-cursos" | "diplomados" | "nuevos" | "descubrir" | "categoria";
type NivelCatalogo = CursoCatalogoFila["nivelDificultad"];
type FiltroNivel = "todos" | NivelCatalogo;
type EscuelaCatalogo = Exclude<SchoolVisualId, "neutral">;

const NEW_COURSE_DAYS = 30;

const SECCIONES_CATALOGO: ReadonlyArray<{ id: CatalogSection; label: string }> = [
  { id: "mis-cursos", label: "Mis cursos" },
  { id: "diplomados", label: "Diplomados" },
  { id: "nuevos", label: "Nuevos" },
  { id: "descubrir", label: "Descubrir" },
  { id: "categoria", label: "Por categoria" },
];

const NIVELES_CATALOGO: ReadonlyArray<{ id: FiltroNivel; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "basico", label: "Basico" },
  { id: "intermedio", label: "Intermedio" },
  { id: "avanzado", label: "Avanzado" },
];

const ESCUELAS_CATALOGO: ReadonlyArray<{
  id: EscuelaCatalogo;
  label: string;
  fullLabel: string;
}> = [
  { id: "sociales", label: "Sociales", fullLabel: "Ciencias Sociales, Juridicas y Gobierno" },
  { id: "diseno", label: "Diseno", fullLabel: "Diseno y Comunicacion" },
  { id: "ingenieria", label: "Ingenieria", fullLabel: "Ingenieria" },
  { id: "salud", label: "Salud", fullLabel: "Salud y Bienestar" },
  { id: "empresarial", label: "Empresarial", fullLabel: "Transformacion Empresarial" },
];

/** Oculta temporalmente buscador, categorías y perfil del catálogo. */
const MOSTRAR_BARRA_SUPERIOR_CATALOGO = false;

const CLASE_TARJETA_GLASS = cn(
  "group relative flex aspect-[4/5] min-h-[300px] w-[82vw] max-w-[286px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[24px] text-left outline-none transition-[transform,box-shadow,border-color] duration-300 sm:w-[270px] lg:w-[280px]",
  CLASE_PANEL_GLASS,
  "hover:-translate-y-1 hover:border-white/65 hover:shadow-[0_18px_48px_rgba(6,17,32,0.24),inset_0_1px_0_rgba(255,255,255,0.5)]",
  "focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]",
);

export function CatalogoCursos({ misCursos, disponibles, nombre }: CatalogoCursosProps) {
  const { config } = useInterfaceVariant();
  const esBusiness = config.id === "business";
  const esEducational = config.id === "educational";
  const esGamified = config.id === "gamified";
  const todosCursos = useMemo(() => [...misCursos, ...disponibles], [disponibles, misCursos]);
  const [seccionActiva, setSeccionActiva] = useState<CatalogSection>("mis-cursos");
  const [nivelActivo, setNivelActivo] = useState<FiltroNivel>("todos");
  const [escuelaActiva, setEscuelaActiva] = useState<EscuelaCatalogo>(() =>
    ESCUELAS_CATALOGO.find(({ id }) => todosCursos.some((curso) => curso.escuela === id))?.id ??
    "sociales",
  );
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
    cursosPendientesInscritos[0] ?? disponibles[0] ?? misCursos[0] ?? null;
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
  const diplomados = useMemo(
    () => todosCursos.filter((curso) => curso.esDiplomado),
    [todosCursos],
  );
  const nuevos = useMemo(() => {
    const fechaLimite = Date.now() - NEW_COURSE_DAYS * 24 * 60 * 60 * 1000;

    return todosCursos
      .filter((curso) => new Date(curso.createdAt).getTime() >= fechaLimite)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [todosCursos]);
  const cursosCompletados = useMemo(
    () =>
      misCursosOrdenados.filter((curso) =>
        cursoCompletado(curso, porcentajeCurso(curso)),
      ),
    [misCursosOrdenados],
  );
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

  const vistaCatalogo = useMemo(() => {
    if (seccionActiva === "diplomados") {
      return {
        titulo: "Diplomados",
        cursos: diplomados,
        mensajeVacio: "No hay diplomados disponibles.",
      };
    }

    if (seccionActiva === "nuevos") {
      return {
        titulo: "Nuevos",
        cursos: nuevos,
        mensajeVacio: "No hay cursos nuevos en este momento.",
      };
    }

    if (seccionActiva === "categoria") {
      const escuela = ESCUELAS_CATALOGO.find((item) => item.id === escuelaActiva);
      return {
        titulo: escuela?.fullLabel ?? "Por categoria",
        cursos: todosCursos.filter((curso) => curso.escuela === escuelaActiva),
        mensajeVacio: `No hay cursos disponibles en ${escuela?.label ?? "esta categoria"}.`,
      };
    }

    return {
      titulo: "Mis cursos",
      cursos: misCursosFiltrados,
      mensajeVacio:
        nivelActivo === "todos"
          ? "Todavia no tienes cursos inscritos."
          : `No tienes cursos inscritos de nivel ${nivelActivo}.`,
    };
  }, [diplomados, escuelaActiva, misCursosFiltrados, nivelActivo, nuevos, seccionActiva, todosCursos]);

  return (
    <div
      data-dashboard-layout={config.dashboard.layout}
      className="flex w-full max-w-[1500px] flex-col items-start gap-5"
    >
      {MOSTRAR_BARRA_SUPERIOR_CATALOGO && <BarraSuperior nombre={nombre} />}

      {esBusiness && (
        <ResumenDashboardBusiness
          nombre={nombre}
          activos={resumenBusiness.activos}
          completados={resumenBusiness.completados}
          progresoPromedio={resumenBusiness.progresoPromedio}
        />
      )}

      {esEducational && (
        <ResumenDashboardEducational
          nombre={nombre}
          activos={resumenBusiness.activos}
          completados={resumenBusiness.completados}
          progresoPromedio={resumenBusiness.progresoPromedio}
          cursoActual={cursoDestacado}
        />
      )}

      {esGamified && (
        <ResumenDashboardGamified
          nombre={nombre}
          activos={resumenBusiness.activos}
          completados={resumenBusiness.completados}
          progresoPromedio={resumenBusiness.progresoPromedio}
          cursoActual={cursoDestacado}
          siguientesRetos={misCursosOrdenados.slice(0, 3)}
        />
      )}

      {cursosHero.length > 0 && <HeroDestacado cursos={cursosHero} />}

      <section
        data-catalog-density={config.catalog.density}
        className="min-w-0 w-full space-y-5 overflow-hidden"
        aria-labelledby="titulo-catalogo"
      >
        <div className="space-y-3">
          <p
            id="titulo-catalogo"
            className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/75"
          >
            Catalogo
          </p>
          <SelectorCatalogo
            seccionActiva={seccionActiva}
            onChange={setSeccionActiva}
          />
        </div>

        {seccionActiva === "categoria" && (
          <SelectorSecundario
            ariaLabel="Filtrar cursos por escuela"
            items={ESCUELAS_CATALOGO}
            value={escuelaActiva}
            onChange={setEscuelaActiva}
          />
        )}

        {seccionActiva === "descubrir" ? (
          <DescubrirCatalogo
            cursoReferencia={cursoReferenciaDescubrimiento}
            relacionados={cursosRelacionados}
            empresa={recomendadosEmpresa}
            completados={cursosCompletados}
          />
        ) : (
          <FilaCatalogo
            titulo={vistaCatalogo.titulo}
            cursos={vistaCatalogo.cursos}
            mensajeVacio={vistaCatalogo.mensajeVacio}
            controles={
              seccionActiva === "mis-cursos" ? (
                <SelectorSecundario
                  ariaLabel="Filtrar mis cursos por nivel"
                  items={NIVELES_CATALOGO}
                  value={nivelActivo}
                  onChange={setNivelActivo}
                />
              ) : undefined
            }
          />
        )}
      </section>
    </div>
  );
}

function ResumenDashboardEducational({
  nombre,
  activos,
  completados,
  progresoPromedio,
  cursoActual,
}: {
  nombre: string | null;
  activos: number;
  completados: number;
  progresoPromedio: number;
  cursoActual: CursoCatalogoFila | null;
}) {
  const primerNombre = nombre?.trim().split(/\s+/)[0] ?? "Usuario";
  const tituloCurso = cursoActual?.titulo ?? "Explora tu siguiente curso";

  return (
    <section className="educational-dashboard-summary w-full rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] p-5 text-[var(--interface-text)] shadow-[var(--interface-shadow)] sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--interface-accent)]">
            Tu aprendizaje
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-normal sm:text-3xl">
            Continua donde lo dejaste, {primerNombre}
          </h1>
          <div className="mt-5 rounded-2xl border border-[var(--interface-border)] bg-[var(--interface-surface)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--interface-text-muted)]">
              Curso actual
            </p>
            <h2 className="mt-2 text-lg font-bold">{tituloCurso}</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-[var(--interface-text-muted)]">
                Progreso general
              </span>
              <div className="h-2 min-w-[180px] flex-1 overflow-hidden rounded-full bg-[#dce8e5] dark:bg-white/12">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--interface-accent),var(--interface-accent-secondary))]"
                  style={{ width: `${progresoPromedio}%` }}
                />
              </div>
              <span className="text-sm font-bold tabular-nums">{progresoPromedio}%</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <IndicadorBusiness icono={BookOpen} etiqueta="Cursos activos" valor={String(activos)} />
          <IndicadorBusiness icono={CheckCircle2} etiqueta="Completados" valor={String(completados)} />
          <IndicadorBusiness icono={LibraryBig} etiqueta="Ruta promedio" valor={`${progresoPromedio}%`} />
        </div>
      </div>
    </section>
  );
}

function ResumenDashboardGamified({
  nombre,
  activos,
  completados,
  progresoPromedio,
  cursoActual,
  siguientesRetos,
}: {
  nombre: string | null;
  activos: number;
  completados: number;
  progresoPromedio: number;
  cursoActual: CursoCatalogoFila | null;
  siguientesRetos: CursoCatalogoFila[];
}) {
  const primerNombre = nombre?.trim().split(/\s+/)[0] ?? "Usuario";
  const tituloMision = cursoActual?.titulo ?? "Explora tu siguiente mision";
  const porcentajeMision = cursoActual ? porcentajeCurso(cursoActual) : 0;

  return (
    <section className="gamified-dashboard-summary w-full overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] p-5 text-[var(--interface-text)] shadow-[var(--interface-shadow)] sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--interface-accent-secondary)]">
            Tu progreso
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-normal sm:text-3xl">
            Sigue avanzando, {primerNombre}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm font-semibold text-[var(--interface-text-muted)]">
              Nivel actual
            </span>
            <div className="h-2.5 min-w-[160px] flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#91DC00,#67e8f9)] shadow-[0_0_12px_rgba(103,232,249,0.45)]"
                style={{ width: `${progresoPromedio}%` }}
              />
            </div>
            <span className="text-sm font-bold tabular-nums">{progresoPromedio}%</span>
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--interface-border)] bg-[var(--interface-surface)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--interface-text-muted)]">
              Mision actual
            </p>
            <h2 className="mt-2 text-lg font-bold">{tituloMision}</h2>
            {cursoActual && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="h-2 min-w-[160px] flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#91DC00,#2fb9a5)]"
                    style={{ width: `${porcentajeMision}%` }}
                  />
                </div>
                <span className="text-sm font-bold tabular-nums">{porcentajeMision}%</span>
                <Link
                  href={cursoActual.inscripcionId ? `/mis-cursos/${cursoActual.id}` : `/mis-cursos/${cursoActual.id}/informacion`}
                  className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--interface-accent)] px-4 text-xs font-bold text-[#06201c] transition hover:-translate-y-0.5 hover:bg-[var(--interface-accent-secondary)]"
                >
                  Continuar mision
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <IndicadorBusiness icono={Flame} etiqueta="Retos activos" valor={String(activos)} />
          <IndicadorBusiness icono={CheckCircle2} etiqueta="Completados" valor={String(completados)} />
          <IndicadorBusiness icono={TrendingUp} etiqueta="Progreso general" valor={`${progresoPromedio}%`} />
        </div>
      </div>

      {siguientesRetos.length > 0 && (
        <div className="mt-6 border-t border-[var(--interface-border)] pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--interface-text-muted)]">
            Siguientes retos
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {siguientesRetos.map((curso) => {
              const porcentaje = porcentajeCurso(curso);
              return (
                <Link
                  key={curso.id}
                  href={`/mis-cursos/${curso.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-[var(--interface-border)] bg-white/[0.03] p-3 transition-colors hover:border-[var(--interface-accent-secondary)]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--interface-border)] bg-[var(--interface-surface)] text-xs font-bold text-[var(--interface-accent-secondary)]">
                    {porcentaje}%
                  </span>
                  <span className="min-w-0 truncate text-sm font-semibold">{curso.titulo}</span>
                  <ChevronRight
                    className="ml-auto size-4 shrink-0 text-[var(--interface-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--interface-accent-secondary)]"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
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
    <section className="business-dashboard-summary w-full rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] p-5 text-[var(--interface-text)] shadow-[var(--interface-shadow)] sm:p-6">
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
  seccionActiva,
  onChange,
}: {
  seccionActiva: CatalogSection;
  onChange: (section: CatalogSection) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Secciones del catalogo"
      className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {SECCIONES_CATALOGO.map((seccion) => {
        const activa = seccion.id === seccionActiva;

        return (
          <button
            key={seccion.id}
            type="button"
            aria-pressed={activa}
            onClick={() => onChange(seccion.id)}
            className={cn(
              "min-h-11 shrink-0 whitespace-nowrap rounded-full border px-5 text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-xl transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00]",
              activa
                ? "border-white/75 bg-white/30 text-white shadow-[0_8px_22px_rgba(6,17,32,0.14),inset_0_1px_0_rgba(255,255,255,0.65)]"
                : "border-white/30 bg-[#061120]/28 text-white hover:border-white/50 hover:bg-white/22",
            )}
          >
            {seccion.label}
          </button>
        );
      })}
    </div>
  );
}

function SelectorSecundario<T extends string>({
  ariaLabel,
  items,
  value,
  onChange,
}: {
  ariaLabel: string;
  items: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              "min-h-9 shrink-0 whitespace-nowrap rounded-full border px-4 text-xs font-bold backdrop-blur-lg transition-[transform,background-color,border-color,color] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00]",
              activo
                ? "border-[#83E6D4]/80 bg-[#83E6D4]/75 text-[#061120]"
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

function DescubrirCatalogo({
  cursoReferencia,
  relacionados,
  empresa,
  completados,
}: {
  cursoReferencia: CursoCatalogoFila | null;
  relacionados: CursoCatalogoFila[];
  empresa: CursoCatalogoFila[];
  completados: CursoCatalogoFila[];
}) {
  return (
    <div className="min-w-0 space-y-8">
      <h2 className="font-display text-2xl font-bold text-white drop-shadow-sm">Descubrir</h2>

      {cursoReferencia && relacionados.length > 0 && (
        <FilaCatalogo
          titulo={`Porque empezaste ${cursoReferencia.titulo}`}
          cursos={relacionados}
          mensajeVacio=""
        />
      )}

      {empresa.length > 0 && (
        <FilaCatalogo
          titulo="Recomendados para tu empresa"
          cursos={empresa}
          mensajeVacio=""
        />
      )}

      {completados.length > 0 && (
        <FilaCatalogo
          titulo="Cursos completados"
          cursos={completados}
          mensajeVacio=""
        />
      )}
    </div>
  );
}

function FilaCatalogo({
  titulo,
  cursos,
  mensajeVacio,
  controles,
}: {
  titulo: string;
  cursos: CursoCatalogoFila[];
  mensajeVacio: string;
  controles?: ReactNode;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [puedeRetroceder, setPuedeRetroceder] = useState(false);
  const [puedeAvanzar, setPuedeAvanzar] = useState(false);

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

      {controles}

      {cursos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/30 bg-[#061120]/24 px-6 py-8 text-center text-sm font-semibold text-white/80 backdrop-blur-lg">
          {mensajeVacio}
        </p>
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

function BarraSuperior({ nombre }: { nombre: string | null }) {
  const primerNombre = nombre?.trim().split(/\s+/)[0] ?? "Usuario";

  return (
    <div className="flex w-full flex-col items-start gap-4 xl:flex-row xl:flex-wrap xl:items-center xl:justify-start">
      <label className={cn("flex min-h-12 w-full items-center gap-3 rounded-full px-5 xl:max-w-md", CLASE_PANEL_GLASS)}>
        <Search className="size-5 shrink-0" aria-hidden="true" />
        <span className="sr-only">Buscar cursos, temas o habilidades</span>
        <input
          type="search"
          placeholder="Buscar cursos, temas o habilidades"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium placeholder:text-[#061120]/60 focus:outline-none"
        />
      </label>

      <nav aria-label="Categorias de cursos" className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
        {CATEGORIAS.map((categoria, index) => (
          <button
            key={categoria}
            type="button"
            className={cn(
              "min-h-11 whitespace-nowrap rounded-full border px-6 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl transition-colors",
              index === 0
                ? "border-white/70 bg-white/82 text-[#061120]"
                : "border-white/30 bg-white/18 text-white hover:bg-white/28",
            )}
          >
            {categoria}
          </button>
        ))}
      </nav>

      <div className="flex w-full items-center justify-start gap-3 xl:ml-auto xl:w-auto">
        <button
          type="button"
          aria-label="Notificaciones"
          className={cn("relative flex size-12 shrink-0 items-center justify-center rounded-full text-[#061120]", CLASE_PANEL_GLASS)}
        >
          <Bell className="size-5" aria-hidden="true" />
          <span className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-[#91DC00]" />
        </button>
        <Link
          href="/mis-cursos/perfil"
          className={cn("flex min-h-12 items-center gap-3 rounded-full px-3 py-2 text-[#061120] transition-colors hover:bg-white/32", CLASE_PANEL_GLASS)}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#061120] text-sm font-bold text-white">
            {primerNombre.charAt(0).toUpperCase()}
          </span>
          <span className="hidden min-w-0 leading-tight sm:block">
            <span className="block truncate text-sm font-bold">{nombre ?? "Usuario"}</span>
            <span className="block text-xs font-medium text-[#061120]/65">Estudiante</span>
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
  const hrefCurso = `/mis-cursos/${curso.id}`;
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
      className="gamified-hero relative grid w-full overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] shadow-[var(--interface-shadow)] lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.95fr)]"
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
              className="h-full rounded-full bg-[linear-gradient(90deg,#91DC00,#67e8f9)] shadow-[0_0_14px_rgba(103,232,249,0.5)] transition-[width] duration-500"
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
      className="educational-hero grid w-full overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] shadow-[var(--interface-shadow)] lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,0.75fr)]"
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
          <div className="h-2 overflow-hidden rounded-full bg-[#dce8e5] dark:bg-white/12">
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
      data-hero-variant="corporate"
      style={estiloFondoInterfaz("business", "heroBackground")}
      className="business-hero grid w-full overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] shadow-[var(--interface-shadow)] lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]"
    >
      <div className="flex min-w-0 flex-col p-5 sm:p-6 lg:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--interface-accent)]"
            style={{
              backgroundColor: "color-mix(in srgb, var(--interface-accent) 10%, transparent)",
            }}
          >
            {curso.esDiplomado ? "Diplomado" : "Curso"}
          </span>
          {completado && (
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-200">
              Completado
            </span>
          )}
        </div>

        <h2 className="mt-5 max-w-3xl text-2xl font-bold leading-tight tracking-normal sm:text-3xl lg:text-4xl">
          {curso.titulo}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--interface-text-muted)] line-clamp-2">
          {descripcion}
        </p>

        <div className="mt-6 max-w-xl">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold">
            <span className="text-[var(--interface-text-muted)]">Progreso</span>
            <span className="tabular-nums text-[var(--interface-text)]">{porcentaje}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#dbe5e2] dark:bg-white/12">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--interface-accent),var(--interface-accent-secondary))] transition-[width] duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        <div className="mt-7">
          <Link
            href={hrefDestino}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#061120] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[var(--interface-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent)] dark:bg-[var(--interface-accent)] dark:text-[var(--interface-accent-foreground)]"
          >
            {textoAccion}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="relative min-h-[190px] border-t border-[var(--interface-border)] bg-[#e8efed] lg:border-l lg:border-t-0 dark:bg-white/[0.04]">
        <PortadaCurso
          cursoId={curso.id}
          imagenPortadaUrl={curso.imagenPortadaUrl}
          esDiplomado={curso.esDiplomado}
          titulo={curso.titulo}
          fallback="abstract"
          className="absolute inset-4 rounded-xl border border-white/70 object-cover shadow-sm"
        />
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
  const hrefDestino = inscrito
    ? `/mis-cursos/${curso.id}`
    : `/mis-cursos/${curso.id}/informacion`;

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
        className="business-course-card group flex min-h-[330px] w-[min(88vw,310px)] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-left text-[var(--interface-text)] shadow-[var(--interface-card-shadow)] outline-none transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--interface-accent)_50%,transparent)] hover:shadow-[var(--interface-glow)] focus-visible:ring-2 focus-visible:ring-[var(--interface-accent)]"
      >
        <ContenidoTarjetaCursoBusiness
          curso={curso}
          porcentaje={porcentaje}
          completado={completado}
          mostrarProgreso={inscrito}
          textoAccion={textoAccion}
        />
      </Link>
    );
  }

  if (config.catalog.cardVariant === "game") {
    return (
      <Link
        data-catalog-card="game"
        href={hrefDestino}
        aria-label={`${textoAccion}: ${curso.titulo}`}
        className="gamified-course-card group flex min-h-[350px] w-[min(88vw,318px)] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-left text-[var(--interface-text)] shadow-[var(--interface-shadow)] outline-none transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[var(--interface-accent-secondary)] hover:shadow-[0_0_0_1px_var(--interface-accent-secondary),0_18px_40px_rgba(103,232,249,0.14)] focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]"
      >
        <ContenidoTarjetaCursoGamified
          curso={curso}
          porcentaje={porcentaje}
          completado={completado}
          mostrarProgreso={inscrito}
          textoAccion={textoAccion}
        />
      </Link>
    );
  }

  if (config.catalog.cardVariant === "academic") {
    return (
      <Link
        data-catalog-card="academic"
        href={hrefDestino}
        aria-label={`${textoAccion}: ${curso.titulo}`}
        className="educational-course-card group flex min-h-[350px] w-[min(88vw,318px)] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--interface-radius)] border border-[var(--interface-hero-border)] bg-[var(--interface-surface-strong)] text-left text-[var(--interface-text)] shadow-[var(--interface-card-shadow)] outline-none transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--interface-accent-secondary)_55%,transparent)] hover:shadow-[var(--interface-glow)] focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)]"
      >
        <ContenidoTarjetaCursoEducational
          curso={curso}
          porcentaje={porcentaje}
          completado={completado}
          mostrarProgreso={inscrito}
          textoAccion={textoAccion}
        />
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
            <span className="w-fit rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
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
                  className="h-full rounded-full bg-[linear-gradient(90deg,#91DC00,#67e8f9)] shadow-[0_0_10px_rgba(103,232,249,0.4)]"
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
          <span className="mt-3 w-fit rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-200">
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
              <div className="h-2 overflow-hidden rounded-full bg-[#dce8e5] dark:bg-white/12">
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
            <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-200">
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
              <div className="h-1.5 overflow-hidden rounded-full bg-[#dbe5e2] dark:bg-white/12">
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
