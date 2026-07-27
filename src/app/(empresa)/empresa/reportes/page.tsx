import { Users, ClipboardList, TrendingUp, CheckCircle2 } from "lucide-react";
import { requerirSesion } from "@/lib/auth/sesion";
import { obtenerResumenEmpresa, listarProgresoEmpresa } from "@/server/queries/reportes";
import { StatTile } from "@/components/shared/reportes/stat-tile";
import { GraficoBarras } from "@/components/shared/reportes/grafico-barras";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const ETIQUETA_ESTADO: Record<string, string> = {
  no_iniciado: "No iniciado",
  en_progreso: "En progreso",
  pendiente_evaluacion: "Pendiente de evaluación",
  aprobado: "Aprobado",
  no_aprobado: "No aprobado",
  finalizado: "Finalizado",
};

export default async function EmpresaReportesPage() {
  const sesion = await requerirSesion();

  if (sesion.rol !== "admin_empresa" || !sesion.empresaId) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">
          Esta vista es por empresa. Como superadmin, revisa{" "}
          <a href="/admin/reportes" className="text-primary underline">
            Reportes
          </a>{" "}
          para el resumen global.
        </p>
      </div>
    );
  }

  const [resumen, progreso] = await Promise.all([
    obtenerResumenEmpresa(sesion.id, sesion.empresaId),
    listarProgresoEmpresa(sesion.id, sesion.empresaId),
  ]);

  // Promedio de avance por colaborador (puede tener varios cursos).
  const promedioPorColaborador = new Map<string, { suma: number; cantidad: number }>();
  for (const fila of progreso) {
    const actual = promedioPorColaborador.get(fila.nombreCompleto) ?? { suma: 0, cantidad: 0 };
    actual.suma += fila.porcentajeAvance;
    actual.cantidad += 1;
    promedioPorColaborador.set(fila.nombreCompleto, actual);
  }
  const datosGrafico = Array.from(promedioPorColaborador.entries()).map(([nombre, v]) => ({
    etiqueta: nombre.split(" ")[0] ?? nombre,
    valor: Math.round(v.suma / v.cantidad),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Reportes</h1>
        <p className="mt-1 text-muted-foreground">
          Avance de aprendizaje de los colaboradores de tu empresa.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile titulo="Colaboradores" valor={resumen.totalColaboradores} icono={Users} />
        <StatTile
          titulo="Inscripciones"
          valor={resumen.totalInscripciones}
          icono={ClipboardList}
        />
        <StatTile
          titulo="Avance promedio"
          valor={`${resumen.avancePromedio}%`}
          icono={TrendingUp}
        />
        <StatTile
          titulo="Evaluaciones aprobadas"
          valor={`${resumen.evaluacionesAprobadas}/${resumen.evaluacionesPresentadas}`}
          icono={CheckCircle2}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 font-display text-base font-semibold">Avance promedio por colaborador</h2>
        <GraficoBarras datos={datosGrafico} etiquetaValor="Avance" sufijo="%" />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Avance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {progreso.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Todavía no hay inscripciones registradas.
                </TableCell>
              </TableRow>
            )}
            {progreso.map((fila, indice) => (
              <TableRow key={indice}>
                <TableCell className="font-medium">{fila.nombreCompleto}</TableCell>
                <TableCell className="text-muted-foreground">{fila.curso}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ETIQUETA_ESTADO[fila.estado] ?? fila.estado}</Badge>
                </TableCell>
                <TableCell className="text-right">{Math.round(fila.porcentajeAvance)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
