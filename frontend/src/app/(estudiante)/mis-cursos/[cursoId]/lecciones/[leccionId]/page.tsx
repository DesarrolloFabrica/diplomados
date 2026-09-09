import Link from "next/link";

import { notFound } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { requerirSesion } from "@backend/lib/auth/sesion";

import { obtenerCurso, listarModulos } from "@backend/server/queries/cursos";

import { obtenerLeccion, listarLecciones, listarRecursos } from "@backend/server/queries/modulos";

import {

  obtenerInscripcion,

  estaLeccionCompletada,

  listarLeccionesConProgreso,

  listarEvaluacionesConEstado,

} from "@backend/server/queries/mis-cursos";

import { generarUrlLectura } from "@backend/lib/storage";

import { categoriasDeRecursos } from "@/lib/contenido-leccion";

import {
  asignarEvaluacionesPorModulo,
  calcularProgresoCurso,
  construirItemsRuta,
  extraerMetaContenido,
  obtenerProximosContenidos,
} from "@/lib/ruta-curso";
import { LayoutVistaLeccion } from "@/components/shared/layout-vista-leccion";
import { ContenidoLeccionConCompletado } from "@/components/shared/contenido-leccion-con-completado";
import { obtenerInfografiaInteractivaLeccion } from "@/lib/embeds-prueba-leccion";
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



  const [recursos, completada, modulos, evaluaciones, curso] = await Promise.all([

    listarRecursos(sesion.id, leccionId),

    estaLeccionCompletada(sesion.id, inscripcion.id, leccionId),

    listarModulos(sesion.id, cursoId),

    listarEvaluacionesConEstado(sesion.id, cursoId),

    obtenerCurso(sesion.id, cursoId),

  ]);



  if (!curso) notFound();



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



  const evaluacionesPorModulo = asignarEvaluacionesPorModulo(evaluaciones, modulos.length);



  const modulosRuta = await Promise.all(

    modulos.map(async (modulo, indiceModulo) => {

      const [leccionesProgreso, leccionesDetalle] = await Promise.all([

        listarLeccionesConProgreso(sesion.id, modulo.id, inscripcion.id),

        listarLecciones(sesion.id, modulo.id),

      ]);

      const detallePorId = new Map(leccionesDetalle.map((item) => [item.id, item]));



      return {

        id: modulo.id,

        titulo: modulo.titulo,

        lecciones: await Promise.all(

          leccionesProgreso.map(async (leccionItem) => {

            const detalle = detallePorId.get(leccionItem.id);

            const meta = extraerMetaContenido(detalle?.contenido);

            const recursosLeccion = await listarRecursos(sesion.id, leccionItem.id);

            return {

              id: leccionItem.id,

              titulo: leccionItem.titulo,

              tipoContenido: leccionItem.tipoContenido,

              completada: leccionItem.completada,

              categoriasContenido: categoriasDeRecursos(recursosLeccion.map((r) => r.tipo)),

              portadaUrl: meta.portadaUrl ?? meta.imagenPortadaUrl ?? null,

              duracionMin: meta.duracionMin ?? null,

              duracionSeg: meta.duracionSeg ?? null,

            };

          }),

        ),

        evaluaciones: (evaluacionesPorModulo[indiceModulo] ?? []).map((evaluacion) => ({

          id: evaluacion.id,

          titulo: evaluacion.titulo,

          aprobado: evaluacion.aprobado,

          intentosUsados: evaluacion.intentosUsados,

        })),

      };

    }),

  );



  const itemsRuta = construirItemsRuta(

    cursoId,

    modulosRuta,

    curso.navegacion === "obligatoria",

  );

  const bloqueadoPorId = new Map(itemsRuta.map((item) => [item.id, item.bloqueado]));

  const proximos = obtenerProximosContenidos(itemsRuta, leccionId, "leccion", 4);
  const progresoCurso = calcularProgresoCurso(itemsRuta);
  const indiceModuloActual = modulosRuta.findIndex((modulo) =>
    modulo.lecciones.some((item) => item.id === leccionId),
  );
  const moduloActual =
    indiceModuloActual >= 0 ? modulosRuta[indiceModuloActual] : undefined;
  const contextoLeccion = moduloActual
    ? `Modulo ${indiceModuloActual + 1} / ${moduloActual.titulo}`
    : curso.titulo;



  const gruposEsquema = modulosRuta.map((modulo) => ({

    id: modulo.id,

    titulo: modulo.titulo,

    lecciones: modulo.lecciones.map((leccionItem) => ({

      id: leccionItem.id,

      titulo: leccionItem.titulo,

      tipoContenido: leccionItem.tipoContenido,

      completada: leccionItem.completada,

      bloqueado: bloqueadoPorId.get(leccionItem.id) ?? false,

      categoriasContenido: leccionItem.categoriasContenido,

    })),

    evaluaciones: modulo.evaluaciones.map((evaluacion) => ({

      id: evaluacion.id,

      titulo: evaluacion.titulo,

      completada: evaluacion.aprobado,

      intentosUsados: evaluacion.intentosUsados,

      bloqueado: bloqueadoPorId.get(evaluacion.id) ?? false,

    })),

  }));



  const contenidoTexto = (leccion.contenido as { texto?: string } | null)?.texto;
  const primeraLeccionId = modulosRuta[0]?.lecciones[0]?.id;
  const infografiaInteractiva = obtenerInfografiaInteractivaLeccion(
    curso.titulo,
    leccionId,
    primeraLeccionId,
  );

  return (

    <div className="lesson-view relative isolate -mx-5 -mt-5 -mb-14 min-h-dvh pb-14 sm:-mx-6 sm:-mt-6 sm:-mb-14 lg:-mx-8 lg:-mt-8 lg:-mb-14 xl:-mx-10 xl:-mt-10 xl:-mb-14">

      <LayoutVistaLeccion

        cursoId={cursoId}

        leccionActivaId={leccionId}

        grupos={gruposEsquema}

        progresoCurso={progresoCurso}

      >

        <Link
          href={`/mis-cursos/${cursoId}`}
          className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-[#061120]/28 px-3 py-2 text-xs font-semibold text-white/80 backdrop-blur-lg transition-colors hover:bg-white/18 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al curso
        </Link>



        <ContenidoLeccionConCompletado
          courseId={cursoId}
          enrollmentId={inscripcion.id}
          lessonId={leccionId}
          lessonTitle={leccion.titulo}
          lessonContext={contextoLeccion}
          completionMode={leccion.marcado}
          completed={completada}
          recursos={recursosConUrl.map((recurso) => ({
            id: recurso.id,
            nombre: recurso.nombre,
            tipo: recurso.tipo,
            url: recurso.url,
          }))}
          contenidoTexto={contenidoTexto}
          infografiaInteractiva={infografiaInteractiva}
          portadaCursoUrl={curso.imagenPortadaUrl}
          proximos={proximos}
          manualCompletionControl={
            leccion.marcado === "manual" ? (
              <BotonCompletar
                cursoId={cursoId}
                inscripcionId={inscripcion.id}
                leccionId={leccionId}
                completada={completada}
              />
            ) : null
          }
        />

      </LayoutVistaLeccion>

    </div>

  );

}

