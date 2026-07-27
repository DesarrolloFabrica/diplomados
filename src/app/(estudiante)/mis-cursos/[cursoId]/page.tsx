import { notFound } from "next/navigation";
import { requerirSesion } from "@/lib/auth/sesion";
import { obtenerCurso, listarModulos } from "@/server/queries/cursos";
import {
  obtenerInscripcion,
  listarLeccionesConProgreso,
  listarEvaluacionesConEstado,
} from "@/server/queries/mis-cursos";
import { Progress } from "@/components/ui/progress";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { RutaAprendizaje, type GrupoRuta } from "@/components/shared/ruta-aprendizaje";
import { BotonInscribirme } from "./boton-inscribirme";

interface CursoColaboradorPageProps {
  params: Promise<{ cursoId: string }>;
}

export default async function CursoColaboradorPage({ params }: CursoColaboradorPageProps) {
  const { cursoId } = await params;
  const sesion = await requerirSesion();

  const curso = await obtenerCurso(sesion.id, cursoId);
  if (!curso) notFound();

  const inscripcion = await obtenerInscripcion(sesion.id, cursoId);

  if (!inscripcion) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-40 w-full overflow-hidden rounded-lg">
          <PortadaCurso
            url={curso.imagenPortadaUrl}
            esDiplomado={curso.esDiplomado}
            className="rounded-none"
          />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{curso.titulo}</h1>
        {curso.descripcion && <p className="text-muted-foreground">{curso.descripcion}</p>}
        {curso.objetivo && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Objetivo: </span>
            {curso.objetivo}
          </p>
        )}
        <BotonInscribirme cursoId={cursoId} />
      </div>
    );
  }

  const modulos = await listarModulos(sesion.id, cursoId);
  const modulosConLecciones = await Promise.all(
    modulos.map(async (modulo) => ({
      ...modulo,
      lecciones: await listarLeccionesConProgreso(sesion.id, modulo.id, inscripcion.id),
    })),
  );
  const evaluaciones = await listarEvaluacionesConEstado(sesion.id, cursoId);

  // La navegación "obligatoria" bloquea un nodo hasta completar todos los
  // anteriores en la ruta (lecciones y evaluaciones, en orden). Con "libre"
  // nada se bloquea.
  const esObligatoria = curso.navegacion === "obligatoria";
  let previoCompletado = true;

  const grupos: GrupoRuta[] = modulosConLecciones.map((modulo, indiceModulo) => ({
    titulo: `Módulo ${indiceModulo + 1}: ${modulo.titulo}`,
    nodos: modulo.lecciones.map((leccion) => {
      const bloqueado = esObligatoria && !previoCompletado;
      previoCompletado = leccion.completada;
      return {
        id: leccion.id,
        tipo: "leccion" as const,
        titulo: leccion.titulo,
        href: `/mis-cursos/${cursoId}/lecciones/${leccion.id}`,
        completado: leccion.completada,
        bloqueado,
      };
    }),
  }));

  if (evaluaciones.length > 0) {
    grupos.push({
      titulo: "Evaluaciones",
      nodos: evaluaciones.map((evaluacion) => {
        const bloqueado = esObligatoria && !previoCompletado;
        previoCompletado = evaluacion.aprobado;
        return {
          id: evaluacion.id,
          tipo: "evaluacion" as const,
          titulo: evaluacion.titulo,
          href: `/mis-cursos/${cursoId}/evaluaciones/${evaluacion.id}`,
          completado: evaluacion.aprobado,
          bloqueado,
        };
      }),
    });
  }

  const hayContenido = grupos.some((g) => g.nodos.length > 0);

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-3xl">
        <div className="h-40 w-full overflow-hidden rounded-lg">
          <PortadaCurso
            url={curso.imagenPortadaUrl}
            esDiplomado={curso.esDiplomado}
            className="rounded-none"
          />
        </div>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
          {curso.titulo}
        </h1>
        <div className="mt-3 space-y-1">
          <Progress value={Number(inscripcion.porcentajeAvance)} />
          <p className="text-sm text-muted-foreground">
            {Math.round(Number(inscripcion.porcentajeAvance))}% completado
          </p>
        </div>
      </div>

      {hayContenido ? (
        <div className="overflow-x-auto py-4">
          <RutaAprendizaje grupos={grupos} />
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
          Este curso todavía no tiene contenido.
        </p>
      )}
    </div>
  );
}
