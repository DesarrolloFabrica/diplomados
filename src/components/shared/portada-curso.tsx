"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { iconoTematico } from "@/components/shared/icono-tematico";

interface PortadaCursoProps {
  url: string | null;
  esDiplomado: boolean;
  titulo?: string;
  className?: string;
}

// <img> plano (no next/image): la portada es una URL externa arbitraria
// que el instructor pega a mano, no un dominio fijo que se pueda
// registrar de antemano en next.config.mjs. Si esa URL no carga se cae al
// icono del tema del curso en vez de dejar la imagen rota del navegador.
export function PortadaCurso({ url, esDiplomado, titulo = "", className }: PortadaCursoProps) {
  const [urlFallida, setUrlFallida] = useState<string | null>(null);

  if (url && urlFallida !== url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        onError={() => setUrlFallida(url)}
        className={cn("h-full w-full rounded-md object-cover", className)}
      />
    );
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

export function PortadaMiniatura({ url, esDiplomado, titulo }: Omit<PortadaCursoProps, "className">) {
  return (
    <div className="h-10 w-14 overflow-hidden rounded-md border border-border">
      <PortadaCurso url={url} esDiplomado={esDiplomado} titulo={titulo} />
    </div>
  );
}
