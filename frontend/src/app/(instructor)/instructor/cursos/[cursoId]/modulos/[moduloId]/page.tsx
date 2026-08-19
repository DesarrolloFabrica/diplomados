import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requerirRol } from "@backend/lib/auth/sesion";
import { obtenerModulo, listarLecciones } from "@backend/server/queries/modulos";
import { TablaLecciones } from "./tabla-lecciones";

interface ModuloDetallePageProps {
  params: Promise<{ cursoId: string; moduloId: string }>;
}

export default async function ModuloDetallePage({ params }: ModuloDetallePageProps) {
  const { cursoId, moduloId } = await params;
  const sesion = await requerirRol("superadmin", "instructor");

  const modulo = await obtenerModulo(sesion.id, moduloId);
  if (!modulo) notFound();

  const lecciones = await listarLecciones(sesion.id, moduloId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/instructor/cursos/${cursoId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al curso
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          {modulo.titulo}
        </h1>
        {modulo.descripcion && (
          <p className="mt-1 max-w-2xl text-muted-foreground">{modulo.descripcion}</p>
        )}
      </div>

      <TablaLecciones cursoId={cursoId} moduloId={moduloId} lecciones={lecciones} />
    </div>
  );
}
