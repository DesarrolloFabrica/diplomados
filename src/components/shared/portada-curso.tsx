import { GraduationCap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortadaCursoProps {
  url: string | null;
  esDiplomado: boolean;
  className?: string;
}

// <img> plano (no next/image): la portada es una URL externa arbitraria
// que el instructor pega a mano, no un dominio fijo que se pueda
// registrar de antemano en next.config.mjs.
export function PortadaCurso({ url, esDiplomado, className }: PortadaCursoProps) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={cn("h-full w-full rounded-md object-cover", className)}
      />
    );
  }

  const Icono = esDiplomado ? GraduationCap : BookOpen;
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-md bg-accent text-accent-foreground",
        className,
      )}
    >
      <Icono className="h-1/2 w-1/2" />
    </div>
  );
}

export function PortadaMiniatura({ url, esDiplomado }: Omit<PortadaCursoProps, "className">) {
  return (
    <div className="h-10 w-14 overflow-hidden rounded-md border border-border">
      <PortadaCurso url={url} esDiplomado={esDiplomado} />
    </div>
  );
}
