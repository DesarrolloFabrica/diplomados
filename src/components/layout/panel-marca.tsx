import { GraduationCap } from "lucide-react";

// Panel lateral de las pantallas de acceso. El elemento distintivo es la
// "ruta": nodos conectados que representan módulo → unidad → lección, la
// misma estructura académica de la plataforma.
const PASOS = [
  { titulo: "Módulo", detalle: "Fundamentos de servicio" },
  { titulo: "Unidad", detalle: "Atención al cliente" },
  { titulo: "Lección", detalle: "Protocolo de bienvenida" },
  { titulo: "Evaluación", detalle: "Aprobado · 92%" },
];

export function PanelMarca() {
  return (
    <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/15">
          <GraduationCap className="h-5 w-5" />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">
          Formación
        </span>
      </div>

      <div className="max-w-md">
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
          El aprendizaje de tu equipo, con dirección clara.
        </h1>
        <p className="mt-4 text-primary-foreground/70">
          Cursos y diplomados autoguiados. Cada colaborador sabe siempre cuál es
          su siguiente paso.
        </p>

        <ol className="mt-10 space-y-0">
          {PASOS.map((paso, i) => {
            const ultimo = i === PASOS.length - 1;
            return (
              <li key={paso.titulo} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={
                      "flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 " +
                      (ultimo
                        ? "bg-success ring-success/40"
                        : "bg-primary-foreground/80 ring-primary-foreground/20")
                    }
                  />
                  {!ultimo && <span className="h-10 w-px bg-primary-foreground/25" />}
                </div>
                <div className={ultimo ? "" : "pb-1"}>
                  <p className="text-sm font-medium">{paso.titulo}</p>
                  <p className="text-xs text-primary-foreground/60">{paso.detalle}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="text-xs text-primary-foreground/50">
        Plataforma Empresarial de Formación Autoguiada
      </p>
    </div>
  );
}
