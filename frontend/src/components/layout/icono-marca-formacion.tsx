import { cn } from "@/lib/utils";

/** Icono del panel lateral y cabeceras de la app (no es el favicon del navegador). */
export const RUTA_ICONO_MARCA = "/images/panelicon.svg";

interface IconoMarcaFormacionProps {
  className?: string;
}

/** Icono de marca; tamaño visual alineado a los íconos Lucide del sidebar (size-5/6). */
export function IconoMarcaFormacion({ className }: IconoMarcaFormacionProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={RUTA_ICONO_MARCA}
      alt=""
      className={cn("size-6 object-contain object-center", className)}
      aria-hidden
    />
  );
}
