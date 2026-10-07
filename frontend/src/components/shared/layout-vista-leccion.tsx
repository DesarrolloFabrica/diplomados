"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASE_PANEL_GLASS } from "@/config/paneles-glass";
import { useInterfaceVariant } from "@/components/providers/interface-variant-provider";
import {
  EsquemaContenidos,
  type GrupoEsquema,
} from "@/components/shared/esquema-contenidos";
import { RailModulosAventura } from "@/components/shared/rail-modulos-aventura";

interface EsquemaLeccionContexto {
  alternarEsquema: () => void;
  esquemaAbierto: boolean;
}

const EsquemaLeccionContext = createContext<EsquemaLeccionContexto | null>(null);

/** Control del esquema del curso para los atajos de clase (null fuera del layout). */
export function useEsquemaLeccion() {
  return useContext(EsquemaLeccionContext);
}

interface LayoutVistaLeccionProps {
  cursoId: string;
  enrollmentId: string;
  leccionActivaId?: string;
  evaluacionActivaId?: string;
  grupos: GrupoEsquema[];
  progresoCurso: {
    porcentaje: number;
    completados: number;
    total: number;
  };
  children: React.ReactNode;
}

export function LayoutVistaLeccion({
  cursoId,
  enrollmentId,
  leccionActivaId,
  evaluacionActivaId,
  grupos,
  progresoCurso,
  children,
}: LayoutVistaLeccionProps) {
  const { config } = useInterfaceVariant();
  const esEducational = config.id === "educational";
  const esGamified = config.id === "gamified";
  const esBusiness = config.id === "business";
  const usaNavegacionAventura = esEducational || esGamified;
  const esTemaPropio = esEducational || esGamified || esBusiness;
  // Educational/Gamified dan protagonismo al índice de contenidos/objetivos:
  // el esquema queda visible por defecto (70/30) en vez de requerir abrirlo.
  // Business no hereda ese comportamiento (no lo pidió Fase 11): mantiene el
  // esquema colapsado por defecto, igual que creative.
  const [esquemaVisible, setEsquemaVisible] = useState(esEducational || esGamified);
  const [esquemaCerrando, setEsquemaCerrando] = useState(false);
  const [esquemaMobileVisible, setEsquemaMobileVisible] = useState(false);
  const [esquemaMobileCerrando, setEsquemaMobileCerrando] = useState(false);
  const esquemaCerrarTimeoutRef = useRef<number | null>(null);
  const esquemaMobileCerrarTimeoutRef = useRef<number | null>(null);
  const esquemaEnLayout = esquemaVisible || esquemaCerrando;
  const esquemaMobileEnLayout = esquemaMobileVisible || esquemaMobileCerrando;

  useEffect(() => {
    return () => {
      if (esquemaCerrarTimeoutRef.current !== null) {
        window.clearTimeout(esquemaCerrarTimeoutRef.current);
      }
      if (esquemaMobileCerrarTimeoutRef.current !== null) {
        window.clearTimeout(esquemaMobileCerrarTimeoutRef.current);
      }
    };
  }, []);

  function abrirEsquema() {
    if (esquemaCerrarTimeoutRef.current !== null) {
      window.clearTimeout(esquemaCerrarTimeoutRef.current);
      esquemaCerrarTimeoutRef.current = null;
    }
    setEsquemaCerrando(false);
    setEsquemaVisible(true);
  }

  function cerrarEsquema() {
    if (!esquemaVisible || esquemaCerrando) return;

    setEsquemaCerrando(true);
    esquemaCerrarTimeoutRef.current = window.setTimeout(() => {
      setEsquemaVisible(false);
      setEsquemaCerrando(false);
      esquemaCerrarTimeoutRef.current = null;
    }, 180);
  }

  function abrirEsquemaMobile() {
    if (esquemaMobileCerrarTimeoutRef.current !== null) {
      window.clearTimeout(esquemaMobileCerrarTimeoutRef.current);
      esquemaMobileCerrarTimeoutRef.current = null;
    }
    setEsquemaMobileCerrando(false);
    setEsquemaMobileVisible(true);
  }

  function cerrarEsquemaMobile() {
    if (!esquemaMobileVisible || esquemaMobileCerrando) return;

    setEsquemaMobileCerrando(true);
    esquemaMobileCerrarTimeoutRef.current = window.setTimeout(() => {
      setEsquemaMobileVisible(false);
      setEsquemaMobileCerrando(false);
      esquemaMobileCerrarTimeoutRef.current = null;
    }, 180);
  }

  function alternarEsquema() {
    if (esquemaVisible) {
      cerrarEsquema();
    } else {
      abrirEsquema();
    }
  }

  // Atajo "Esquema del curso" de la barra de clase (AtajosClase). Gamified
  // solo muestra el panel lateral desde xl; por debajo abre el cajón.
  function alternarEsquemaAtajo() {
    const esEscritorioAncho = window.matchMedia("(min-width: 1280px)").matches;
    if (usaNavegacionAventura && !esEscritorioAncho) {
      if (esquemaMobileVisible) cerrarEsquemaMobile();
      else abrirEsquemaMobile();
      return;
    }
    const abriendo = !esquemaVisible;
    alternarEsquema();
    // Bajo xl el panel queda debajo del contenido: se lleva la vista hasta él.
    if (abriendo && !esEscritorioAncho) {
      window.requestAnimationFrame(() =>
        document
          .getElementById("esquema-contenidos-panel")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }

  const contextoEsquema: EsquemaLeccionContexto = {
    alternarEsquema: alternarEsquemaAtajo,
    esquemaAbierto: esquemaVisible || esquemaMobileVisible,
  };

  // En lecciones, la barra estándar AtajosClase ya trae el botón "Esquema del
  // curso"; el botón flotante solo se conserva en las evaluaciones.
  const mostrarBotonFlotante = !leccionActivaId;

  if (usaNavegacionAventura) {
    return (
      <div
        data-lesson-variant={config.lesson.variant}
        className={cn(
          "grid min-h-full w-full grid-cols-1",
          "lg:grid-cols-[minmax(0,1fr)_80px]",
          esquemaEnLayout
            ? "xl:grid-cols-[minmax(0,3fr)_minmax(304px,1fr)]"
            : "xl:grid-cols-[minmax(0,1fr)_80px]",
        )}
      >
        <section className="relative min-w-0 px-3 pb-28 pt-4 sm:px-4 sm:pb-28 lg:px-6 lg:pb-28 lg:pt-5">
          {mostrarBotonFlotante && (
            <button
              type="button"
              onClick={abrirEsquemaMobile}
              aria-expanded={esquemaMobileVisible}
              aria-controls="esquema-contenidos-aventura-mobile"
              className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--interface-text)] shadow-[0_0_20px_rgba(103,232,249,0.2)] backdrop-blur-md transition-colors hover:border-[var(--interface-accent-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] sm:bottom-6 sm:right-6 lg:hidden"
            >
              <PanelRightOpen className="size-4" aria-hidden="true" />
              Contenido
            </button>
          )}

          <EsquemaLeccionContext.Provider value={contextoEsquema}>
            <div className="mx-auto w-full max-w-[1520px]">{children}</div>
          </EsquemaLeccionContext.Provider>
        </section>

        <div
          className={cn(
            "hidden min-w-0 lg:sticky lg:top-0 lg:block lg:h-dvh lg:self-start",
            esquemaEnLayout && "xl:hidden",
          )}
        >
          <RailModulosAventura
            cursoId={cursoId}
            grupos={grupos}
            leccionActivaId={leccionActivaId}
            evaluacionActivaId={evaluacionActivaId}
            progresoCurso={progresoCurso}
            onExpandir={abrirEsquema}
          />
        </div>

        {esquemaEnLayout && (
          <aside
            id="esquema-contenidos-panel"
            className={cn(
              "hidden min-w-0 border-l border-[var(--interface-border)] bg-[var(--interface-surface)] shadow-none xl:sticky xl:top-0 xl:block xl:h-dvh xl:self-start",
              esquemaCerrando
                ? "motion-safe:animate-out motion-safe:fade-out motion-safe:slide-out-to-right-4 motion-safe:duration-200"
                : "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-200",
            )}
          >
            <EsquemaContenidos
              cursoId={cursoId}
              enrollmentId={enrollmentId}
              leccionActivaId={leccionActivaId}
              evaluacionActivaId={evaluacionActivaId}
              grupos={grupos}
              progresoCurso={progresoCurso}
              onCerrar={alternarEsquema}
            />
          </aside>
        )}

        {esquemaMobileEnLayout && (
          <div className="fixed inset-0 z-[90] xl:hidden">
            <button
              type="button"
              aria-label="Cerrar esquema de contenidos"
              onClick={cerrarEsquemaMobile}
              className={cn(
                "absolute inset-0 bg-[#061120]/62 backdrop-blur-sm",
                esquemaMobileCerrando
                  ? "motion-safe:animate-out motion-safe:fade-out motion-safe:duration-200"
                  : "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200",
              )}
            />
            <aside
              id="esquema-contenidos-aventura-mobile"
              className={cn(
                "absolute inset-y-0 right-0 w-[min(92vw,380px)] overflow-y-auto border-l border-[var(--interface-border)] bg-[var(--interface-surface)] shadow-[-20px_0_50px_rgba(6,17,32,0.32)]",
                esquemaMobileCerrando
                  ? "motion-safe:animate-out motion-safe:fade-out motion-safe:slide-out-to-right-4 motion-safe:duration-200"
                  : "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-200",
              )}
            >
              <EsquemaContenidos
                cursoId={cursoId}
                enrollmentId={enrollmentId}
                leccionActivaId={leccionActivaId}
                evaluacionActivaId={evaluacionActivaId}
                grupos={grupos}
                progresoCurso={progresoCurso}
                onCerrar={cerrarEsquemaMobile}
              />
            </aside>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-lesson-variant={config.lesson.variant}
      className={cn(
        "grid min-h-full w-full grid-cols-1",
        esquemaEnLayout &&
          (esTemaPropio
            ? "xl:grid-cols-[minmax(0,1fr)_380px]"
            : "xl:grid-cols-[minmax(0,1fr)_304px]"),
      )}
    >
      <section className="relative min-w-0 px-3 py-4 sm:px-4 lg:px-6 lg:py-5">
        {!esquemaEnLayout && mostrarBotonFlotante && (
          <button
            type="button"
            onClick={alternarEsquema}
            aria-expanded={false}
            aria-controls="esquema-contenidos-panel"
            className={cn(
              "fixed bottom-20 right-4 z-20 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold sm:bottom-6 sm:right-6",
              esBusiness
                ? "border border-[#7fb5ff]/45 bg-[#0b2b5c]/55 text-[#e8f4ff] shadow-[0_10px_28px_rgba(2,16,50,0.28)] backdrop-blur-md transition-colors hover:bg-[#123f86]/62 xl:absolute xl:bottom-auto xl:right-0 xl:top-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2"
                : esEducational
                  ? "border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] [box-shadow:var(--interface-shadow)] transition-colors hover:bg-[var(--interface-surface)] xl:absolute xl:bottom-auto xl:right-0 xl:top-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] focus-visible:ring-offset-2"
                : esGamified
                  ? "border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] shadow-[0_0_20px_rgba(103,232,249,0.2)] transition-colors hover:border-[var(--interface-accent-secondary)] xl:absolute xl:bottom-auto xl:right-0 xl:top-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent-secondary)] focus-visible:ring-offset-2"
                  : cn(
                      "text-white",
                      CLASE_PANEL_GLASS,
                      "transition-colors hover:bg-white/32 xl:absolute xl:bottom-auto xl:right-0 xl:top-0",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]",
                    ),
            )}
          >
            <PanelRightOpen className="h-4 w-4 shrink-0" />
            {esGamified ? "Objetivos" : "Esquema"}
          </button>
        )}

        <EsquemaLeccionContext.Provider value={contextoEsquema}>
          <div className="mx-auto w-full max-w-[1520px]">{children}</div>
        </EsquemaLeccionContext.Provider>
      </section>

      {esquemaEnLayout && (
        <aside
          id="esquema-contenidos-panel"
          className={cn(
            "min-w-0 rounded-none xl:sticky xl:top-0 xl:h-full xl:max-h-dvh xl:self-start xl:border-t-0",
            esquemaCerrando
              ? "motion-safe:animate-out motion-safe:fade-out motion-safe:slide-out-to-right-4 motion-safe:duration-200"
              : "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-200",
            esBusiness
              ? "border-t border-[#7fb5ff]/24 bg-[#071f39]/72 text-[#e8f4ff] shadow-[inset_1px_0_0_rgba(127,181,255,0.12)] backdrop-blur-md [--interface-accent-secondary:#22D3EE] [--interface-accent:#91DC00] [--interface-border:rgba(127,181,255,0.24)] [--interface-text-muted:rgba(206,225,248,0.72)] [--interface-text:#E8F4FF] xl:border-l xl:border-t-0"
              : esTemaPropio
              ? "border-t border-[var(--interface-border)] bg-[var(--interface-surface)] shadow-none xl:border-l xl:border-t-0"
              : cn(
                  "border-t border-white/25 xl:border-l",
                  CLASE_PANEL_GLASS,
                  "bg-white/20 shadow-none xl:rounded-l-none",
                ),
          )}
        >
          <EsquemaContenidos
            cursoId={cursoId}
            enrollmentId={enrollmentId}
            leccionActivaId={leccionActivaId}
            evaluacionActivaId={evaluacionActivaId}
            grupos={grupos}
            progresoCurso={progresoCurso}
            onCerrar={alternarEsquema}
          />
        </aside>
      )}
    </div>
  );
}
