"use client";

import { useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, GraduationCap, Loader2 } from "lucide-react";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { AnilloProgreso } from "@/components/shared/anillo-progreso";
import { inscribirme } from "@backend/server/actions/inscripciones";
import type { CursoCatalogoFila } from "@backend/server/queries/mis-cursos";

interface CatalogoCursosProps {
  misCursos: CursoCatalogoFila[];
  disponibles: CursoCatalogoFila[];
}

const CLASE_TARJETA_CURSO =
  "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm outline-none transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-[#2FB9A5]/50 hover:shadow-[0_18px_45px_rgba(6,17,32,0.14)] focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-[#0B1B2B] dark:hover:border-[#91DC00]/40 dark:hover:shadow-[0_18px_45px_rgba(0,0,0,0.28)]";

export function CatalogoCursos({ misCursos, disponibles }: CatalogoCursosProps) {
  const enProgreso = misCursos.find(
    (c) => c.estadoInscripcion !== "finalizado" && c.estadoInscripcion !== "aprobado",
  );

  return (
    <div className="space-y-10">
      {enProgreso && <HeroContinuar curso={enProgreso} />}

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Tu progreso</h2>
        {misCursos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
            Todavía no te has inscrito en ningún curso. Elige uno abajo, en el catálogo.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
            {misCursos.map((curso) => (
              <TarjetaCursoProgreso key={curso.id} curso={curso} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Cursos disponibles</h2>
        <p className="-mt-2 text-sm text-muted-foreground">
          Elige uno para inscribirte al instante.
        </p>
        {disponibles.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
            No hay más cursos disponibles por ahora.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {disponibles.map((curso) => (
              <NodoDisponible key={curso.id} curso={curso} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TarjetaCursoProgreso({ curso }: { curso: CursoCatalogoFila }) {
  const porcentaje = porcentajeCurso(curso);
  const completado = cursoCompletado(curso, porcentaje);
  const descripcion =
    curso.descripcion?.trim() || "Continua desarrollando tus conocimientos con este curso.";

  return (
    <Link
      href={`/mis-cursos/${curso.id}`}
      aria-label={`${completado ? "Revisar" : "Continuar"} ${curso.titulo}`}
      className="group relative block aspect-[5/6] min-h-[285px] overflow-hidden rounded-[20px] bg-[#061120] text-left shadow-[0_12px_30px_rgba(6,17,32,0.12)] outline-none transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(6,17,32,0.22)] focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-0"
    >
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
        className="pointer-events-none absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:opacity-90"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(6,17,32,0.92)_0%,rgba(6,17,32,0.65)_35%,rgba(6,17,32,0.12)_70%,transparent_100%)]"
      />

      <div className="absolute left-3.5 top-3.5 z-20 flex flex-wrap gap-1.5">
        {curso.esDiplomado && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md">
            <GraduationCap className="size-3" aria-hidden="true" />
            Diplomado
          </span>
        )}
        {completado && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/30 bg-emerald-500/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Completado
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pr-16">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
          {curso.esDiplomado ? "Diplomado" : "Curso"}
        </p>
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-tight text-white drop-shadow-sm">
          {curso.titulo}
        </h3>
        <p className="mt-1.5 line-clamp-2 translate-y-1 text-xs leading-relaxed text-white/80 transition-[opacity,transform] duration-300 group-hover:translate-y-0 group-hover:text-white">
          {descripcion}
        </p>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-medium text-white/82">
            <span>Progreso</span>
            <span>{porcentaje}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/20 shadow-inner">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#2FB9A5,#4FC9B3,#91DC00)] transition-[width] duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      </div>

      <span className="absolute bottom-4 right-4 z-30 flex size-10 items-center justify-center rounded-full bg-white text-[#061120] shadow-lg transition-[transform,background-color,box-shadow] duration-300 group-hover:scale-110 group-hover:bg-[#91DC00] group-hover:shadow-[0_12px_24px_rgba(145,220,0,0.28)]">
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function HeroContinuar({ curso }: { curso: CursoCatalogoFila }) {
  const porcentaje = Number(curso.porcentajeAvance ?? 0);

  return (
    <Link
      href={`/mis-cursos/${curso.id}`}
      className="group relative block h-56 w-full overflow-hidden rounded-2xl shadow-md"
    >
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
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(6,17,32,0.72)_0%,rgba(6,17,32,0.4)_45%,rgba(6,17,32,0.15)_100%)]"
      />
      <div className="relative z-10 flex h-full items-center justify-between gap-4 p-6">
        <div className="max-w-md space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Continúa aprendiendo
          </p>
          <h2 className="font-display text-2xl font-semibold text-white">{curso.titulo}</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
        <div className="relative hidden shrink-0 items-center justify-center sm:flex" style={{ width: 88, height: 88 }}>
          <AnilloProgreso porcentaje={porcentaje} tamano={88} grosor={6} className="absolute inset-0" />
          <span className="font-display text-lg font-semibold text-white dark:text-white">{Math.round(porcentaje)}%</span>
        </div>
      </div>
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
      toast.success("Inscripción exitosa");
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
      className={`${CLASE_TARJETA_CURSO} aria-disabled:pointer-events-none aria-disabled:opacity-60`}
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
    curso.descripcion?.trim() || "Continúa desarrollando tus conocimientos con este curso.";

  return (
    <>
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <PortadaCurso
          cursoId={curso.id}
          imagenPortadaUrl={curso.imagenPortadaUrl}
          esDiplomado={curso.esDiplomado}
          titulo={curso.titulo}
          className="absolute inset-0 rounded-none transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#061120]/45 to-transparent" />
        {curso.esDiplomado && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#061120]/82 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm dark:bg-white/12">
            <GraduationCap className="size-3.5" aria-hidden="true" />
            Diplomado
          </span>
        )}
        {completado && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#13A476] px-3 py-1 text-xs font-semibold text-white shadow-sm">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Completado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-tight text-[#061120] dark:text-white">
          {curso.titulo}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {descripcion}
        </p>

        <div className="mt-auto pt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-muted-foreground">Progreso</span>
            <span className="font-display font-semibold text-[#061120] dark:text-white">
              {porcentaje}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#2FB9A5,#4FC9B3,#91DC00)] transition-[width] duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>

          <span className="mt-5 inline-flex w-full items-center justify-between rounded-xl bg-[#061120] px-4 py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-300 group-hover:bg-[#123A32] dark:bg-[#91DC00] dark:text-[#061120]">
            <span className="inline-flex items-center gap-2">
              {enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {textoAccion}
            </span>
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
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
