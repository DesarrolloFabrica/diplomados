"use client";

import { useTransition, type KeyboardEvent } from "react";
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
import { inscribirme } from "@backend/server/actions/inscripciones";
import type { CursoCatalogoFila } from "@backend/server/queries/mis-cursos";

interface CatalogoCursosProps {
  misCursos: CursoCatalogoFila[];
  disponibles: CursoCatalogoFila[];
  nombre: string | null;
}

const CATEGORIAS = ["Curso", "Educacion", "Creatividad", "Pensamiento", "Cortos"];

/** Oculta temporalmente buscador, categorías y perfil del catálogo. */
const MOSTRAR_BARRA_SUPERIOR_CATALOGO = false;

import { CLASE_HERO_PANEL, CLASE_PANEL_GLASS } from "@/config/paneles-glass";

const CLASE_TARJETA_GLASS = cn(
  "group relative flex aspect-[4/5] min-h-[300px] flex-col justify-end overflow-hidden rounded-[24px] text-left outline-none transition-[transform,box-shadow,border-color] duration-300",
  CLASE_PANEL_GLASS,
  "hover:-translate-y-1 hover:border-white/65 hover:shadow-[0_18px_48px_rgba(6,17,32,0.24),inset_0_1px_0_rgba(255,255,255,0.5)]",
  "focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]",
);

export function CatalogoCursos({ misCursos, disponibles, nombre }: CatalogoCursosProps) {
  const enProgreso = misCursos.find(
    (c) => c.estadoInscripcion !== "finalizado" && c.estadoInscripcion !== "aprobado",
  );
  const cursoDestacado = enProgreso ?? disponibles[0] ?? misCursos[0] ?? null;
  const cursosSugeridos = [
    ...misCursos,
    ...disponibles.filter((curso) => curso.id !== cursoDestacado?.id),
  ];

  return (
    <div className="flex w-full max-w-[1500px] flex-col items-start gap-5">
      {MOSTRAR_BARRA_SUPERIOR_CATALOGO && <BarraSuperior nombre={nombre} />}

      {cursoDestacado && (
        <HeroDestacado curso={cursoDestacado} inscrito={Boolean(cursoDestacado.inscripcionId)} />
      )}

      <section className="w-full space-y-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            Te puede interesar
          </h2>
          {disponibles.length > 0 && (
            <button
              type="button"
              className="hidden rounded-full border border-white/35 bg-white/18 px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl transition-colors hover:bg-white/28 sm:inline-flex"
            >
              Ver todos
            </button>
          )}
        </div>

        {cursosSugeridos.length === 0 ? (
          <p className={cn("rounded-[24px] px-6 py-8 text-center text-sm font-medium text-white", CLASE_PANEL_GLASS)}>
            Todavia no hay cursos asignados o disponibles.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4 2xl:grid-cols-5">
            {cursosSugeridos.map((curso) =>
              curso.inscripcionId ? (
                <TarjetaCursoProgreso key={curso.id} curso={curso} />
              ) : (
                <NodoDisponible key={curso.id} curso={curso} />
              ),
            )}
          </div>
        )}
      </section>
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

function HeroDestacado({
  curso,
  inscrito,
}: {
  curso: CursoCatalogoFila;
  inscrito: boolean;
}) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
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

  function activarCurso() {
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
        <p className="mt-2 line-clamp-2 max-w-xl text-sm font-medium leading-6 text-white/88">
          {descripcion}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex min-h-10 items-center gap-2.5 rounded-full bg-white px-5 text-sm font-bold text-[#061120] shadow-[0_8px_20px_rgba(6,17,32,0.18)] transition-transform duration-300 group-hover:scale-[1.02]">
            {enviando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="size-4 fill-[#061120]" aria-hidden="true" />
            )}
            {textoAccion}
          </span>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/45 bg-white/16 px-4 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md">
            <BookOpen className="size-4" aria-hidden="true" />
            Guia del curso
          </span>
        </div>
      </div>

      <div className="hidden items-center justify-end gap-2 lg:flex">
        <span className="flex size-9 items-center justify-center rounded-full border border-white/35 bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </span>
        <span className="flex size-9 items-center justify-center rounded-full border border-white/35 bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md">
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
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
      <Link href={`/mis-cursos/${curso.id}`} className={claseHero}>
        {contenido}
      </Link>
    );
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

function TarjetaCursoProgreso({ curso }: { curso: CursoCatalogoFila }) {
  const porcentaje = porcentajeCurso(curso);
  const completado = cursoCompletado(curso, porcentaje);

  return (
    <Link
      href={`/mis-cursos/${curso.id}`}
      aria-label={`${completado ? "Revisar" : "Continuar"} ${curso.titulo}`}
      className={CLASE_TARJETA_GLASS}
    >
      <ContenidoTarjetaCurso
        curso={curso}
        porcentaje={porcentaje}
        completado={completado}
        textoAccion={completado ? "Revisar" : "Continuar"}
      />
    </Link>
  );
}

function NodoDisponible({ curso }: { curso: CursoCatalogoFila }) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const porcentaje = porcentajeCurso(curso);
  const completado = cursoCompletado(curso, porcentaje);
  const textoAccion = enviando
    ? "Inscribiendo..."
    : completado
      ? "Revisar curso"
      : porcentaje > 0
        ? "Continuar"
        : "Comenzar curso";

  function inscribir() {
    if (enviando) return;

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

  return (
    <article
      role="button"
      tabIndex={enviando ? -1 : 0}
      aria-disabled={enviando}
      onClick={inscribir}
      onKeyDown={activarConTeclado}
      className={cn(CLASE_TARJETA_GLASS, "cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-60")}
    >
      <ContenidoTarjetaCurso
        curso={curso}
        porcentaje={porcentaje}
        completado={completado}
        textoAccion={textoAccion}
        enviando={enviando}
      />
    </article>
  );
}

function ContenidoTarjetaCurso({
  curso,
  porcentaje,
  completado,
  textoAccion,
  enviando = false,
}: {
  curso: CursoCatalogoFila;
  porcentaje: number;
  completado: boolean;
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
