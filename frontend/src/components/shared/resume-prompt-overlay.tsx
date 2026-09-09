"use client";

import { formatearSegundosResumen } from "@/hooks/use-playback-resume";

interface ResumePromptOverlayProps {
  segundos: number;
  onContinuar: () => void;
  onDescartar: () => void;
}

/** Aviso "¿Continuar donde lo dejaste?" para reproductores de video nativos. */
export function ResumePromptOverlay({
  segundos,
  onContinuar,
  onDescartar,
}: ResumePromptOverlayProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4 text-center">
      <div className="w-full max-w-xs space-y-4 rounded-2xl border border-white/10 bg-[#0b1522] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.45)]">
        <p className="text-sm font-medium text-white">
          ¿Quieres continuar el video desde donde lo dejaste ({formatearSegundosResumen(segundos)})?
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onContinuar}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#06201c] transition-colors hover:bg-emerald-400"
          >
            Sí, continuar
          </button>
          <button
            type="button"
            onClick={onDescartar}
            className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10"
          >
            No, desde el inicio
          </button>
        </div>
      </div>
    </div>
  );
}
