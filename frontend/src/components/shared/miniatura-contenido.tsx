"use client";

import {
  AudioLines,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileText,
  MousePointerClick,
  Presentation,
  Video,
  type LucideIcon,
} from "lucide-react";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { cn } from "@/lib/utils";
import type { TabContenido } from "@/lib/contenido-leccion";

type VarianteMiniatura = "grande" | "compacta";

interface MiniaturaContenidoProps {
  portadaUrl?: string | null;
  portadaCursoUrl?: string | null;
  titulo: string;
  tipo: "leccion" | "evaluacion";
  categoriasContenido?: TabContenido[];
  variante?: VarianteMiniatura;
  className?: string;
}

interface IconoTipoContenidoProps {
  tipo: MiniaturaContenidoProps["tipo"];
  categoriasContenido?: TabContenido[];
  className?: string;
}

const ICONOS_TIPO: Record<TabContenido, LucideIcon> = {
  video: Video,
  podcast: AudioLines,
  documento: FileText,
  infografia: ChartNoAxesCombined,
  infografia_interactiva: MousePointerClick,
  presentacion: Presentation,
};

function iconoFallback(
  tipo: MiniaturaContenidoProps["tipo"],
  categorias?: TabContenido[],
): LucideIcon {
  if (tipo === "evaluacion") return ClipboardCheck;
  const principal = categorias?.[0];
  if (principal) return ICONOS_TIPO[principal];
  return FileText;
}

export function IconoTipoContenido({
  tipo,
  categoriasContenido,
  className,
}: IconoTipoContenidoProps) {
  const Icono = iconoFallback(tipo, categoriasContenido);
  return <Icono className={className} aria-hidden="true" />;
}

export function MiniaturaContenido({
  portadaUrl,
  portadaCursoUrl,
  titulo,
  tipo,
  categoriasContenido,
  variante = "grande",
  className,
}: MiniaturaContenidoProps) {
  const url = portadaUrl ?? portadaCursoUrl ?? null;
  const esCompacta = variante === "compacta";

  if (url) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          esCompacta
            ? "h-12 w-16 shrink-0 rounded-lg"
            : "aspect-[16/10] w-full sm:h-full sm:min-h-[120px]",
          className,
        )}
      >
        <PortadaCurso
          url={url}
          esDiplomado={false}
          titulo={titulo}
          fallback="icon"
          className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-muted to-muted/60 text-muted-foreground",
        esCompacta
          ? "h-12 w-16 shrink-0 rounded-lg"
          : "aspect-[16/10] w-full sm:h-full sm:min-h-[120px]",
        className,
      )}
      aria-label={titulo}
    >
      <IconoTipoContenido
        tipo={tipo}
        categoriasContenido={categoriasContenido}
        className={cn(esCompacta ? "h-5 w-5" : "h-10 w-10")}
      />
    </div>
  );
}
