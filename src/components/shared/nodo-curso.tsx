import { GraduationCap } from "lucide-react";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { AnilloProgreso } from "@/components/shared/anillo-progreso";

interface NodoCursoProps {
  titulo: string;
  imagenPortadaUrl: string | null;
  esDiplomado: boolean;
  porcentaje?: number;
  tamano?: number;
}

// El bloque visual de un curso en el "mapa" de /mis-cursos: un círculo con
// la portada, un anillo de progreso alrededor (si ya está inscrito) y el
// título debajo — en vez de la tarjeta rectangular de catálogo habitual.
export function NodoCurso({
  titulo,
  imagenPortadaUrl,
  esDiplomado,
  porcentaje,
  tamano = 96,
}: NodoCursoProps) {
  const anillo = tamano + 14;

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: tamano + 32 }}>
      <div className="relative" style={{ width: anillo, height: anillo }}>
        {porcentaje !== undefined && (
          <AnilloProgreso
            porcentaje={porcentaje}
            tamano={anillo}
            className="absolute inset-0"
          />
        )}
        <div
          className="absolute overflow-hidden rounded-full border-2 border-card shadow-md"
          style={{ width: tamano, height: tamano, left: (anillo - tamano) / 2, top: (anillo - tamano) / 2 }}
        >
          <PortadaCurso url={imagenPortadaUrl} esDiplomado={esDiplomado} className="rounded-none" />
        </div>
        {esDiplomado && (
          <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <GraduationCap className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p className="line-clamp-2 max-w-[8rem] text-center text-xs font-medium leading-tight text-foreground">
        {titulo}
      </p>
    </div>
  );
}
