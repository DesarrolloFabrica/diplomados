import { cn } from "@/lib/utils";
import { IconoMarcaFormacion } from "@/components/layout/icono-marca-formacion";

interface LogoMarcaFormacionProps {
  className?: string;
}

/** Contenedor del logo: mismo espacio que un ítem colapsado del sidebar (size-11). */
export function LogoMarcaFormacion({ className }: LogoMarcaFormacionProps) {
  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center p-1.5",
        className,
      )}
    >
      <IconoMarcaFormacion />
    </div>
  );
}
