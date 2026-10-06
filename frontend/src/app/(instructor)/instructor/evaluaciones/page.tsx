import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requerirRol } from "@backend/lib/auth/sesion";
import { listarCursos } from "@backend/server/queries/cursos";
import { listarEvaluacionesDeCursos } from "@backend/server/queries/evaluaciones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function InstructorEvaluacionesPage() {
  const sesion = await requerirRol("superadmin", "instructor");
  const soloPropios = sesion.rol === "instructor";

  const cursos = await listarCursos(sesion.id, soloPropios);
  const evaluaciones = await listarEvaluacionesDeCursos(
    sesion.id,
    cursos.map((curso) => curso.id),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Evaluaciones</h1>
        <p className="mt-1 text-muted-foreground">
          Evaluaciones de tus cursos. Para crear una nueva, entra al curso desde Mis cursos.
        </p>
      </div>

      <div className="admin-table-panel rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evaluación</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Preguntas</TableHead>
              <TableHead>Intentos</TableHead>
              <TableHead>Puntaje mínimo</TableHead>
              <TableHead>Tiempo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluaciones.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {cursos.length === 0
                    ? "Aún no tienes cursos, así que no hay evaluaciones."
                    : "Tus cursos todavía no tienen evaluaciones."}
                </TableCell>
              </TableRow>
            )}
            {evaluaciones.map((evaluacion) => (
              <TableRow key={evaluacion.id}>
                <TableCell className="font-medium">{evaluacion.titulo}</TableCell>
                <TableCell className="text-muted-foreground">{evaluacion.cursoTitulo}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={evaluacion.numPreguntas > 0 ? "admin-badge-success" : "admin-badge"}
                  >
                    {evaluacion.numPreguntas}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{evaluacion.maxIntentos}</TableCell>
                <TableCell className="text-muted-foreground">
                  {Number(evaluacion.puntajeMinimo)}%
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {evaluacion.tiempoLimiteMin ? `${evaluacion.tiempoLimiteMin} min` : "Sin límite"}
                </TableCell>
                <TableCell className="text-right">
                  <Button className="admin-ghost-button" variant="ghost" size="sm" asChild>
                    <Link
                      href={`/instructor/cursos/${evaluacion.cursoId}/evaluaciones/${evaluacion.id}`}
                    >
                      Preguntas
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
