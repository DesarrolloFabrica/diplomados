import { UserRound } from "lucide-react";
import { requerirSesion } from "@/lib/auth/sesion";
import { ETIQUETA_ROL } from "@/config/roles";
import {
  listarCursosParaColaborador,
  obtenerPerfilColaborador,
} from "@/server/queries/mis-cursos";
import { cn } from "@/lib/utils";

function valorPerfil(valor: string | null | undefined): string {
  if (!valor?.trim()) return "Información no registrada";
  return valor.trim();
}

function formatearFecha(fecha: Date | null | undefined): string {
  if (!fecha) return "Información no registrada";
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha);
}

function iniciales(nombre: string | null | undefined): string {
  if (!nombre?.trim()) return "?";
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  return partes.map((parte) => parte[0]?.toUpperCase() ?? "").join("") || "?";
}

function CampoPerfil({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const vacio = valor === "Información no registrada";
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {etiqueta}
      </dt>
      <dd className={cn("text-sm", vacio ? "text-muted-foreground italic" : "text-foreground")}>
        {valor}
      </dd>
    </div>
  );
}

function TarjetaEstadistica({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {etiqueta}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{valor}</p>
    </div>
  );
}

export default async function PerfilColaboradorPage() {
  const sesion = await requerirSesion();
  const [perfil, cursos] = await Promise.all([
    obtenerPerfilColaborador(sesion.id),
    listarCursosParaColaborador(sesion.id),
  ]);

  const cursosInscritos = cursos.filter((curso) => curso.inscripcionId);
  const cursosCompletados = cursosInscritos.filter(
    (curso) => curso.estadoInscripcion === "finalizado" || curso.estadoInscripcion === "aprobado",
  );
  const progresoGeneral =
    cursosInscritos.length === 0
      ? 0
      : Math.round(
          cursosInscritos.reduce(
            (acumulado, curso) => acumulado + Number(curso.porcentajeAvance ?? 0),
            0,
          ) / cursosInscritos.length,
        );

  const nombre = perfil?.nombreCompleto ?? sesion.nombreCompleto;
  const cargo = perfil?.cargo ?? null;
  const area = perfil?.area ?? null;
  const cargoORol = cargo?.trim() || area?.trim() || ETIQUETA_ROL[sesion.rol];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Mi perfil</h1>
        <p className="mt-1 text-muted-foreground">Tu información personal y progreso de aprendizaje.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/70 bg-muted/30 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {nombre?.trim() ? (
                <span className="text-lg font-bold">{iniciales(nombre)}</span>
              ) : (
                <UserRound className="h-8 w-8" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-foreground">
                {valorPerfil(nombre)}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                {valorPerfil(perfil?.email ?? sesion.email)}
              </p>
            </div>
          </div>
        </div>

        <dl className="grid gap-5 p-6 sm:grid-cols-2">
          <CampoPerfil etiqueta="Empresa" valor={valorPerfil(perfil?.empresaNombre)} />
          <CampoPerfil etiqueta="Cargo o rol" valor={valorPerfil(cargoORol)} />
          <CampoPerfil etiqueta="Documento" valor="Información no registrada" />
          <CampoPerfil
            etiqueta="Estado de la cuenta"
            valor={perfil?.activo === false ? "Inactiva" : "Activa"}
          />
          <CampoPerfil
            etiqueta="Fecha de vinculación"
            valor={formatearFecha(perfil?.createdAt)}
          />
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Estadísticas de aprendizaje</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <TarjetaEstadistica
            etiqueta="Cursos inscritos"
            valor={String(cursosInscritos.length)}
          />
          <TarjetaEstadistica
            etiqueta="Cursos completados"
            valor={String(cursosCompletados.length)}
          />
          <TarjetaEstadistica etiqueta="Progreso general" valor={`${progresoGeneral}%`} />
        </div>
      </section>
    </div>
  );
}
