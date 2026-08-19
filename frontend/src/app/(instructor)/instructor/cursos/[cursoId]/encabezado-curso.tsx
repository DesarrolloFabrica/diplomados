"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormularioCurso } from "../formulario-curso";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { cambiarEstadoCurso } from "@backend/server/actions/cursos";
import type { CursoDetalle } from "@backend/server/queries/cursos";
import type { EmpresaOpcion } from "@backend/server/queries/empresas";

const ETIQUETA_ESTADO: Record<CursoDetalle["estado"], string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  archivado: "Archivado",
};

interface EncabezadoCursoProps {
  curso: CursoDetalle;
  empresas: EmpresaOpcion[];
}

export function EncabezadoCurso({ curso, empresas }: EncabezadoCursoProps) {
  const router = useRouter();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [, iniciar] = useTransition();

  function cambiarEstado(estado: CursoDetalle["estado"]) {
    iniciar(async () => {
      const res = await cambiarEstadoCurso(curso.id, estado);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo actualizar el estado");
        return;
      }
      toast.success(`Curso: ${ETIQUETA_ESTADO[estado].toLowerCase()}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-4">
          <div className="h-20 w-32 shrink-0">
            <PortadaCurso
              url={curso.imagenPortadaUrl}
              esDiplomado={curso.esDiplomado}
              titulo={curso.titulo}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {curso.titulo}
              </h1>
              <Badge variant={curso.estado === "publicado" ? "default" : "secondary"}>
                {ETIQUETA_ESTADO[curso.estado]}
              </Badge>
              {curso.esDiplomado && <Badge variant="outline">Diplomado</Badge>}
            </div>
            {curso.descripcion && (
              <p className="mt-1 max-w-2xl text-muted-foreground">{curso.descripcion}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDialogoAbierto(true)}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          {curso.estado !== "publicado" && (
            <Button size="sm" onClick={() => cambiarEstado("publicado")}>
              Publicar
            </Button>
          )}
          {curso.estado === "publicado" && (
            <Button variant="secondary" size="sm" onClick={() => cambiarEstado("borrador")}>
              Volver a borrador
            </Button>
          )}
          {curso.estado !== "archivado" && (
            <Button variant="ghost" size="sm" onClick={() => cambiarEstado("archivado")}>
              Archivar
            </Button>
          )}
        </div>
      </div>

      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar curso</DialogTitle>
          </DialogHeader>
          <FormularioCurso
            curso={curso}
            empresas={empresas}
            onExito={() => setDialogoAbierto(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
