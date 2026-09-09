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
    <div className="space-y-2 border-b border-white/15 bg-[#061120]/14 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-white opacity-80">Progreso del curso</p>
        <p className="text-xs font-bold tabular-nums text-white">{porcentaje}%</p>
      </div>

      <div
        role="progressbar"
        aria-label="Progreso general del curso"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
        className="h-1.5 overflow-hidden rounded-full bg-white/18"
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#2FB9A5_0%,#4FC9B3_55%,#91DC00_100%)] shadow-[0_0_8px_rgba(145,220,0,0.24)] transition-[width] duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <p className="text-[11px] text-white opacity-65">
        {completados} de {total} contenidos completados
      </p>
    </div>
  );
}
