import { notFound, redirect } from "next/navigation";
import { requerirSesion } from "@backend/lib/auth/sesion";
import { cargarVistaCursoColaborador } from "@backend/server/queries/mis-cursos";
import { RutaAprendizaje } from "@/components/shared/ruta-aprendizaje";
import { construirGruposRuta } from "@/lib/roadmap/grupos-curso";
import { cursoRoadmapCompletado } from "@/lib/roadmap/siguiente-nodo";

interface CursoColaboradorPageProps {
  params: Promise<{ cursoId: string }>;
  searchParams: Promise<{ roadmapFocus?: string; roadmapTransition?: string }>;
}

export default async function CursoColaboradorPage({
  params,
  searchParams,
}: CursoColaboradorPageProps) {
  const { cursoId } = await params;
  const { roadmapFocus, roadmapTransition } = await searchParams;
  const sesion = await requerirSesion();

  const vista = await cargarVistaCursoColaborador(sesion.id, cursoId);
  if (!vista) notFound();

  const { curso, modulos, inscripcion } = vista;

  if (!inscripcion) {
    redirect(`/mis-cursos/${cursoId}/informacion`);
  }

  const grupos = construirGruposRuta(cursoId, vista);
  const hayContenido = grupos.some((g) => g.nodos.length > 0);
  const porcentajeAvance = Number(inscripcion.porcentajeAvance);
  const cursoCompletado = cursoRoadmapCompletado(grupos);

  return (
    <div className="min-w-0">
      {hayContenido ? (
        <RutaAprendizaje
          grupos={grupos}
          focoNodoId={roadmapFocus}
          transicionNodoId={roadmapTransition}
          modoInmersivo
          cursoTitulo={curso.titulo}
          heroInmersivo={{
            titulo: curso.titulo,
            descripcion: curso.descripcion,
            duracionEstimadaMin: curso.duracionEstimadaMin,
            nivelDificultad: curso.nivelDificultad,
            cantidadModulos: modulos.length,
            porcentajeAvance,
            cursoCompletado,
            nombreUsuario: sesion.nombreCompleto,
            ultimaLeccionId: inscripcion.ultimaLeccionId,
          }}
        />
      ) : (
        <p className="px-6 py-10 text-center text-muted-foreground">
          Este curso todavía no tiene contenido.
        </p>
      )}
    </div>
  );
}
