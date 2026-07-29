"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const TEXTO_BASE = "El aprendizaje de tu equipo, con ";
const TEXTO_DESTACADO = "dirección clara.";
const TEXTO_COMPLETO = `${TEXTO_BASE}${TEXTO_DESTACADO}`;
/** ~3s para el texto completo */
const MS_POR_CARACTER = 62;

function TituloCompleto({ className }: { className?: string }) {
  return (
    <span className={className}>
      {TEXTO_BASE}
      <span className="text-cun-green">{TEXTO_DESTACADO}</span>
    </span>
  );
}

function preferReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function TituloMarcaTypewriter() {
  const pathname = usePathname();
  const animarEnLogin = pathname === "/login";

  const [caracteres, setCaracteres] = useState(
    animarEnLogin ? 0 : TEXTO_COMPLETO.length,
  );
  const [listo, setListo] = useState(!animarEnLogin);

  useEffect(() => {
    if (!animarEnLogin || preferReducedMotion()) {
      setCaracteres(TEXTO_COMPLETO.length);
      setListo(true);
      return;
    }

    setCaracteres(0);
    setListo(false);
    let i = 0;

    const id = window.setInterval(() => {
      i += 1;
      setCaracteres(i);
      if (i >= TEXTO_COMPLETO.length) {
        window.clearInterval(id);
        setListo(true);
      }
    }, MS_POR_CARACTER);

    return () => window.clearInterval(id);
  }, [animarEnLogin]);

  const visible = TEXTO_COMPLETO.slice(0, caracteres);
  const baseVisible = visible.slice(0, TEXTO_BASE.length);
  const destacadoVisible =
    visible.length > TEXTO_BASE.length
      ? visible.slice(TEXTO_BASE.length)
      : "";

  return (
    <h1
      className="font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl"
      aria-label={TEXTO_COMPLETO}
    >
      {/* Reserva espacio del título completo para evitar saltos de layout */}
      <span className="invisible block" aria-hidden="true">
        <TituloCompleto />
      </span>

      <span className="absolute inset-x-0 top-0" aria-hidden="true">
        {baseVisible}
        {destacadoVisible ? (
          <span className="text-cun-green">{destacadoVisible}</span>
        ) : null}
        {!listo ? (
          <span
            className="animate-cun-caret ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.1em] bg-cun-green align-baseline"
          />
        ) : null}
      </span>
    </h1>
  );
}
