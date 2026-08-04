"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { NodoCurso } from "@/components/shared/nodo-curso";
import { AnilloProgreso } from "@/components/shared/anillo-progreso";
import { inscribirme } from "@/server/actions/inscripciones";
import type { CursoCatalogoFila } from "@/server/queries/mis-cursos";

interface CatalogoCursosProps {
  misCursos: CursoCatalogoFila[];
  disponibles: CursoCatalogoFila[];
}

export function CatalogoCursos({ misCursos, disponibles }: CatalogoCursosProps) {
  const enProgreso = misCursos.find(
    (c) => c.estadoInscripcion !== "finalizado" && c.estadoInscripcion !== "aprobado",
  );

  return (
    <div className="space-y-10">
      {enProgreso && <HeroContinuar curso={enProgreso} />}

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Tu progreso</h2>
        {misCursos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
            Todavía no te has inscrito en ningún curso. Elige uno abajo, en el catálogo.
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {misCursos.map((curso) => (
              <Link key={curso.id} href={`/mis-cursos/${curso.id}`}>
                <NodoCurso
                  titulo={curso.titulo}
                  imagenPortadaUrl={curso.imagenPortadaUrl}
                  esDiplomado={curso.esDiplomado}
                  porcentaje={Number(curso.porcentajeAvance ?? 0)}
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Catálogo disponible</h2>
        <p className="-mt-2 text-sm text-muted-foreground">
          Elige uno para inscribirte al instante.
        </p>
        {disponibles.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
            No hay más cursos disponibles por ahora.
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {disponibles.map((curso) => (
              <NodoDisponible key={curso.id} curso={curso} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HeroContinuar({ curso }: { curso: CursoCatalogoFila }) {
  const porcentaje = Number(curso.porcentajeAvance ?? 0);

  return (
    <Link
      href={`/mis-cursos/${curso.id}`}
      className="group relative block h-56 w-full overflow-hidden rounded-2xl shadow-md"
    >
      <PortadaCurso
        cursoId={curso.id}
        url={curso.imagenPortadaUrl}
        esDiplomado={curso.esDiplomado}
        titulo={curso.titulo}
        className="rounded-none transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061120] via-[#164A73] to-[#164A73] dark:from-black/85 dark:via-black/50 dark:to-black/10" />
      <div className="absolute inset-0 flex items-center justify-between gap-4 p-6">
        <div className="max-w-md space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Continúa aprendiendo
          </p>
          <h2 className="font-display text-2xl font-semibold text-white">{curso.titulo}</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
        <div className="relative hidden shrink-0 items-center justify-center sm:flex" style={{ width: 88, height: 88 }}>
          <AnilloProgreso porcentaje={porcentaje} tamano={88} grosor={6} className="absolute inset-0" />
          <span className="font-display text-lg font-semibold text-white dark:text-white">{Math.round(porcentaje)}%</span>
        </div>
      </div>
    </Link>
  );
}

function NodoDisponible({ curso }: { curso: CursoCatalogoFila }) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();

  function inscribir() {
    iniciar(async () => {
      const res = await inscribirme(curso.id);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo inscribir");
        return;
      }
      toast.success("Inscripción exitosa");
      router.push(`/mis-cursos/${curso.id}`);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={inscribir}
      disabled={enviando}
      className="cursor-pointer disabled:opacity-50"
    >
      <NodoCurso
        titulo={curso.titulo}
        imagenPortadaUrl={curso.imagenPortadaUrl}
        esDiplomado={curso.esDiplomado}
      />
    </button>
  );
}
