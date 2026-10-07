import { NextResponse } from "next/server";
import { requerirSesion } from "@backend/lib/auth/sesion";
import { cargarVistaCursoColaborador } from "@backend/server/queries/mis-cursos";
import { construirGruposRuta } from "@/lib/roadmap/grupos-curso";
import { resolverNodoContinuar } from "@/lib/roadmap/siguiente-nodo";

/**
 * Destino de los botones "Continuar" del home: lleva directo a la última
 * clase abierta por el estudiante (o a la siguiente si ya la completó), con
 * la misma regla que el "Continuar" del mapa del curso.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cursoId: string }> },
) {
  const { cursoId } = await params;
  const sesion = await requerirSesion();
  const base = new URL(request.url);

  const vista = await cargarVistaCursoColaborador(sesion.id, cursoId);
  if (!vista) {
    return NextResponse.redirect(new URL("/mis-cursos", base));
  }
  if (!vista.inscripcion) {
    return NextResponse.redirect(new URL(`/mis-cursos/${cursoId}/informacion`, base));
  }

  const destino = resolverNodoContinuar(
    construirGruposRuta(cursoId, vista),
    vista.inscripcion.ultimaLeccionId,
  );

  // Curso terminado o sin contenido disponible: se muestra el mapa.
  return NextResponse.redirect(new URL(destino?.nodo.href ?? `/mis-cursos/${cursoId}`, base));
}
