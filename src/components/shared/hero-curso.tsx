import { Clock3, Gauge, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { IlustracionCursoGeometrica } from "@/components/shared/ilustracion-curso-geometrica";

interface HeroCursoProps {
  cursoId: string;
  titulo: string;
  imagenPortadaUrl: string | null;
  esDiplomado: boolean;
  duracionEstimadaMin: number | null;
  nivelDificultad: "basico" | "intermedio" | "avanzado";
  cantidadModulos: number;
  porcentajeAvance: number;
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

export function HeroCurso({
  cursoId,
  titulo,
  imagenPortadaUrl,
  esDiplomado,
  duracionEstimadaMin,
  nivelDificultad,
  cantidadModulos,
  porcentajeAvance,
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
        className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(4,12,24,0.82)_0%,rgba(7,22,38,0.58)_48%,rgba(6,17,32,0.3)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_62%_30%,rgba(83,230,220,0.18),transparent_27%),radial-gradient(circle_at_42%_22%,rgba(157,104,255,0.16),transparent_32%),radial-gradient(circle_at_80%_65%,rgba(32,144,181,0.14),transparent_30%)]"
      />

      <IlustracionCursoGeometrica variant="hero" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-b from-transparent to-[#f4f9f9] dark:to-[#061120]"
      />

      <div className="relative z-30 mx-auto flex min-h-[360px] w-full max-w-7xl items-end px-6 pb-8 pt-20 md:min-h-[430px] md:pb-10 md:pt-24 lg:px-12">
        <div className="max-w-3xl">
          <IlustracionCursoGeometrica variant="compact" className="mb-4" />

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
        </div>
      </div>
    </section>
  );
}
