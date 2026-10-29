"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
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

/**
 * Nombre de la propiedad string del View Model en helperd.riv
 * enlazada al texto visible. Debe coincidir con el editor de Rive.
 */
export const HELPERD_PROPIEDAD_TEXTO = "contenido";

export type SeccionHelperd = 
  | "descubrir"
  | "diplomados"
  | "nuevos"
  | "mis-cursos"
  | "categoria";

/** Copy por sección del catálogo; editar aquí para cambiar el diálogo de Helperd. */
export const HELPERD_TEXTO_POR_SECCION: Record<SeccionHelperd, string> = {
  descubrir: "Selecciona un curso o inscríbete en uno para comenzar.",
  diplomados: "Aquí tienes los diplomados disponibles para ti.",
  nuevos: "Estos son los cursos recién publicados. ¡Dale un vistazo!",
  "mis-cursos": "Continúa donde lo dejaste. ¿Seguimos con tu formación?",
  categoria: "Filtra por categoría y encuentra justo lo que buscas.",
};

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
  /**
   * Texto del diálogo en la animación (View Model / text run).
   * Cambia por sección desde el padre.
   */
  texto?: string;
  /** Nombre de la propiedad string en el .riv (por defecto `contenido`). */
  propiedadTexto?: string;
}

const TAMANO_FLOTANTE = {
  sm: "size-32 sm:size-36",
  md: "size-40 sm:size-44 md:size-52",
  lg: "size-52 sm:size-60 md:size-72",
  xl: "size-64 sm:size-72 md:size-80",
} as const;

function nombreEstadoNormalizado(state: string): string {
  return state.trim().toLowerCase();
}

function esEstadoIdle(states: string[]): boolean {
  if (states.length === 0) return false;
  return states.every((state) => {
    const nombre = nombreEstadoNormalizado(state);
    return (
      nombre === nombreEstadoNormalizado(HELPERD_ESTADO_NORMAL) ||
      nombre === "idle" ||
      nombre.includes("entrada")
    );
  });
}

function tieneEstadoActivo(states: string[]): boolean {
  return states.some((state) => {
    const nombre = nombreEstadoNormalizado(state);
    return (
      nombre !== nombreEstadoNormalizado(HELPERD_ESTADO_NORMAL) &&
      nombre !== "idle"
    );
  });
}

/**
 * Animación Helperd (Rive) con State Machine + Data Binding.
 * Overlay: se activa con click y se cierra al volver a "Normal",
 * liberando de nuevo la interacción con el resto de la página.
 */
export function HelperdAnimacion({
  className,
  variante = "seccion",
  artboard = HELPERD_ARTBOARD,
  tamanoFlotante = "md",
  texto,
  propiedadTexto = HELPERD_PROPIEDAD_TEXTO,
}: HelperdAnimacionProps) {
  const [enfocado, setEnfocado] = useState(false);
  const enfocadoRef = useRef(false);
  /** True tras salir de Normal con el overlay abierto (evita cerrar en el frame del click). */
  const salioDeNormalRef = useRef(false);
  /** Timestamp de apertura del overlay; evita cerrar si Rive aún reporta Normal al click. */
  const abiertoEnRef = useRef(0);

  const textos = useMemo(() => {
    if (texto == null) return undefined;
    // `contenido` = propiedad VM enlazada al globo; text runs como respaldo.
    return {
      [propiedadTexto]: texto,
      Texto9: texto,
      Texto9x: texto,
    };
  }, [texto, propiedadTexto]);

  const setEnfocadoSync = (valor: boolean) => {
    enfocadoRef.current = valor;
    setEnfocado(valor);
    if (!valor) {
      salioDeNormalRef.current = false;
      abiertoEnRef.current = 0;
    }
  };

  const activarOverlayPorClick = () => {
    salioDeNormalRef.current = false;
    abiertoEnRef.current = Date.now();
    setEnfocadoSync(true);
    // Si el click solo dispara timelines dentro de Normal (sin StateChange),
    // igual marcamos salida para poder cerrar al siguiente idle/evento.
    window.setTimeout(() => {
      if (enfocadoRef.current) salioDeNormalRef.current = true;
    }, 120);
  };

  const salirFoco = () => {
    setEnfocadoSync(false);
  };

  const intentarCerrarPorIdle = () => {
    if (!enfocadoRef.current) return;
    const msAbierto = Date.now() - abiertoEnRef.current;
    // Ignorar el idle inmediato del click.
    if (msAbierto < 450) return;
    if (!salioDeNormalRef.current) return;
    setEnfocadoSync(false);
  };

  const onStateChange = (states: string[]) => {
    if (!enfocadoRef.current) return;

    if (tieneEstadoActivo(states)) {
      salioDeNormalRef.current = true;
      return;
    }

    if (esEstadoIdle(states)) {
      intentarCerrarPorIdle();
    }
  };

  const onRiveEvent = (_nombre: string) => {
    if (!enfocadoRef.current) return;
    salioDeNormalRef.current = true;
    intentarCerrarPorIdle();
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
      textos={textos}
      onStateChange={onStateChange}
      onRiveEvent={onRiveEvent}
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
    />
  );

  if (variante === "pantallaCompleta") {
    return (
      <>
        {overlayFoco}

        <section
          className={cn(
            "pointer-events-none fixed inset-0 z-50 size-full",
            className,
          )}
          aria-label="Escena interactiva Helperd"
          aria-modal={enfocado || undefined}
        >
          {/*
            Artboard a viewport completo + Listeners nativos de Rive (hover/click
            / estados). En idle, clip-path reduce la hitbox al tercio inferior
            derecho para no tapar menú, tarjetas ni el botón ⋮.
          */}
          <div
            className={cn(
              "pointer-events-auto absolute inset-0 size-full",
              !enfocado &&
                // DEBUG: fondo negro = área del clip-path / hitbox (quitar al terminar)
                "[clip-path:inset(45%_0_0_58%)] sm:[clip-path:inset(42%_0_0_62%)] md:[clip-path:inset(40%_0_0_65%)] lg:[clip-path:inset(80%_20%_0_65%)]",
            )}
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
