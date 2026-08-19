import { Construction } from "lucide-react";

interface ProximamenteProps {
  titulo: string;
  descripcion: string;
  etapa: string;
}

// Marcador de sección para módulos que se desarrollan en etapas posteriores.
export function Proximamente({ titulo, descripcion, etapa }: ProximamenteProps) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">{titulo}</h1>
      <p className="mt-1 text-muted-foreground">{descripcion}</p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Construction className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-foreground">Módulo en construcción</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Esta sección se implementa en la {etapa}. Los cimientos (acceso, roles y
          seguridad) ya están funcionando.
        </p>
      </div>
    </div>
  );
}
