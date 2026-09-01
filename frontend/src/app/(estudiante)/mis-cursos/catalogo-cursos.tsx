"use client";

import { useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Bell,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Loader2,
  Play,
  Search,
} from "lucide-react";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { cn } from "@/lib/utils";
import { inscribirme } from "@backend/server/actions/inscripciones";
import type { CursoCatalogoFila } from "@backend/server/queries/mis-cursos";

interface CatalogoCursosProps {
  misCursos: CursoCatalogoFila[];
  disponibles: CursoCatalogoFila[];
  nombreUsuario?: string | null;
}

const DASHBOARD_BACKGROUND = "/images/roadmap_asset/ambiente-modulo.jpeg";

const CATEGORIAS = ["Curso", "Educacion", "Creatividad", "Pensamiento", "Cortos"];

export function CatalogoCursos({
  misCursos,
  disponibles,
  nombreUsuario,
}: CatalogoCursosProps) {
  const enProgreso = misCursos.find(
    (c) => c.estadoInscripcion !== "finalizado" && c.estadoInscripcion !== "aprobado",
  );
  const destacado = enProgreso ?? disponibles[0] ?? misCursos[0] ?? null;
  const cursosSugeridos = [...disponibles, ...misCursos.filter((curso) => curso.id !== destacado?.id)];
  const cursosProgreso = misCursos.filter((curso) => curso.id !== destacado?.id);

  return (
    <div className="relative -m-5 min-h-[calc(100dvh-2.5rem)] overflow-hidden bg-[#061120] px-4 py-5 text-white sm:-m-6 sm:min-h-[calc(100dvh-3rem)] sm:px-6 lg:-m-8 lg:min-h-[calc(100dvh-4rem)] lg:px-8 xl:-m-10 xl:min-h-[calc(100dvh-5rem)] xl:px-10">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${DASHBOARD_BACKGROUND})` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,17,32,0.44),rgba(6,17,32,0.12)_42%,rgba(6,17,32,0.50)),linear-gradient(180deg,rgba(6,17,32,0.24),rgba(6,17,32,0.66))]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-52 bg-[linear-gradient(180deg,transparent,rgba(6,17,32,0.58))]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1480px] flex-col gap-6">
        <DashboardTopbar nombreUsuario={nombreUsuario} />

        {destacado ? (
          <HeroDashboard curso={destacado} />
        ) : (
          <EstadoVacioGlass titulo="Mis cursos" texto="No hay cursos disponibles por ahora." />
        )}

        <section className="space-y-4">
          <EncabezadoSeccion titulo="Te puede interesar" accion="Ver todos" />
          {cursosSugeridos.length === 0 ? (
            <EstadoVacioGlass texto="No hay mas cursos disponibles por ahora." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
              {cursosSugeridos.slice(0, 5).map((curso) => (
                <TarjetaCursoDashboard key={curso.id} curso={curso} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 pb-4">
          <EncabezadoSeccion titulo="Tu progreso" />
          {misCursos.length === 0 ? (
            <EstadoVacioGlass texto="Todavia no te has inscrito en ningun curso." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(cursosProgreso.length > 0 ? cursosProgreso : misCursos).slice(0, 6).map((curso) => (
                <TarjetaProgresoCompacta key={curso.id} curso={curso} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DashboardTopbar({ nombreUsuario }: { nombreUsuario?: string | null }) {
  return (
    <header className="grid gap-3 lg:grid-cols-[minmax(260px,420px)_1fr_auto] lg:items-center">
      <label className="flex min-w-0 items-center gap-3 rounded-full border border-white/30 bg-white/28 px-5 py-3 text-sm text-white shadow-[0_14px_38px_rgba(6,17,32,0.14)] backdrop-blur-xl">
        <Search className="size-5 shrink-0 text-[#071B30]/80" aria-hidden="true" />
        <input
          type="search"
          placeholder="Buscar cursos, temas o habilidades"
          className="min-w-0 flex-1 bg-transparent font-medium text-[#071B30] placeholder:text-[#071B30]/65 outline-none"
        />
      </label>

      <nav aria-label="Categorias" className="flex min-w-0 gap-2 overflow-x-auto pb-1 lg:justify-center lg:pb-0">
        {CATEGORIAS.map((categoria, indice) => (
          <button
            key={categoria}
            type="button"
            className={cn(
              "shrink-0 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 shadow-sm backdrop-blur-xl transition-[background-color,color,transform] duration-300 hover:-translate-y-0.5 hover:bg-white/32",
              indice === 0 ? "bg-white/86 text-[#071B30]" : "bg-white/16",
            )}
          >
            {categoria}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3 lg:justify-end">
        <button
          type="button"
          aria-label="Notificaciones"
          className="grid size-12 place-items-center rounded-full border border-white/22 bg-white/24 text-[#071B30] shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-0.5"
        >
          <Bell className="size-5" aria-hidden="true" />
        </button>
        <Link
          href="/mis-cursos/perfil"
          className="flex min-w-0 items-center gap-3 rounded-full border border-white/24 bg-white/30 px-3 py-2 pr-4 text-[#071B30] shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-0.5"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#071B30] font-display text-sm font-bold text-white">
            {inicialesUsuario(nombreUsuario)}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-bold">{nombreUsuario || "Mi perfil"}</span>
            <span className="block text-xs font-medium text-[#071B30]/70">Colaborador</span>
          </span>
          <ChevronDown className="hidden size-4 shrink-0 sm:block" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

function HeroDashboard({ curso }: { curso: CursoCatalogoFila }) {
  const descripcion =
    curso.descripcion?.trim() || "Continua tu ruta de aprendizaje y desbloquea nuevas capacidades.";
  const porcentaje = porcentajeCurso(curso);
  const completado = cursoCompletado(curso, porcentaje);

  return (
    <section className="relative min-h-[390px] overflow-hidden rounded-[28px] border border-white/34 bg-white/24 shadow-[0_28px_70px_rgba(6,17,32,0.20)] backdrop-blur-xl">
      <PortadaCurso
        cursoId={curso.id}
        imagenPortadaUrl={curso.imagenPortadaUrl}
        esDiplomado={curso.esDiplomado}
        titulo={curso.titulo}
        fallback="abstract"
        className="absolute inset-0 rounded-none opacity-70 mix-blend-luminosity"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(245,251,253,0.86),rgba(245,251,253,0.58)_38%,rgba(245,251,253,0.12)),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(6,17,32,0.20))]"
      />
      <div className="relative z-10 flex min-h-[390px] flex-col justify-end gap-8 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:p-10">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/72 px-4 py-2 text-sm font-bold text-[#071B30] shadow-sm backdrop-blur-md">
            <span className="size-2 rounded-full bg-[#91DC00] shadow-[0_0_12px_rgba(145,220,0,0.6)]" />
            Curso destacado
          </span>
          <div className="mt-16 flex flex-wrap gap-2 sm:mt-20">
            <TagCurso>{curso.esDiplomado ? "Diplomado" : "Curso"}</TagCurso>
            <TagCurso>{nivelLegible(curso.nivelDificultad)}</TagCurso>
            {completado && <TagCurso>Completado</TagCurso>}
          </div>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-[0.98] text-[#061120] drop-shadow-sm sm:text-5xl">
            {curso.titulo}
          </h1>
          <p className="mt-4 max-w-lg text-sm font-medium leading-relaxed text-[#071B30]/78 sm:text-base">
            {descripcion}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <AccionCurso curso={curso} principal />
            <Link
              href={`/mis-cursos/${curso.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/30 px-5 py-3 text-sm font-bold text-[#071B30] shadow-sm backdrop-blur-xl transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-white/46"
            >
              <BookOpen className="size-4" aria-hidden="true" />
              Guia del curso
            </Link>
            <button
              type="button"
              aria-label="Guardar curso"
              className="grid size-12 place-items-center rounded-full border border-white/45 bg-white/28 text-[#071B30] shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-0.5"
            >
              <Bookmark className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="w-full max-w-xs rounded-3xl border border-white/40 bg-white/30 p-4 text-[#071B30] shadow-[0_18px_45px_rgba(6,17,32,0.13)] backdrop-blur-xl lg:w-72">
          <div className="mb-2 flex items-center justify-between text-sm font-bold">
            <span>Progreso</span>
            <span>{porcentaje}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#071B30]/16">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#2FB9A5,#4FC9B3,#91DC00)] transition-[width] duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="mt-3 text-xs font-medium text-[#071B30]/68">
            {curso.inscripcionId ? "Tu avance se actualiza automaticamente." : "Inscribete para iniciar esta ruta."}
          </p>
        </div>
      </div>
    </section>
  );
}

function TarjetaCursoDashboard({ curso }: { curso: CursoCatalogoFila }) {
  if (curso.inscripcionId) {
    return (
      <Link
        href={`/mis-cursos/${curso.id}`}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]"
      >
        <ContenidoCardVisual curso={curso} />
      </Link>
    );
  }

  return <TarjetaDisponible curso={curso} />;
}

function TarjetaDisponible({ curso }: { curso: CursoCatalogoFila }) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();

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
      className="group outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120] aria-disabled:pointer-events-none aria-disabled:opacity-60"
    >
      <ContenidoCardVisual curso={curso} enviando={enviando} />
    </article>
  );
}

function ContenidoCardVisual({
  curso,
  enviando = false,
}: {
  curso: CursoCatalogoFila;
  enviando?: boolean;
}) {
  const porcentaje = porcentajeCurso(curso);
  const descripcion =
    curso.descripcion?.trim() || "Aprende a tu ritmo con una experiencia guiada.";

  return (
    <div className="relative aspect-[4/5] min-h-[300px] overflow-hidden rounded-[24px] border border-white/34 bg-white/20 text-white shadow-[0_18px_44px_rgba(6,17,32,0.18)] backdrop-blur-lg transition-[border-color,box-shadow,transform] duration-300 group-hover:-translate-y-1.5 group-hover:border-white/58 group-hover:shadow-[0_24px_60px_rgba(6,17,32,0.28)]">
      <PortadaCurso
        cursoId={curso.id}
        imagenPortadaUrl={curso.imagenPortadaUrl}
        esDiplomado={curso.esDiplomado}
        titulo={curso.titulo}
        fallback="abstract"
        className="absolute inset-0 rounded-none transition-transform duration-500 group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,32,0.06),rgba(6,17,32,0.36)_45%,rgba(6,17,32,0.88))]"
      />
      <button
        type="button"
        aria-label="Opciones del curso"
        className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full bg-white/28 text-white backdrop-blur-xl"
        onClick={(evento) => evento.preventDefault()}
      >
        <span className="-mt-1 text-xl leading-none">...</span>
      </button>
      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        <TagCurso className="mb-3 w-max bg-white/28 text-white">{curso.esDiplomado ? "Diplomado" : "Curso"}</TagCurso>
        <h3 className="line-clamp-2 font-display text-xl font-bold leading-tight drop-shadow-sm">
          {curso.titulo}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/82">
          {descripcion}
        </p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex justify-between text-xs font-semibold text-white/76">
              <span>{curso.inscripcionId ? "Progreso" : "Listo para iniciar"}</span>
              <span>{porcentaje}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/24">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#2FB9A5,#4FC9B3,#91DC00)] transition-[width] duration-500"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#061120] shadow-lg transition-[background-color,transform] duration-300 group-hover:scale-110 group-hover:bg-[#91DC00]">
            {enviando ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function TarjetaProgresoCompacta({ curso }: { curso: CursoCatalogoFila }) {
  const porcentaje = porcentajeCurso(curso);

  return (
    <Link
      href={`/mis-cursos/${curso.id}`}
      className="group flex min-w-0 items-center gap-4 rounded-3xl border border-white/28 bg-white/22 p-3 text-white shadow-[0_14px_36px_rgba(6,17,32,0.12)] backdrop-blur-xl transition-[background-color,transform] duration-300 hover:-translate-y-1 hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl">
        <PortadaCurso
          cursoId={curso.id}
          imagenPortadaUrl={curso.imagenPortadaUrl}
          esDiplomado={curso.esDiplomado}
          titulo={curso.titulo}
          fallback="abstract"
          className="absolute inset-0 rounded-none"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold">{curso.titulo}</h3>
        <p className="mt-0.5 text-xs font-medium text-white/68">En progreso {porcentaje}%</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#2FB9A5,#4FC9B3,#91DC00)]"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/24 text-white transition-transform group-hover:scale-110">
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function AccionCurso({ curso, principal = false }: { curso: CursoCatalogoFila; principal?: boolean }) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();

  if (curso.inscripcionId) {
    return (
      <Link
        href={`/mis-cursos/${curso.id}`}
        className={cn(
          "inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#061120] shadow-[0_14px_30px_rgba(6,17,32,0.16)] transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-[#91DC00]",
          principal && "px-7",
        )}
      >
        <Play className="size-4 fill-current" aria-hidden="true" />
        Continuar
      </Link>
    );
  }

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

  return (
    <button
      type="button"
      disabled={enviando}
      onClick={inscribir}
      className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3 text-sm font-bold text-[#061120] shadow-[0_14px_30px_rgba(6,17,32,0.16)] transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-[#91DC00] disabled:pointer-events-none disabled:opacity-70"
    >
      {enviando ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Play className="size-4 fill-current" aria-hidden="true" />
      )}
      Comenzar
    </button>
  );
}

function EncabezadoSeccion({ titulo, accion }: { titulo: string; accion?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-display text-xl font-bold text-white drop-shadow-sm">{titulo}</h2>
      {accion && (
        <button type="button" className="text-sm font-bold text-white/82 transition-colors hover:text-white">
          {accion}
        </button>
      )}
    </div>
  );
}

function EstadoVacioGlass({ titulo, texto }: { titulo?: string; texto: string }) {
  return (
    <div className="rounded-3xl border border-white/28 bg-white/22 px-6 py-8 text-center text-white shadow-sm backdrop-blur-xl">
      {titulo && <h2 className="font-display text-xl font-bold">{titulo}</h2>}
      <p className={cn("text-sm font-medium text-white/75", titulo && "mt-2")}>{texto}</p>
    </div>
  );
}

function TagCurso({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-white/62 px-3 py-1.5 text-xs font-bold text-[#071B30] shadow-sm backdrop-blur-md",
        className,
      )}
    >
      {children}
    </span>
  );
}

function inicialesUsuario(nombre?: string | null): string {
  if (!nombre) return "U";

  const partes = nombre
    .split(/\s+/)
    .map((parte) => parte.trim())
    .filter(Boolean);

  return partes
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function nivelLegible(nivel: CursoCatalogoFila["nivelDificultad"]): string {
  if (nivel === "basico") return "Basico";
  if (nivel === "avanzado") return "Avanzado";
  return "Intermedio";
}

function porcentajeCurso(curso: CursoCatalogoFila): number {
  const porcentaje = Number(curso.porcentajeAvance ?? 0);
  if (!Number.isFinite(porcentaje)) return 0;
  return Math.min(100, Math.max(0, Math.round(porcentaje)));
}

function cursoCompletado(curso: CursoCatalogoFila, porcentaje: number): boolean {
  return (
    porcentaje >= 100 ||
    curso.estadoInscripcion === "finalizado" ||
    curso.estadoInscripcion === "aprobado"
  );
}
