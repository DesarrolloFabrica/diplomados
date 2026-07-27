import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requerirSesion } from "@/lib/auth/sesion";
import { obtenerLeccion, listarRecursos } from "@/server/queries/modulos";
import { obtenerInscripcion, estaLeccionCompletada } from "@/server/queries/mis-cursos";
import { generarUrlLectura } from "@/lib/storage";
import { RecursoIncrustado } from "@/components/shared/recurso-incrustado";
import { BotonCompletar } from "./boton-completar";

interface LeccionColaboradorPageProps {
  params: Promise<{ cursoId: string; leccionId: string }>;
}

export default async function LeccionColaboradorPage({ params }: LeccionColaboradorPageProps) {
  const { cursoId, leccionId } = await params;
  const sesion = await requerirSesion();

  const leccion = await obtenerLeccion(sesion.id, leccionId);
  if (!leccion) notFound();

  const inscripcion = await obtenerInscripcion(sesion.id, cursoId);
  if (!inscripcion) notFound();

  const [recursos, completada] = await Promise.all([
    listarRecursos(sesion.id, leccionId),
    estaLeccionCompletada(sesion.id, inscripcion.id, leccionId),
  ]);
  const recursosConUrl = await Promise.all(
    recursos.map(async (recurso) => {
      if (recurso.urlExterna) return { ...recurso, url: recurso.urlExterna };
      if (recurso.storagePath) {
        try {
          const url = await generarUrlLectura(recurso.storagePath);
          return { ...recurso, url };
        } catch {
          return { ...recurso, url: null };
        }
      }
      return { ...recurso, url: null };
    }),
  );

  const contenidoTexto = (leccion.contenido as { texto?: string } | null)?.texto;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/mis-cursos/${cursoId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al curso
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          {leccion.titulo}
        </h1>
      </div>

      {contenidoTexto && (
        <p className="whitespace-pre-wrap text-muted-foreground">{contenidoTexto}</p>
      )}

      {recursosConUrl.length > 0 && (
        <div className="space-y-4">
          {recursosConUrl.map((recurso) => (
            <RecursoIncrustado
              key={recurso.id}
              nombre={recurso.nombre}
              tipo={recurso.tipo}
              url={recurso.url}
            />
          ))}
        </div>
      )}

      <BotonCompletar
        cursoId={cursoId}
        inscripcionId={inscripcion.id}
        leccionId={leccionId}
        completada={completada}
      />
    </div>
  );
}
