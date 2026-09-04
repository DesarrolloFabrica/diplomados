"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  GraduationCap,
  Loader2,
  Play,
  Search,
} from "lucide-react";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { AnilloProgreso } from "@/components/shared/anillo-progreso";
import { cn } from "@/lib/utils";
import type { SchoolVisualId } from "@/config/visual-themes/types";
import { inscribirme } from "@backend/server/actions/inscripciones";
import type { CursoCatalogoFila } from "@backend/server/queries/mis-cursos";

interface CatalogoCursosProps {
  misCursos: CursoCatalogoFila[];
  disponibles: CursoCatalogoFila[];
  nombre: string | null;
}

const CATEGORIAS = ["Curso", "Educacion", "Creatividad", "Pensamiento", "Cortos"];

type CatalogSection = "mis-cursos" | "diplomados" | "nuevos" | "nivel" | "categoria";
type NivelCatalogo = CursoCatalogoFila["nivelDificultad"];
type EscuelaCatalogo = Exclude<SchoolVisualId, "neutral">;

const NEW_COURSE_DAYS = 30;

const SECCIONES_CATALOGO: ReadonlyArray<{ id: CatalogSection; label: string }> = [
  { id: "mis-cursos", label: "Mis cursos" },
  { id: "diplomados", label: "Diplomados" },
  { id: "nuevos", label: "Nuevos" },
  { id: "nivel", label: "Por nivel" },
  { id: "categoria", label: "Por categoria" },
];

const NIVELES_CATALOGO: ReadonlyArray<{ id: NivelCatalogo; label: string }> = [
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

import { CLASE_HERO_PANEL, CLASE_PANEL_GLASS } from "@/config/paneles-glass";

const CLASE_TARJETA_GLASS = cn(
  "group relative flex aspect-[4/5] min-h-[300px] w-[82vw] max-w-[286px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[24px] text-left outline-none transition-[transform,box-shadow,border-color] duration-300 sm:w-[270px] lg:w-[280px]",
  CLASE_PANEL_GLASS,
  "hover:-translate-y-1 hover:border-white/65 hover:shadow-[0_18px_48px_rgba(6,17,32,0.24),inset_0_1px_0_rgba(255,255,255,0.5)]",
  "focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]",
);

export function CatalogoCursos({ misCursos, disponibles, nombre }: CatalogoCursosProps) {
  const todosCursos = useMemo(() => [...misCursos, ...disponibles], [disponibles, misCursos]);
  const [seccionActiva, setSeccionActiva] = useState<CatalogSection>("mis-cursos");
  const [nivelActivo, setNivelActivo] = useState<NivelCatalogo>(() =>
    NIVELES_CATALOGO.find(({ id }) => todosCursos.some((curso) => curso.nivelDificultad === id))
      ?.id ?? "intermedio",
  );
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
      [...misCursos].sort(
        (a, b) =>
          prioridadInscripcion(b) - prioridadInscripcion(a) ||
          porcentajeCurso(b) - porcentajeCurso(a),
      ),
    [misCursos],
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

    if (seccionActiva === "nivel") {
      const nivel = NIVELES_CATALOGO.find((item) => item.id === nivelActivo);
      return {
        titulo: nivel?.label ?? "Por nivel",
        cursos: todosCursos.filter((curso) => curso.nivelDificultad === nivelActivo),
        mensajeVacio: `No hay cursos de nivel ${nivel?.label.toLowerCase() ?? "seleccionado"}.`,
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
      cursos: misCursosOrdenados,
      mensajeVacio: "Todavia no tienes cursos inscritos.",
    };
  }, [diplomados, escuelaActiva, misCursosOrdenados, nivelActivo, nuevos, seccionActiva, todosCursos]);

  return (
    <div className="flex w-full max-w-[1500px] flex-col items-start gap-5">
      {MOSTRAR_BARRA_SUPERIOR_CATALOGO && <BarraSuperior nombre={nombre} />}

      {cursosHero.length > 0 && <HeroDestacado cursos={cursosHero} />}

      <section className="min-w-0 w-full space-y-5 overflow-hidden" aria-labelledby="titulo-catalogo">
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

        {seccionActiva === "nivel" && (
          <SelectorSecundario
            ariaLabel="Filtrar cursos por nivel"
            items={NIVELES_CATALOGO}
            value={nivelActivo}
            onChange={setNivelActivo}
          />
        )}

        {seccionActiva === "categoria" && (
          <SelectorSecundario
            ariaLabel="Filtrar cursos por escuela"
            items={ESCUELAS_CATALOGO}
            value={escuelaActiva}
            onChange={setEscuelaActiva}
          />
        )}

        <FilaCatalogo
          titulo={vistaCatalogo.titulo}
          cursos={vistaCatalogo.cursos}
          mensajeVacio={vistaCatalogo.mensajeVacio}
        />
      </section>
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

function FilaCatalogo({
  titulo,
  cursos,
  mensajeVacio,
}: {
  titulo: string;
  cursos: CursoCatalogoFila[];
  mensajeVacio: string;
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
  const router = useRouter();
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [mostrarDescripcion, setMostrarDescripcion] = useState(false);
  const [enviando, iniciar] = useTransition();

  const indiceSeguro =
    cursos.length === 0 ? 0 : Math.min(indiceActivo, cursos.length - 1);
  const curso = cursos[indiceSeguro] ?? cursos[0];
  if (!curso) return null;

  const inscrito = Boolean(curso.inscripcionId);
  const cursoId = curso.id;
  const porcentaje = porcentajeCurso(curso);
  const descripcion =
    curso.descripcion?.trim() || "Continua tu ruta de aprendizaje con una nueva mision.";
  const completado = cursoCompletado(curso, porcentaje);
  const textoAccion = enviando
    ? "Inscribiendo..."
    : inscrito
      ? completado
        ? "Revisar curso"
        : "Continuar"
      : "Comenzar";
  const hayVariosCursos = cursos.length > 1;

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
    if (enviando || inscrito) return;

    iniciar(async () => {
      const res = await inscribirme(cursoId);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo inscribir");
        return;
      }
      toast.success("Inscripcion exitosa");
      router.push(`/mis-cursos/${cursoId}`);
      router.refresh();
    });
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
              href={`/mis-cursos/${curso.id}`}
              className="inline-flex min-h-10 items-center gap-2.5 rounded-full bg-white px-5 text-sm font-bold text-[#061120] shadow-[0_8px_20px_rgba(6,17,32,0.18)] transition-transform duration-300 hover:scale-[1.02]"
            >
              <Play className="size-4 fill-[#061120]" aria-hidden="true" />
              {textoAccion}
            </Link>
          ) : (
            <span className="inline-flex min-h-10 items-center gap-2.5 rounded-full bg-white px-5 text-sm font-bold text-[#061120] shadow-[0_8px_20px_rgba(6,17,32,0.18)] transition-transform duration-300 group-hover:scale-[1.02]">
              {enviando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="size-4 fill-[#061120]" aria-hidden="true" />
              )}
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
    return <article className={claseHero}>{contenido}</article>;
  }

  return (
    <article
      role="button"
      tabIndex={enviando ? -1 : 0}
      aria-disabled={enviando}
      onClick={activarCurso}
      onKeyDown={activarConTeclado}
      className={cn(claseHero, "cursor-pointer text-left aria-disabled:pointer-events-none aria-disabled:opacity-70")}
    >
      {contenido}
    </article>
  );
}

function TarjetaCursoCatalogo({ curso }: { curso: CursoCatalogoFila }) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const inscrito = Boolean(curso.inscripcionId);
  const porcentaje = porcentajeCurso(curso);
  const completado = cursoCompletado(curso, porcentaje);
  const textoAccion = enviando
    ? "Inscribiendo..."
    : inscrito && completado
      ? "Revisar curso"
      : inscrito
        ? "Continuar"
        : "Comenzar curso";

  function inscribir() {
    if (enviando || inscrito) return;

    iniciar(async () => {
      const res = await inscribirme(curso.id);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo inscribir");
        return;
      }
      toast.success("Inscripcion exitosa");
      router.push(`/mis-cursos/${curso.id}`);
      router.refresh();
    });
  }

  function activarConTeclado(evento: KeyboardEvent<HTMLElement>) {
    if (evento.key !== "Enter" && evento.key !== " ") return;
    evento.preventDefault();
    inscribir();
  }

  const contenido = (
    <ContenidoTarjetaCurso
      curso={curso}
      porcentaje={porcentaje}
      completado={completado}
      mostrarProgreso={inscrito}
      textoAccion={textoAccion}
      enviando={enviando}
    />
  );

  if (inscrito) {
    return (
      <Link
        href={`/mis-cursos/${curso.id}`}
        aria-label={`${completado ? "Revisar" : "Continuar"} ${curso.titulo}`}
        className={CLASE_TARJETA_GLASS}
      >
        {contenido}
      </Link>
    );
  }

  return (
    <article
      role="button"
      tabIndex={enviando ? -1 : 0}
      aria-disabled={enviando}
      onClick={inscribir}
      onKeyDown={activarConTeclado}
      className={cn(CLASE_TARJETA_GLASS, "cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-60")}
    >
      {contenido}
    </article>
  );
}

function ContenidoTarjetaCurso({
  curso,
  porcentaje,
  completado,
  mostrarProgreso,
  textoAccion,
  enviando = false,
}: {
  curso: CursoCatalogoFila;
  porcentaje: number;
  completado: boolean;
  mostrarProgreso: boolean;
  textoAccion: string;
  enviando?: boolean;
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
            {enviando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="size-4 fill-[#061120]" aria-hidden="true" />
            )}
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

function prioridadInscripcion(curso: CursoCatalogoFila): number {
  if (curso.estadoInscripcion === "en_progreso" || curso.estadoInscripcion === "pendiente_evaluacion") {
    return 3;
  }
  if (curso.estadoInscripcion === "no_iniciado") return 2;
  if (curso.estadoInscripcion === "aprobado" || curso.estadoInscripcion === "finalizado") return 0;
  return 1;
}
