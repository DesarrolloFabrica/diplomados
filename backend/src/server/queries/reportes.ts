import { sql } from "drizzle-orm";
import { conSesion } from "@/lib/db";

export interface ResumenEmpresa {
  totalColaboradores: number;
  totalInscripciones: number;
  avancePromedio: number;
  evaluacionesAprobadas: number;
  evaluacionesPresentadas: number;
}

export async function obtenerResumenEmpresa(
  usuarioId: string,
  empresaId: string,
): Promise<ResumenEmpresa> {
  return conSesion(usuarioId, async (tx) => {
    const colaboradoresResultado = await tx.execute(sql`
      select count(*)::int as total from profiles
      where empresa_id = ${empresaId} and deleted_at is null and rol = 'colaborador'
    `);
    const inscripcionesResultado = await tx.execute(sql`
      select count(*)::int as total from inscripciones
      where empresa_id = ${empresaId} and deleted_at is null
    `);
    const avanceResultado = await tx.execute(sql`
      select coalesce(avg(porcentaje_avance), 0)::float as promedio
      from inscripciones where empresa_id = ${empresaId} and deleted_at is null
    `);
    const evalResultado = await tx.execute(sql`
      select
        count(*) filter (where aprobado = true)::int as aprobadas,
        count(*)::int as presentadas
      from intentos_evaluacion
      where empresa_id = ${empresaId} and estado = 'finalizado'
    `);

    const totalColaboradores = Number(
      (colaboradoresResultado.rows[0] as { total?: number } | undefined)?.total ?? 0,
    );
    const totalInscripciones = Number(
      (inscripcionesResultado.rows[0] as { total?: number } | undefined)?.total ?? 0,
    );
    const avancePromedio = Number(
      (avanceResultado.rows[0] as { promedio?: number } | undefined)?.promedio ?? 0,
    );
    const filaEval = evalResultado.rows[0] as
      | { aprobadas?: number; presentadas?: number }
      | undefined;

    return {
      totalColaboradores,
      totalInscripciones,
      avancePromedio: Math.round(avancePromedio * 10) / 10,
      evaluacionesAprobadas: Number(filaEval?.aprobadas ?? 0),
      evaluacionesPresentadas: Number(filaEval?.presentadas ?? 0),
    };
  });
}

export interface ProgresoColaborador {
  nombreCompleto: string;
  curso: string;
  estado: string;
  porcentajeAvance: number;
}

export async function listarProgresoEmpresa(
  usuarioId: string,
  empresaId: string,
): Promise<ProgresoColaborador[]> {
  return conSesion(usuarioId, async (tx) => {
    const resultado = await tx.execute(sql`
      select p.nombre_completo, c.titulo as curso, i.estado, i.porcentaje_avance
      from inscripciones i
      join profiles p on p.id = i.profile_id
      join cursos c on c.id = i.curso_id
      where i.empresa_id = ${empresaId} and i.deleted_at is null
      order by p.nombre_completo, c.titulo
    `);
    return (
      resultado.rows as {
        nombre_completo: string;
        curso: string;
        estado: string;
        porcentaje_avance: string;
      }[]
    ).map((fila) => ({
      nombreCompleto: fila.nombre_completo,
      curso: fila.curso,
      estado: fila.estado,
      porcentajeAvance: Number(fila.porcentaje_avance),
    }));
  });
}

export interface ResumenGlobal {
  totalEmpresas: number;
  totalUsuarios: number;
  totalCursosPublicados: number;
  totalInscripciones: number;
}

export async function obtenerResumenGlobal(usuarioId: string): Promise<ResumenGlobal> {
  return conSesion(usuarioId, async (tx) => {
    const empresasResultado = await tx.execute(sql`
      select count(*)::int as total from empresas where estado = 'activa' and deleted_at is null
    `);
    const usuariosResultado = await tx.execute(sql`
      select count(*)::int as total from profiles where activo = true and deleted_at is null
    `);
    const cursosResultado = await tx.execute(sql`
      select count(*)::int as total from cursos where estado = 'publicado' and deleted_at is null
    `);
    const inscripcionesResultado = await tx.execute(sql`
      select count(*)::int as total from inscripciones where deleted_at is null
    `);

    return {
      totalEmpresas: Number((empresasResultado.rows[0] as { total?: number } | undefined)?.total ?? 0),
      totalUsuarios: Number((usuariosResultado.rows[0] as { total?: number } | undefined)?.total ?? 0),
      totalCursosPublicados: Number(
        (cursosResultado.rows[0] as { total?: number } | undefined)?.total ?? 0,
      ),
      totalInscripciones: Number(
        (inscripcionesResultado.rows[0] as { total?: number } | undefined)?.total ?? 0,
      ),
    };
  });
}

export interface ResumenPorEmpresa {
  nombre: string;
  colaboradores: number;
  inscripciones: number;
  avancePromedio: number;
}

export async function listarResumenPorEmpresa(usuarioId: string): Promise<ResumenPorEmpresa[]> {
  return conSesion(usuarioId, async (tx) => {
    const resultado = await tx.execute(sql`
      select
        e.nombre,
        count(distinct p.id)::int as colaboradores,
        count(distinct i.id)::int as inscripciones,
        coalesce(avg(i.porcentaje_avance), 0)::float as avance_promedio
      from empresas e
      left join profiles p on p.empresa_id = e.id and p.deleted_at is null and p.rol = 'colaborador'
      left join inscripciones i on i.empresa_id = e.id and i.deleted_at is null
      where e.deleted_at is null
      group by e.id, e.nombre
      order by e.nombre
    `);
    return (
      resultado.rows as {
        nombre: string;
        colaboradores: number;
        inscripciones: number;
        avance_promedio: number;
      }[]
    ).map((fila) => ({
      nombre: fila.nombre,
      colaboradores: fila.colaboradores,
      inscripciones: fila.inscripciones,
      avancePromedio: Math.round(fila.avance_promedio * 10) / 10,
    }));
  });
}
