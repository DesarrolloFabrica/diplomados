"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FormularioCurso } from "./formulario-curso";
import { PortadaMiniatura } from "@/components/shared/portada-curso";
import type { CursoFila } from "@/server/queries/cursos";
import type { EmpresaOpcion } from "@/server/queries/empresas";

const ETIQUETA_ESTADO: Record<CursoFila["estado"], string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  archivado: "Archivado",
};

const VARIANTE_ESTADO: Record<CursoFila["estado"], "secondary" | "default" | "outline"> = {
  borrador: "secondary",
  publicado: "default",
  archivado: "outline",
};

interface TablaCursosProps {
  cursos: CursoFila[];
  empresas: EmpresaOpcion[];
}

export function TablaCursos({ cursos, empresas }: TablaCursosProps) {
  const router = useRouter();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogoAbierto(true)}>
          <Plus className="h-4 w-4" />
          Nuevo curso
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Portada</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cursos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Todavía no hay cursos. Crea el primero.
                </TableCell>
              </TableRow>
            )}
            {cursos.map((curso) => (
              <TableRow key={curso.id}>
                <TableCell>
                  <PortadaMiniatura
                    url={curso.imagenPortadaUrl}
                    esDiplomado={curso.esDiplomado}
                    titulo={curso.titulo}
                  />
                </TableCell>
                <TableCell className="font-medium">{curso.titulo}</TableCell>
                <TableCell className="text-muted-foreground">
                  {curso.esDiplomado ? "Diplomado" : "Curso"}
                </TableCell>
                <TableCell className="text-muted-foreground capitalize">
                  {curso.nivelDificultad}
                </TableCell>
                <TableCell>
                  <Badge variant={VARIANTE_ESTADO[curso.estado]}>
                    {ETIQUETA_ESTADO[curso.estado]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/instructor/cursos/${curso.id}`}>
                      Administrar
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo curso</DialogTitle>
            <DialogDescription>
              Completa los datos básicos; luego agregas módulos, lecciones y evaluaciones.
            </DialogDescription>
          </DialogHeader>
          <FormularioCurso
            empresas={empresas}
            onExito={(cursoId) => {
              setDialogoAbierto(false);
              router.push(`/instructor/cursos/${cursoId}`);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
