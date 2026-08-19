import { BarChart3, Clock3, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EstadisticasCursoProps {
  duracionEstimadaMin: number | null;
  nivelDificultad: "basico" | "intermedio" | "avanzado";
  cantidadModulos: number;
  className?: string;
}

const ETIQUETA_DIFICULTAD: Record<
  EstadisticasCursoProps["nivelDificultad"],
  string
> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

function formatearDuracion(minutos: number | null): string {
  if (minutos == null || minutos <= 0) return "No definida";
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} ${horas === 1 ? "hora" : "horas"}`;
  return `${horas} h ${resto} min`;
}

function ChipEstadistica({
  icono: Icono,
  valor,
}: {
  icono: typeof Clock3;
  valor: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/70",
        "bg-card/80 px-3 py-1.5 text-sm shadow-sm backdrop-blur-sm",
      )}
    >
      <Icono className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
      <span className="font-medium text-foreground">{valor}</span>
    </div>
  );
}

export function EstadisticasCurso({
  duracionEstimadaMin,
  nivelDificultad,
  cantidadModulos,
  className,
}: EstadisticasCursoProps) {
  const modulosTexto =
    cantidadModulos === 0
      ? "Módulos no definidos"
      : `${cantidadModulos} ${cantidadModulos === 1 ? "módulo" : "módulos"}`;

  return (
    <div className={cn("mt-4 flex flex-wrap gap-3", className)}>
      <ChipEstadistica
        icono={Clock3}
        valor={formatearDuracion(duracionEstimadaMin)}
      />
      <ChipEstadistica icono={BarChart3} valor={ETIQUETA_DIFICULTAD[nivelDificultad]} />
      <ChipEstadistica icono={Layers3} valor={modulosTexto} />
    </div>
  );
}
