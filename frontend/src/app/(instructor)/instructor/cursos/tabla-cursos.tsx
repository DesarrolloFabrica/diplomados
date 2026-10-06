"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, UsersRound } from "lucide-react";
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
import { DialogoAsignarInstructor } from "./dialogo-asignar-instructor";
import { PortadaMiniatura } from "@/components/shared/portada-curso";
import { cn } from "@/lib/utils";
import type {
  CursoFila,
  CursoFilaConAcceso,
  InstructorOpcion,
} from "@backend/server/queries/cursos";
import type { EmpresaOpcion } from "@backend/server/queries/empresas";

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
  cursos: CursoFilaConAcceso[];
  empresas: EmpresaOpcion[];
  temaAdminOscuro?: boolean;
  /** Vista de instructor: textos orientados a "mis cursos asignados". */
  vistaInstructor?: boolean;
  /** Si se pasa, muestra la columna Instructor y permite asignarlo (vista de superadmin). */
  instructores?: InstructorOpcion[];
}

export function TablaCursos({
  cursos,
  empresas,
  temaAdminOscuro = false,
  vistaInstructor = false,
  instructores,
}: TablaCursosProps) {
  const router = useRouter();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [cursoAsignar, setCursoAsignar] = useState<CursoFila | null>(null);
  const columnas = 6 + (instructores ? 1 : 0);
  const nombreInstructor = new Map(instructores?.map((i) => [i.id, i.nombreCompleto]));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="admin-primary-button" onClick={() => setDialogoAbierto(true)}>
          <Plus className="h-4 w-4" />
          Nuevo curso
        </Button>
      </div>

      <div className="admin-table-panel rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Portada</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Estado</TableHead>
              {instructores && <TableHead>Instructor</TableHead>}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cursos.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnas} className="py-10 text-center text-muted-foreground">
                  {vistaInstructor
                    ? "Todavía no tienes cursos. Crea uno o pide al superadmin que te asigne un curso."
                    : "Todavía no hay cursos. Crea el primero."}
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
                  <Badge
                    className={curso.estado === "publicado" ? "admin-badge-success" : "admin-badge"}
                    variant={VARIANTE_ESTADO[curso.estado]}
                  >
                    {ETIQUETA_ESTADO[curso.estado]}
                  </Badge>
                </TableCell>
                {instructores && (
                  <TableCell className="text-muted-foreground">
                    {(curso.autorId && nombreInstructor.get(curso.autorId)) ?? "Sin asignar"}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {instructores && (
                      <Button
                        className="admin-ghost-button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCursoAsignar(curso)}
                      >
                        <UsersRound className="h-4 w-4" />
                        Asignar instructor
                      </Button>
                    )}
                    <Button className="admin-ghost-button" variant="ghost" size="sm" asChild>
                      <Link href={`/instructor/cursos/${curso.id}`}>
                        {curso.acceso === "contenido" ? "Editar contenido" : "Administrar"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent
          className={cn(
            "max-h-[90vh] overflow-y-auto",
            temaAdminOscuro && "admin-dialog",
          )}
        >
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

      {instructores && (
        <DialogoAsignarInstructor
          curso={cursoAsignar}
          instructores={instructores}
          onCerrar={() => setCursoAsignar(null)}
        />
      )}
    </div>
  );
}
