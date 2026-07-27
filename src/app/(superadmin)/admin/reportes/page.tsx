import { Building2, Users, BookOpen, ClipboardList } from "lucide-react";
import { requerirRol } from "@/lib/auth/sesion";
import { obtenerResumenGlobal, listarResumenPorEmpresa } from "@/server/queries/reportes";
import { StatTile } from "@/components/shared/reportes/stat-tile";
import { GraficoBarras } from "@/components/shared/reportes/grafico-barras";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default async function AdminReportesPage() {
  const sesion = await requerirRol("superadmin");

  const [resumen, porEmpresa] = await Promise.all([
    obtenerResumenGlobal(sesion.id),
    listarResumenPorEmpresa(sesion.id),
  ]);

  const datosGrafico = porEmpresa.map((fila) => ({
    etiqueta: fila.nombre,
    valor: fila.avancePromedio,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Reportes</h1>
        <p className="mt-1 text-muted-foreground">Resumen global de la plataforma.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile titulo="Empresas activas" valor={resumen.totalEmpresas} icono={Building2} />
        <StatTile titulo="Usuarios activos" valor={resumen.totalUsuarios} icono={Users} />
        <StatTile
          titulo="Cursos publicados"
          valor={resumen.totalCursosPublicados}
          icono={BookOpen}
        />
        <StatTile
          titulo="Inscripciones"
          valor={resumen.totalInscripciones}
          icono={ClipboardList}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 font-display text-base font-semibold">Avance promedio por empresa</h2>
        <GraficoBarras datos={datosGrafico} etiquetaValor="Avance" sufijo="%" />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Colaboradores</TableHead>
              <TableHead>Inscripciones</TableHead>
              <TableHead className="text-right">Avance promedio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {porEmpresa.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Todavía no hay empresas registradas.
                </TableCell>
              </TableRow>
            )}
            {porEmpresa.map((fila) => (
              <TableRow key={fila.nombre}>
                <TableCell className="font-medium">{fila.nombre}</TableCell>
                <TableCell className="text-muted-foreground">{fila.colaboradores}</TableCell>
                <TableCell className="text-muted-foreground">{fila.inscripciones}</TableCell>
                <TableCell className="text-right">{fila.avancePromedio}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
