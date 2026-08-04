"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { normalizarUrlImagen } from "@/lib/images/normalizar-url-imagen";
import { iconoTematico } from "@/components/shared/icono-tematico";

interface PortadaCursoProps {
  cursoId?: string;
  url?: string | null;
  imagenPortadaUrl?: string | null;
  esDiplomado: boolean;
  titulo?: string;
  alt?: string;
  fallback?: "icon" | "abstract";
  className?: string;
}

function FondoAbstractoPortada({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-full w-full bg-[linear-gradient(135deg,#061120_0%,#0b1b2b_35%,#10263a_65%,#14233d_100%)]",
        "bg-[radial-gradient(circle_at_30%_40%,rgba(83,230,220,0.12),transparent_45%),radial-gradient(circle_at_70%_60%,rgba(157,104,255,0.1),transparent_40%)]",
        className,
      )}
    />
  );
}

function resolverUrlPortada(props: PortadaCursoProps): string | null {
  return props.imagenPortadaUrl ?? props.url ?? null;
}

// next/image con unoptimized: portadas externas y proxy de Drive no usan dominios fijos.
export function PortadaCurso(props: PortadaCursoProps) {
  const {
    cursoId,
    esDiplomado,
    titulo = "",
    alt = "",
    fallback = "icon",
    className,
  } = props;

  const rawUrl = resolverUrlPortada(props);
  const srcNormalizado = normalizarUrlImagen(rawUrl);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [srcNormalizado, cursoId]);

  const imageKey = `${cursoId ?? "portada"}-${srcNormalizado}`;
  const usarImagen = Boolean(srcNormalizado) && !imageError;

  if (!usarImagen) {
    if (fallback === "abstract") {
      return <FondoAbstractoPortada className={className} />;
    }

    const Icono = iconoTematico(titulo, esDiplomado);
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

  const requiereUnoptimized =
    srcNormalizado.startsWith("/api/imagenes/google-drive") ||
    srcNormalizado.startsWith("http://") ||
    srcNormalizado.startsWith("https://");

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <Image
        key={imageKey}
        src={srcNormalizado}
        alt={alt}
        fill
        unoptimized={requiereUnoptimized}
        sizes="100vw"
        className={cn(
          "object-cover object-center transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0",
        )}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
}

export function PortadaMiniatura({
  url,
  esDiplomado,
  titulo,
  cursoId,
}: Omit<PortadaCursoProps, "className" | "alt" | "fallback">) {
  return (
    <div className="relative h-10 w-14 overflow-hidden rounded-md border border-border">
      <PortadaCurso
        cursoId={cursoId}
        url={url}
        esDiplomado={esDiplomado}
        titulo={titulo}
      />
    </div>
  );
}
