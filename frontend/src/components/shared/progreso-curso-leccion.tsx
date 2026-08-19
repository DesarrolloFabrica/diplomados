interface ProgresoCursoLeccionProps {
  porcentaje: number;
  completados: number;
  total: number;
}

export function ProgresoCursoLeccion({
  porcentaje,
  completados,
  total,
}: ProgresoCursoLeccionProps) {
  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Progreso del curso</p>
        <p className="text-sm font-semibold tabular-nums text-foreground">{porcentaje}%</p>
      </div>

      <div
        role="progressbar"
        aria-label="Progreso general del curso"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
        className="h-2.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#2FB9A5_0%,#4FC9B3_55%,#91DC00_100%)] shadow-[0_0_8px_rgba(145,220,0,0.24)] transition-[width] duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {completados} de {total} contenidos completados
      </p>
    </div>
  );
}
