"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  candidatosPortadaDrive,
  type CandidatoPortadaDrive,
} from "@/lib/images/google-drive";
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

function esUrlExterna(url: string): boolean {
  return (
    url.startsWith("/api/imagenes/google-drive") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  );
}

function PortadaDriveIframe({
  src,
  titulo,
  className,
}: {
  src: string;
  titulo: string;
  className?: string;
}) {
  return (
    <iframe
      src={src}
      title={titulo ? `Vista previa de ${titulo}` : "Portada del curso"}
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 h-[145%] w-[145%] -translate-x-1/2 -translate-y-1/2 border-0",
        className,
      )}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}

function PortadaImagen({
  src,
  alt,
  onFallo,
}: {
  src: string;
  alt: string;
  onFallo: () => void;
}) {
  const externa = esUrlExterna(src);

  if (externa) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover object-center"
        onError={onFallo}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, 400px"
      className="object-cover object-center"
      onError={onFallo}
    />
  );
}

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
  const candidatos = useMemo(() => candidatosPortadaDrive(rawUrl), [rawUrl]);
  const [indiceCandidato, setIndiceCandidato] = useState(0);
  const [agotado, setAgotado] = useState(false);

  useEffect(() => {
    setIndiceCandidato(0);
    setAgotado(false);
  }, [rawUrl, cursoId]);

  const candidatoActual: CandidatoPortadaDrive | undefined = candidatos[indiceCandidato];
  const hayPortada = Boolean(candidatoActual) && !agotado;

  function avanzarCandidato() {
    setIndiceCandidato((actual) => {
      const siguiente = actual + 1;
      if (siguiente >= candidatos.length) {
        setAgotado(true);
        return actual;
      }
      return siguiente;
    });
  }

  if (!hayPortada) {
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

  const clave = `${cursoId ?? "portada"}-${indiceCandidato}-${candidatoActual.url}`;

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {candidatoActual.modo === "iframe" ? (
        <PortadaDriveIframe
          key={clave}
          src={candidatoActual.url}
          titulo={titulo}
        />
      ) : (
        <PortadaImagen
          key={clave}
          src={candidatoActual.url}
          alt={alt || titulo}
          onFallo={avanzarCandidato}
        />
      )}
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
