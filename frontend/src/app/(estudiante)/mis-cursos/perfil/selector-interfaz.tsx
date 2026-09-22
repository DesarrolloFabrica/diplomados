"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart3, BookOpenCheck, Check, Sparkles, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { actualizarPreferenciaInterfaz } from "@backend/server/actions/preferencia-interfaz";
import { INTERFACE_VARIANTS, type InterfaceVariant } from "@backend/config/interface-variants";

interface SelectorInterfazProps {
  varianteActual: InterfaceVariant;
}

const DETALLE_VARIANTE: Record<
  InterfaceVariant,
  { label: string; description: string; icon: LucideIcon }
> = {
  creative: {
    label: "Creativa",
    description: "Visual, inmersiva y orientada a exploración.",
    icon: Sparkles,
  },
  business: {
    label: "Empresarial",
    description: "Directa, sobria y centrada en progreso y acciones.",
    icon: BarChart3,
  },
  educational: {
    label: "Educativa",
    description: "Clara, académica y organizada para estudiar paso a paso.",
    icon: BookOpenCheck,
  },
  gamified: {
    label: "Gamificada",
    description: "Dinámica, orientada a misiones, niveles y retos.",
    icon: Trophy,
  },
};

/** Mini-previsualizaciones abstractas (solo CSS, sin assets) por variante. */
function PreviewCreative() {
  return (
    <div className="relative h-14 w-full overflow-hidden rounded-lg bg-[#061120]">
      <div className="absolute inset-2 rounded-md bg-white/15 backdrop-blur-sm" />
      <div className="absolute bottom-2 left-2 h-4 w-10 rounded-sm bg-[#91DC00]/70" />
    </div>
  );
}

function PreviewBusiness() {
  return (
    <div className="flex h-14 w-full gap-1.5 overflow-hidden rounded-lg bg-[#eef2f6] p-1.5">
      <div className="h-full w-3 rounded-sm bg-[#0b5b73]" />
      <div className="h-full flex-1 space-y-1 rounded-sm bg-white p-1">
        <div className="h-1.5 w-2/3 rounded-full bg-[#0b5b73]/30" />
        <div className="h-1.5 w-1/2 rounded-full bg-[#22d3ee]/40" />
      </div>
    </div>
  );
}

function PreviewEducational() {
  return (
    <div className="flex h-14 w-full flex-col justify-center gap-1 overflow-hidden rounded-lg bg-[#f6efe0] p-1.5">
      <div className="h-2.5 w-2/3 rounded-full bg-[#1f5c3f]" />
      <div className="h-2.5 w-full rounded-full bg-[#fffdf5]" />
      <div className="h-2.5 w-4/5 rounded-full bg-[#b8863a]/70" />
    </div>
  );
}

function PreviewGamified() {
  return (
    <div className="relative h-14 w-full overflow-hidden rounded-lg bg-[#08111f]">
      <div className="absolute left-3 top-1/2 h-px w-[calc(50%-6px)] -translate-y-1/2 bg-white/25" />
      <div className="absolute right-3 top-1/2 h-px w-[calc(50%-24px)] -translate-y-1/2 bg-white/25" />
      <div className="absolute left-3 top-1/2 size-3 -translate-y-1/2 rounded-full bg-[#91dc00]" />
      <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#67e8f9] shadow-[0_0_8px_rgba(103,232,249,0.7)]" />
      <div className="absolute right-3 top-1/2 size-3 -translate-y-1/2 rounded-full border border-white/35" />
    </div>
  );
}

const PREVIEW_VARIANTE: Record<InterfaceVariant, () => React.ReactElement> = {
  creative: PreviewCreative,
  business: PreviewBusiness,
  educational: PreviewEducational,
  gamified: PreviewGamified,
};

export function SelectorInterfaz({ varianteActual }: SelectorInterfazProps) {
  const router = useRouter();
  const [pendiente, setPendiente] = useState<InterfaceVariant | null>(null);
  const [guardando, iniciar] = useTransition();

  function seleccionar(variant: InterfaceVariant) {
    if (variant === varianteActual || guardando) return;

    setPendiente(variant);
    iniciar(async () => {
      const resultado = await actualizarPreferenciaInterfaz({ variant });

      if (!resultado.ok) {
        toast.error(resultado.mensaje ?? "No se pudo actualizar la interfaz.");
        setPendiente(null);
        return;
      }

      toast.success("Interfaz actualizada");
      setPendiente(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--interface-text)]">
          Preferencias de interfaz
        </h2>
        <p className="mt-1 text-sm text-[var(--interface-text-muted)]">
          Elige como quieres ver la plataforma. Puedes cambiarla cuando quieras.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {INTERFACE_VARIANTS.map((variant) => {
          const detalle = DETALLE_VARIANTE[variant];
          const Icono = detalle.icon;
          const Preview = PREVIEW_VARIANTE[variant];
          const activa = variant === varianteActual;
          const cargandoEsta = guardando && pendiente === variant;

          return (
            <button
              key={variant}
              type="button"
              onClick={() => seleccionar(variant)}
              disabled={guardando}
              aria-pressed={activa}
              aria-current={activa ? "true" : undefined}
              aria-busy={cargandoEsta}
              className={cn(
                "group flex flex-col gap-3 rounded-[var(--interface-radius)] border p-4 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interface-accent)] focus-visible:ring-offset-2",
                activa
                  ? "border-[var(--interface-accent)] bg-[var(--interface-surface-strong)] shadow-[var(--interface-shadow)]"
                  : "border-[var(--interface-border)] bg-[var(--interface-surface)] hover:border-[var(--interface-accent)]",
                guardando && !activa && !cargandoEsta && "opacity-60",
                guardando && "cursor-wait",
              )}
            >
              <Preview />

              <div className="flex items-start justify-between gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] text-[var(--interface-accent)]">
                  <Icono className="size-4.5" aria-hidden="true" />
                </span>

                {activa ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                    <Check className="size-3.5" aria-hidden="true" />
                    Activa
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-semibold text-[var(--interface-accent)]">
                    {cargandoEsta ? "Guardando..." : "Seleccionar"}
                  </span>
                )}
              </div>

              <div>
                <p className="font-bold text-[var(--interface-text)]">
                  Interfaz {detalle.label}
                </p>
                <p className="mt-1 text-sm text-[var(--interface-text-muted)]">
                  {detalle.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
