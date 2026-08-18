import Link from "next/link";
import { ArrowRight, Check, Clock3, Gauge, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortadaCurso } from "@/components/shared/portada-curso";

interface HeroCursoProps {
  cursoId: string;
  titulo: string;
  imagenPortadaUrl: string | null;
  esDiplomado: boolean;
  duracionEstimadaMin: number | null;
  nivelDificultad: "basico" | "intermedio" | "avanzado";
  cantidadModulos: number;
  porcentajeAvance: number;
  siguienteContenido?: {
    titulo: string;
    href: string;
    moduloTitulo: string;
  } | null;
  cursoCompletado?: boolean;
}

const ETIQUETA_DIFICULTAD = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
} as const;

function formatearDuracion(minutos: number | null): string {
  if (minutos == null || minutos <= 0) return "No definida";
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} ${horas === 1 ? "hora" : "horas"}`;
  return `${horas} h ${resto} min`;
}

function ChipHero({
  icono: Icono,
  valor,
}: {
  icono: typeof Clock3;
  valor: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm text-white shadow-[0_0_14px_rgba(45,212,191,0.12)] backdrop-blur-md">
      <Icono className="size-4 shrink-0 text-emerald-200" aria-hidden="true" />
      <span className="font-medium">{valor}</span>
    </div>
  );
}

function CtaContinuarHero({
  titulo,
  href,
  moduloTitulo,
}: {
  titulo: string;
  href: string;
  moduloTitulo: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group mt-6 flex w-full max-w-2xl items-center justify-between gap-4 rounded-2xl border border-white/90 px-5 py-4",
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_48%,rgba(241,245,249,0.94)_100%)]",
        "shadow-[0_10px_36px_rgba(6,17,32,0.28),0_2px_8px_rgba(255,255,255,0.45)_inset] backdrop-blur-md",
        "transition-[transform,box-shadow,background-color] duration-300",
        "hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_52%,#eef2f7_100%)] hover:shadow-[0_14px_44px_rgba(6,17,32,0.34),0_2px_10px_rgba(255,255,255,0.55)_inset]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
      )}
    >
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-normal text-slate-600">Continuar</span>
        <span className="mt-1 block truncate text-xs font-medium text-slate-500">
          {moduloTitulo}
        </span>
        <span className="mt-0.5 block truncate text-base font-bold leading-snug text-slate-900 md:text-lg">
          {titulo}
        </span>
      </span>

      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f1f5f9_100%)] shadow-sm transition-transform duration-300 group-hover:translate-x-0.5"
      >
        <ArrowRight className="size-4 text-slate-800" />
      </span>
    </Link>
  );
}

function EstadoCursoCompletadoHero() {
  return (
    <div
      aria-live="polite"
      className={cn(
        "mt-6 inline-flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-white/90 px-5 py-4",
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_48%,rgba(241,245,249,0.94)_100%)]",
        "shadow-[0_10px_36px_rgba(6,17,32,0.28),0_2px_8px_rgba(255,255,255,0.45)_inset] backdrop-blur-md",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-emerald-600/20 bg-emerald-500/20">
        <Check className="size-4 text-emerald-900" aria-hidden="true" />
      </span>
      <span className="text-base font-semibold text-slate-900">Curso completado</span>
    </div>
  );
}

export function HeroCurso({
  cursoId,
  titulo,
  imagenPortadaUrl,
  esDiplomado,
  duracionEstimadaMin,
  nivelDificultad,
  cantidadModulos,
  porcentajeAvance,
  siguienteContenido,
  cursoCompletado = false,
}: HeroCursoProps) {
  const porcentaje = Math.round(porcentajeAvance);
  const modulosTexto =
    cantidadModulos === 0
      ? "Módulos no definidos"
      : `${cantidadModulos} ${cantidadModulos === 1 ? "módulo" : "módulos"}`;

  return (
    <section className="relative isolate min-h-[360px] w-full overflow-hidden md:min-h-[430px] lg:min-h-[460px]">
      <PortadaCurso
        cursoId={cursoId}
        imagenPortadaUrl={imagenPortadaUrl}
        esDiplomado={esDiplomado}
        titulo={titulo}
        alt={`Portada de ${titulo}`}
        fallback="abstract"
        className="absolute inset-0 z-0 h-full w-full rounded-none"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(4,12,24,0.62)_0%,rgba(7,22,38,0.35)_48%,rgba(6,17,32,0.12)_100%)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-b from-transparent to-[#f4f9f9] dark:to-[#061120]"
      />

      <div className="relative z-30 mx-auto flex min-h-[360px] w-full max-w-7xl items-end px-6 pb-8 pt-8 md:min-h-[430px] md:pb-10 md:pt-10 lg:px-12">
        <div className="max-w-3xl">
          <h1 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white md:text-4xl">
            {titulo}
          </h1>

          <div className="mt-5 flex flex-wrap gap-3">
            <ChipHero icono={Clock3} valor={formatearDuracion(duracionEstimadaMin)} />
            <ChipHero icono={Gauge} valor={ETIQUETA_DIFICULTAD[nivelDificultad]} />
            <ChipHero icono={Layers3} valor={modulosTexto} />
          </div>

          <div className="mt-8 max-w-2xl">
            <div
              role="progressbar"
              aria-label="Progreso del curso"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={porcentaje}
              className="h-2.5 overflow-hidden rounded-full border border-white/10 bg-white/10"
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  "bg-[linear-gradient(90deg,#2FB9A5_0%,#4FC9B3_55%,#91DC00_100%)]",
                  "shadow-[0_0_12px_rgba(145,220,0,0.32)] transition-[width] duration-500",
                )}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-white/65">{porcentaje}% completado</p>
          </div>

          {siguienteContenido ? (
            <CtaContinuarHero
              titulo={siguienteContenido.titulo}
              href={siguienteContenido.href}
              moduloTitulo={siguienteContenido.moduloTitulo}
            />
          ) : cursoCompletado ? (
            <EstadoCursoCompletadoHero />
          ) : null}
        </div>
      </div>
    </section>
  );
}
