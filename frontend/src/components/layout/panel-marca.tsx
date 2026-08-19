import { GraduationCap } from "lucide-react";
import { TituloMarcaTypewriter } from "@/components/layout/titulo-marca-typewriter";

// Panel lateral de las pantallas de acceso. El elemento distintivo es la
// "ruta": nodos conectados que representan módulo → unidad → lección, la
// misma estructura académica de la plataforma.
const PASOS: ReadonlyArray<{
  titulo: string;
  detalle: string;
  aprobado?: boolean;
}> = [
  { titulo: "Módulo", detalle: "Fundamentos de servicio" },
  { titulo: "Unidad", detalle: "Atención al cliente" },
  { titulo: "Lección", detalle: "Protocolo de bienvenida" },
  { titulo: "Evaluación", detalle: "Aprobado · 92%", aprobado: true },
];

export function PanelMarca() {
  return (
    <aside className="bg-cun-auth-panel relative flex flex-col justify-between overflow-hidden px-5 py-8 text-white md:px-8 md:py-10 lg:px-12 lg:py-12">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-400/100">
          <GraduationCap className="h-5 w-5 text-slate-900" aria-hidden />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight text-white">
          Formación
        </span>
      </div>

      <div className="mt-8 max-w-md md:mt-0">
        <div className="relative">
          <TituloMarcaTypewriter />
        </div>
        <p className="mt-4 text-sm text-white/70 sm:text-base">
          Cursos y diplomados autoguiados. Cada colaborador sabe siempre cuál es
          su siguiente paso.
        </p>

        {/* Indicadores: ocultos en móvil para reducir desplazamiento */}
        <ol className="mt-10 hidden space-y-0 md:block">
          {PASOS.map((paso, i) => {
            const ultimo = i === PASOS.length - 1;
            return (
              <li key={paso.titulo} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={
                      "flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 " +
                      (paso.aprobado
                        ? "bg-cun-green ring-cun-green/40"
                        : "bg-lime-400/100 ring-white/20")
                    }
                  />
                  {!ultimo && (
                    <span className="h-10 w-px bg-white/25" aria-hidden />
                  )}
                </div>
                <div className={ultimo ? "" : "pb-1"}>
                  <p className="text-sm font-medium text-white">{paso.titulo}</p>
                  <p
                    className={
                      "text-xs " +
                      (paso.aprobado ? "text-cun-green" : "text-white/70")
                    }
                  >
                    {paso.detalle}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="mt-8 text-xs text-white/70 md:mt-0">
        Plataforma Empresarial de Formación Autoguiada
      </p>
    </aside>
  );
}
