import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requerirRol } from "@/lib/auth/sesion";
import { obtenerLeccion, listarRecursos } from "@/server/queries/modulos";
import { RecursosLeccion } from "./recursos-leccion";

interface LeccionDetallePageProps {
  params: Promise<{ cursoId: string; moduloId: string; leccionId: string }>;
}

export default async function LeccionDetallePage({ params }: LeccionDetallePageProps) {
  const { cursoId, moduloId, leccionId } = await params;
  const sesion = await requerirRol("superadmin", "instructor");

  const leccion = await obtenerLeccion(sesion.id, leccionId);
  if (!leccion) notFound();

  const recursos = await listarRecursos(sesion.id, leccionId);
  const contenidoTexto = (leccion.contenido as { texto?: string } | null)?.texto;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/instructor/cursos/${cursoId}/modulos/${moduloId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al módulo
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          {leccion.titulo}
        </h1>
        {contenidoTexto && (
          <p className="mt-2 max-w-2xl whitespace-pre-wrap text-muted-foreground">
            {contenidoTexto}
          </p>
        )}
      </div>

      <RecursosLeccion
        cursoId={cursoId}
        moduloId={moduloId}
        leccionId={leccionId}
        recursos={recursos}
      />
    </div>
  );
}
