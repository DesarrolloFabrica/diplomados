"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const AnimacionRive = dynamic(
  () => import("@/components/shared/animacion-rive").then((m) => m.AnimacionRive),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="size-full animate-pulse rounded-2xl bg-white/20"
      />
    ),
  },
);

export const HELPERD_RIV_SRC = "/images/helperd.riv";

/** Nombre exacto de la máquina de estados en helperd.riv (editor de Rive). */
export const HELPERD_STATE_MACHINE = "State Machine 1";

interface HelperdAnimacionProps {
  className?: string;
  /**
   * - seccion: embebida en un bloque de la página
   * - flotante: esquina inferior derecha
   * - pantallaCompleta: canvas a viewport completo
   */
  variante?: "seccion" | "flotante" | "pantallaCompleta";
}

/**
 * Animación Helperd (Rive) con State Machine interactiva.
 *
 * Uso pantalla completa:
 *   <HelperdAnimacion variante="pantallaCompleta" />
 *
 * Uso en una sección:
 *   <HelperdAnimacion className="h-[480px] w-full" />
 */
export function HelperdAnimacion({
  className,
  variante = "seccion",
}: HelperdAnimacionProps) {
  const animacion = (
    <AnimacionRive
      src={HELPERD_RIV_SRC}
      stateMachines={HELPERD_STATE_MACHINE}
      fit={variante === "pantallaCompleta" ? "cover" : "contain"}
      autoplay
      ariaLabel="Helperd, asistente de formación"
      className={cn(
        variante === "pantallaCompleta" ? "size-full" : "size-full",
        variante === "flotante" && "drop-shadow-[0_18px_40px_rgba(6,17,32,0.28)]",
        variante === "seccion" && "aspect-square w-full max-w-none",
      )}
    />
  );

  if (variante === "pantallaCompleta") {
    return (
      <section
        className={cn(
          // fixed + inset-0 = canvas a pantalla completa
          "fixed inset-0 z-30 size-full bg-[#061120]",
          className,
        )}
        aria-label="Escena interactiva Helperd"
      >
        {animacion}
      </section>
    );
  }

  if (variante === "flotante") {
    return (
      <aside
        className={cn(
          // pointer-events-auto: necesario para que la State Machine reciba clics/toques
          "pointer-events-auto fixed bottom-20 right-3 z-40 size-32 sm:bottom-6 sm:right-6 sm:size-44 md:size-52",
          className,
        )}
      >
        {animacion}
      </aside>
    );
  }

  return (
    <div className={cn("relative h-[min(70vh,560px)] w-full", className)}>
      {animacion}
    </div>
  );
}
