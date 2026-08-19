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
import { VistaContenidoLeccion } from "@/components/shared/vista-contenido-leccion";
import { LayoutVistaLeccion } from "@/components/shared/layout-vista-leccion";
import { ProximosContenidos } from "@/components/shared/proximos-contenidos";
import { ProgresoCursoLeccion } from "@/components/shared/progreso-curso-leccion";
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

              portadaUrl: meta.portadaUrl ?? null,

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



  const gruposEsquema = modulosRuta.map((modulo) => ({

    id: modulo.id,

    titulo: modulo.titulo,

    lecciones: modulo.lecciones.map((leccionItem) => ({

      id: leccionItem.id,

      titulo: leccionItem.titulo,

      tipoContenido: leccionItem.tipoContenido,

      completada: leccionItem.completada,

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



  return (

    <div className="lesson-view -mx-5 -my-5 min-h-[calc(100vh-4rem)] bg-background sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8 xl:-mx-10 xl:-my-10">

      <LayoutVistaLeccion

        cursoId={cursoId}

        leccionActivaId={leccionId}

        grupos={gruposEsquema}

      >

        <div className="mb-6">

          <Link

            href={`/mis-cursos/${cursoId}`}

            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"

          >

            <ArrowLeft className="h-4 w-4" />

            Volver al curso

          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">

            {leccion.titulo}

          </h1>

        </div>



        <ProgresoCursoLeccion
          porcentaje={progresoCurso.porcentaje}
          completados={progresoCurso.completados}
          total={progresoCurso.total}
        />



        <VistaContenidoLeccion

          recursos={recursosConUrl.map((r) => ({

            id: r.id,

            nombre: r.nombre,

            tipo: r.tipo,

            url: r.url,

          }))}

          contenidoTexto={contenidoTexto}

        />



        <ProximosContenidos

          portadaCursoUrl={curso.imagenPortadaUrl}

          proximos={proximos}

        />



        <div className="mt-8">

          <BotonCompletar

            cursoId={cursoId}

            inscripcionId={inscripcion.id}

            leccionId={leccionId}

            completada={completada}

          />

        </div>

      </LayoutVistaLeccion>

    </div>

  );

}

