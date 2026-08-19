"use client";

import { useState } from "react";
import { iconoTematico } from "@/components/shared/icono-tematico";

interface ImagenRecursoProps {
  url: string;
  nombre: string;
}

// Si la URL de la imagen no carga (enlace vencido, permiso revocado,
// dominio caído) se muestra el icono del tema del recurso en vez del
// cuadro roto del navegador.
export function ImagenRecurso({ url, nombre }: ImagenRecursoProps) {
  const [roto, setRoto] = useState(false);

  if (roto) {
    const Icono = iconoTematico(nombre);
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-accent/40 p-6 text-muted-foreground">
        <Icono className="h-8 w-8 shrink-0 text-accent-foreground" />
        <span className="text-sm">La imagen no está disponible en este momento.</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={nombre}
      onError={() => setRoto(true)}
      className="w-full rounded-lg border border-border"
    />
  );
}
