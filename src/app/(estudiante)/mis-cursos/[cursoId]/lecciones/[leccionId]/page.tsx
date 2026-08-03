import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requerirSesion } from "@/lib/auth/sesion";
import { listarModulos } from "@/server/queries/cursos";
import { obtenerLeccion, listarRecursos } from "@/server/queries/modulos";
import {
  obtenerInscripcion,
  estaLeccionCompletada,
  listarLeccionesConProgreso,
  listarEvaluacionesConEstado,
} from "@/server/queries/mis-cursos";
import { generarUrlLectura } from "@/lib/storage";
import { VistaContenidoLeccion } from "@/components/shared/vista-contenido-leccion";
import { LayoutVistaLeccion } from "@/components/shared/layout-vista-leccion";
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

  const [recursos, completada, modulos, evaluaciones] = await Promise.all([
    listarRecursos(sesion.id, leccionId),
    estaLeccionCompletada(sesion.id, inscripcion.id, leccionId),
    listarModulos(sesion.id, cursoId),
    listarEvaluacionesConEstado(sesion.id, cursoId),
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

  const EVALUACIONES_POR_MODULO = 3;

  const gruposEsquema = await Promise.all(
    modulos.map(async (modulo, indiceModulo) => {
      const inicio = indiceModulo * EVALUACIONES_POR_MODULO;
      const esUltimo = indiceModulo === modulos.length - 1;
      const evaluacionesModulo = evaluaciones.slice(
        inicio,
        esUltimo ? undefined : inicio + EVALUACIONES_POR_MODULO,
      );

      return {
        id: modulo.id,
        titulo: modulo.titulo,
        lecciones: await listarLeccionesConProgreso(sesion.id, modulo.id, inscripcion.id),
        evaluaciones: evaluacionesModulo.map((evaluacion) => ({
          id: evaluacion.id,
          titulo: evaluacion.titulo,
          completada: evaluacion.aprobado,
        })),
      };
    }),
  );

  const contenidoTexto = (leccion.contenido as { texto?: string } | null)?.texto;

  return (
    <div className="lesson-view -mx-6 -my-6 min-h-[calc(100vh-4rem)] bg-background lg:-mx-10 lg:-my-10">
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

        <VistaContenidoLeccion
          recursos={recursosConUrl.map((r) => ({
            id: r.id,
            nombre: r.nombre,
            tipo: r.tipo,
            url: r.url,
          }))}
          contenidoTexto={contenidoTexto}
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
