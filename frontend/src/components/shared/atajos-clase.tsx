"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ListTree, LockKeyhole } from "lucide-react";
import { CLASE_PANEL_GLASS } from "@/config/paneles-glass";
import { useInterfaceVariant } from "@/components/providers/interface-variant-provider";
import { useEsquemaLeccion } from "@/components/shared/layout-vista-leccion";
import type { ItemRutaContenido } from "@/lib/ruta-curso";
import { cn } from "@/lib/utils";

interface AtajosClaseProps {
  anterior: ItemRutaContenido | null;
  siguiente: ItemRutaContenido | null;
}

/** Atajos de teclado (Shift + tecla), iguales en las 4 interfaces. */
const TECLAS = {
  anterior: { key: "ArrowLeft", etiqueta: "Shift + ←" },
  siguiente: { key: "ArrowRight", etiqueta: "Shift + →" },
  esquema: { key: "E", etiqueta: "Shift + E" },
} as const;

/** No interceptar atajos mientras se escribe en un campo de texto. */
function esCampoEditable(destino: EventTarget | null): boolean {
  if (!(destino instanceof HTMLElement)) return false;
  return (
    destino.isContentEditable ||
    destino instanceof HTMLInputElement ||
    destino instanceof HTMLTextAreaElement ||
    destino instanceof HTMLSelectElement
  );
}

function etiquetaDestino(item: ItemRutaContenido, direccion: "anterior" | "siguiente") {
  if (item.tipo === "evaluacion") {
    return direccion === "anterior" ? "Evaluación anterior" : "Siguiente evaluación";
  }
  return direccion === "anterior" ? "Clase anterior" : "Siguiente clase";
}

/**
 * Barra estándar del reproductor de clase (las 4 interfaces): "Clase
 * anterior", "Esquema del curso" y "Siguiente clase", con atajos de teclado.
 * Cada interfaz solo cambia los colores (tokens --interface-* o vidrio en
 * creative); la estructura, textos y teclas son los mismos.
 */
export function AtajosClase({ anterior, siguiente }: AtajosClaseProps) {
  const router = useRouter();
  const esquema = useEsquemaLeccion();
  const { config } = useInterfaceVariant();
  const esCreative = config.id === "creative";

  const hrefAnterior = anterior && !anterior.bloqueado ? anterior.href : null;
  const hrefSiguiente = siguiente && !siguiente.bloqueado ? siguiente.href : null;

  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (!evento.shiftKey || evento.ctrlKey || evento.metaKey || evento.altKey) return;
      if (evento.repeat || esCampoEditable(evento.target)) return;

      if (evento.key === TECLAS.anterior.key && hrefAnterior) {
        evento.preventDefault();
        router.push(hrefAnterior);
      } else if (evento.key === TECLAS.siguiente.key && hrefSiguiente) {
        evento.preventDefault();
        router.push(hrefSiguiente);
      } else if (evento.key.toUpperCase() === TECLAS.esquema.key && esquema) {
        evento.preventDefault();
        esquema.alternarEsquema();
      }
    }

    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [esquema, hrefAnterior, hrefSiguiente, router]);

  const claseBoton = cn(
    "group inline-flex min-h-11 min-w-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors sm:px-4",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    esCreative
      ? cn(
          CLASE_PANEL_GLASS,
          "text-white hover:bg-white/30 focus-visible:ring-[#91DC00] focus-visible:ring-offset-[#061120]",
        )
      : "border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-text)] [box-shadow:var(--interface-shadow)] hover:border-[var(--interface-accent-secondary)] focus-visible:ring-[var(--interface-accent-secondary)]",
  );
  const claseDeshabilitado = "cursor-not-allowed opacity-50";
  const claseTitulo = cn(
    "hidden max-w-[16ch] truncate text-xs font-normal md:block xl:max-w-[24ch]",
    esCreative ? "text-white/70" : "text-[var(--interface-text-muted)]",
  );

  function renderBotonNavegacion(
    item: ItemRutaContenido | null,
    href: string | null,
    direccion: "anterior" | "siguiente",
  ) {
    const esAnterior = direccion === "anterior";
    const etiqueta = item
      ? etiquetaDestino(item, direccion)
      : esAnterior
        ? "Clase anterior"
        : "Siguiente clase";
    const tecla = esAnterior ? TECLAS.anterior.etiqueta : TECLAS.siguiente.etiqueta;
    const Icono = esAnterior ? ChevronLeft : ChevronRight;
    const contenido = (
      <>
        {esAnterior && <Icono className="size-4 shrink-0" aria-hidden="true" />}
        {item?.bloqueado && <LockKeyhole className="size-4 shrink-0" aria-hidden="true" />}
        {/* En móvil solo el ícono (la etiqueta queda para lectores de pantalla). */}
        <span
          className={cn(
            "sr-only min-w-0 flex-col sm:not-sr-only sm:flex",
            esAnterior ? "items-start" : "items-end",
          )}
        >
          <span className="whitespace-nowrap">{etiqueta}</span>
          {item && <span className={claseTitulo}>{item.titulo}</span>}
        </span>
        {!esAnterior && <Icono className="size-4 shrink-0" aria-hidden="true" />}
      </>
    );

    const ayuda = !item
      ? esAnterior
        ? "Esta es la primera clase del curso"
        : "Esta es la última clase del curso"
      : item.bloqueado
        ? "Completa esta clase para desbloquear la siguiente"
        : `${etiqueta}: ${item.titulo} (${tecla})`;

    if (!href) {
      return (
        <span
          role="link"
          aria-disabled="true"
          title={ayuda}
          className={cn(claseBoton, claseDeshabilitado)}
        >
          {contenido}
        </span>
      );
    }

    return (
      <Link href={href} title={ayuda} aria-label={ayuda} className={claseBoton}>
        {contenido}
      </Link>
    );
  }

  return (
    <nav
      aria-label="Navegación de la clase"
      className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2"
    >
      <div className="flex min-w-0 justify-start">
        {renderBotonNavegacion(anterior, hrefAnterior, "anterior")}
      </div>

      <button
        type="button"
        onClick={() => esquema?.alternarEsquema()}
        disabled={!esquema}
        aria-pressed={esquema?.esquemaAbierto ?? false}
        aria-controls="esquema-contenidos-panel"
        title={`Esquema del curso (${TECLAS.esquema.etiqueta})`}
        className={cn(claseBoton, !esquema && claseDeshabilitado)}
      >
        <ListTree className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden whitespace-nowrap sm:inline">Esquema del curso</span>
        <span className="sm:hidden">Esquema</span>
      </button>

      <div className="flex min-w-0 justify-end">
        {renderBotonNavegacion(siguiente, hrefSiguiente, "siguiente")}
      </div>
    </nav>
  );
}
