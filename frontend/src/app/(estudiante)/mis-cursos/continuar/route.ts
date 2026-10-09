import type { NextRequest } from "next/server";
import { requerirSesion } from "@backend/lib/auth/sesion";
import {
  cargarVistaCursoColaborador,
  obtenerCursoRecienteParaContinuar,
} from "@backend/server/queries/mis-cursos";
import {
  COOKIE_CONTINUAR_EVALUACION,
  leerEvaluacionAbierta,
} from "@/lib/continuar-evaluacion";
import { redireccionRelativa } from "@/lib/redireccion-relativa";
import { construirGruposRuta } from "@/lib/roadmap/grupos-curso";
import { resolverNodoContinuar } from "@/lib/roadmap/siguiente-nodo";

/**
 * Entrada global desde el botón "Continuar aprendiendo" del menú inferior.
 * Toma el curso con actividad más reciente (abrir una lección o un quiz la
 * registra) y dentro de él:
 * 1. el último quiz abierto, si sigue pendiente (aún no aprobado);
 * 2. si no, la última lección abierta si no está completada;
 * 3. si ya está completada, lo siguiente pendiente: lección o quiz.
 * El "Continuar" del hero de cada curso usa /mis-cursos/[cursoId]/continuar.
 */
export async function GET(request: NextRequest) {
  const sesion = await requerirSesion();
  const ir = redireccionRelativa;

  const cursoId = await obtenerCursoRecienteParaContinuar(sesion.id);
  if (!cursoId) return ir("/mis-cursos");

  const vista = await cargarVistaCursoColaborador(sesion.id, cursoId);
  if (!vista?.inscripcion) return ir(`/mis-cursos/${cursoId}`);

  const grupos = construirGruposRuta(cursoId, vista);

  const quiz = leerEvaluacionAbierta(request.cookies.get(COOKIE_CONTINUAR_EVALUACION)?.value);
  if (quiz?.cursoId === cursoId) {
    const nodoQuiz = grupos
      .flatMap((grupo) => grupo.nodos)
      .find((nodo) => nodo.tipo === "evaluacion" && nodo.id === quiz.evaluacionId);
    if (nodoQuiz && !nodoQuiz.completado && !nodoQuiz.bloqueado) {
      return ir(nodoQuiz.href);
    }
  }

  const destino = resolverNodoContinuar(grupos, vista.inscripcion.ultimaLeccionId);
  return ir(destino?.nodo.href ?? `/mis-cursos/${cursoId}`);
}
