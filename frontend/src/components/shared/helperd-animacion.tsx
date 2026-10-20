"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const AnimacionRive = dynamic(
  () => import("@/components/shared/animacion-rive").then((m) => m.AnimacionRive),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="size-full animate-pulse bg-white/10"
      />
    ),
  },
);

export const HELPERD_RIV_SRC = "/images/helperd.riv";

/** Nombre exacto de la máquina de estados en helperd.riv (editor de Rive). */
export const HELPERD_STATE_MACHINE = "State Machine 1";

/**
 * Artboard por defecto. El archivo tiene "Artboard 1" y "Artboard 2".
 * Si la figura no coincide con el editor, prueba el otro valor.
 */
export const HELPERD_ARTBOARD = "Artboard 1";

/** Estado idle de la State Machine al que vuelve tras completar la animación. */
export const HELPERD_ESTADO_NORMAL = "Normal";

interface HelperdAnimacionProps {
  className?: string;
  /**
   * - seccion: bloque embebido en el flujo de la página
   * - flotante: esquina (no tapa el resto de la UI)
   * - pantallaCompleta: viewport completo; overlay solo al hacer click
   */
  variante?: "seccion" | "flotante" | "pantallaCompleta";
  /** Sobrescribe el artboard del .riv */
  artboard?: string;
  /**
   * Escala visual del contenedor en variante flotante
   * (sm ≈ 8rem, md ≈ 11rem, lg ≈ 14rem, xl ≈ 18rem).
   */
  tamanoFlotante?: "sm" | "md" | "lg" | "xl";
}

const TAMANO_FLOTANTE = {
  sm: "size-32 sm:size-36",
  md: "size-40 sm:size-44 md:size-52",
  lg: "size-52 sm:size-60 md:size-72",
  xl: "size-64 sm:size-72 md:size-80",
} as const;

function esSoloNormal(states: string[]): boolean {
  return (
    states.length > 0 &&
    states.every((state) => state === HELPERD_ESTADO_NORMAL)
  );
}

function tieneEstadoActivo(states: string[]): boolean {
  return states.some((state) => state !== HELPERD_ESTADO_NORMAL);
}

/**
 * Animación Helperd (Rive) con State Machine + Data Binding.
 * Overlay: se activa con click y se apaga al volver al estado "Normal".
 */
export function HelperdAnimacion({
  className,
  variante = "seccion",
  artboard = HELPERD_ARTBOARD,
  tamanoFlotante = "md",
}: HelperdAnimacionProps) {
  const [enfocado, setEnfocado] = useState(false);
  const enfocadoRef = useRef(false);
  const estadosPreviosRef = useRef<string[]>([]);

  const setEnfocadoSync = (valor: boolean) => {
    enfocadoRef.current = valor;
    setEnfocado(valor);
  };

  const activarOverlayPorClick = () => {
    setEnfocadoSync(true);
  };

  const salirFoco = () => {
    setEnfocadoSync(false);
  };

  const onStateChange = (states: string[]) => {
    const previos = estadosPreviosRef.current;
    const veniaDeEstadoActivo = tieneEstadoActivo(previos);
    const volvioANormal = esSoloNormal(states);

    // Solo cierra si ya hubo un estado distinto de Normal (evita cerrar
    // en el mismo frame del click, cuando aún sigue en Normal).
    if (enfocadoRef.current && veniaDeEstadoActivo && volvioANormal) {
      setEnfocadoSync(false);
    }

    estadosPreviosRef.current = states;
  };

  useEffect(() => {
    if (!enfocado) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") salirFoco();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enfocado]);

  const animacion = (
    <AnimacionRive
      src={HELPERD_RIV_SRC}
      artboard={artboard}
      stateMachine={HELPERD_STATE_MACHINE}
      autoBind
      autoplay
      fit="contain"
      alignment="center"
      ariaLabel="Helperd, asistente de formación"
      className="size-full"
      onStateChange={onStateChange}
    />
  );

  const overlayFoco = (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-40 bg-[#020811]/80 transition-opacity duration-300 ease-out motion-reduce:transition-none",
        enfocado
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
      onClick={salirFoco}
    />
  );

  if (variante === "pantallaCompleta") {
    return (
      <>
        {overlayFoco}

        <section
          className={cn("pointer-events-none fixed inset-0 z-50 size-full", className)}
          aria-label="Escena interactiva Helperd"
          aria-modal={enfocado || undefined}
        >
          <div
            className="pointer-events-auto absolute inset-0 size-full"
            onClick={() => {
              if (!enfocadoRef.current) activarOverlayPorClick();
            }}
          >
            {animacion}
          </div>
        </section>
      </>
    );
  }

  if (variante === "flotante") {
    return (
      <>
        {overlayFoco}
        <aside
          className={cn(
            "pointer-events-auto fixed bottom-20 right-3 z-50 sm:bottom-6 sm:right-6",
            TAMANO_FLOTANTE[tamanoFlotante],
            className,
          )}
          onClick={() => {
            if (!enfocadoRef.current) activarOverlayPorClick();
          }}
        >
          {animacion}
        </aside>
      </>
    );
  }

  return (
    <div className={cn("relative h-[min(70vh,560px)] w-full", className)}>
      {animacion}
    </div>
  );
}
