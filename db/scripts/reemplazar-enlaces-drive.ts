/**
 * Reemplaza URLs de Google Drive en recursos del diplomado Gerencia Social.
 * Solo PostgreSQL local (Docker). Uso:
 *   npx tsx db/scripts/reemplazar-enlaces-drive.ts           # diagnóstico
 *   npx tsx db/scripts/reemplazar-enlaces-drive.ts --apply   # aplicar cambios
 */
import path from "node:path";
import { config } from "dotenv";
import { Client } from "pg";
import {
  CATEGORIAS,
  ENLACES_GERENCIA_SOCIAL,
  type CategoriaRecurso,
} from "./enlaces-gerencia-social-data";

config({ path: path.join(process.cwd(), ".env.local"), quiet: true });
config({ path: path.join(process.cwd(), ".env"), quiet: true });

type EstadoDiagnostico =
  | "MATCH"
  | "NO_ENCONTRADO"
  | "DUPLICADO"
  | "TIPO_NO_IDENTIFICADO";

interface FilaDiagnostico {
  curso: string;
  cursoId: string;
  modulo: string;
  moduloDb: string;
  leccion: string;
  leccionDb: string;
  tipoRecurso: CategoriaRecurso;
  resourceId: string | null;
  urlActual: string | null;
  urlNueva: string;
  estado: EstadoDiagnostico;
}

interface RecursoDb {
  id: string;
  tipo: string;
  nombre: string;
  urlExterna: string | null;
  leccionId: string;
  leccionTitulo: string;
  moduloTitulo: string;
}

interface LeccionDb {
  id: string;
  titulo: string;
  moduloTitulo: string;
}

interface SnapshotSeguridad {
  recursos: number;
  lecciones: number;
  modulos: number;
  cursos: number;
  inscripciones: number;
  progreso: number;
  profiles: number;
  titulosRecursos: string;
  titulosLecciones: string;
}

const MODULOS_ESPERADOS = ENLACES_GERENCIA_SOCIAL.map((m) => m.modulo);
const LECCIONES_ESPERADAS = ENLACES_GERENCIA_SOCIAL.reduce(
  (acc, m) => acc + m.lecciones.length,
  0,
);
const RECURSOS_ESPERADOS = LECCIONES_ESPERADAS * CATEGORIAS.length;

function assertConexionLocal(connectionString: string): void {
  const url = new URL(connectionString);
  const host = url.hostname.toLowerCase();
  const permitidos = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!permitidos.has(host)) {
    throw new Error(
      `Conexión rechazada: host "${host}" no es local. Solo se permite localhost/127.0.0.1.`,
    );
  }
  if (url.port && url.port !== "5433" && host !== "127.0.0.1") {
    console.warn(`Advertencia: puerto ${url.port} (se esperaba 5433 para Docker local).`);
  }
  if (connectionString.includes("cloudsql") || connectionString.includes("/cloudsql/")) {
    throw new Error("Conexión rechazada: parece apuntar a Cloud SQL.");
  }
}

export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function distanciaLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + costo);
    }
  }
  return dp[m][n];
}

function deduplicarTokensConsecutivos(texto: string): string {
  let result = normalizarTexto(texto);
  for (let size = 4; size >= 2; size--) {
    const pattern = new RegExp(`(\\b(?:\\w+\\s+){${size - 1}}\\w+)(?:\\s+\\1)+`, "g");
    result = result.replace(pattern, "$1");
  }
  const tokens = result.split(" ").filter(Boolean);
  return tokens.filter((token, index) => index === 0 || token !== tokens[index - 1]).join(" ");
}

function textosEquivalentes(esperado: string, real: string): boolean {
  const a = deduplicarTokensConsecutivos(esperado);
  const b = deduplicarTokensConsecutivos(real);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return true;
  const dist = distanciaLevenshtein(a, b);
  return dist / maxLen <= 0.12;
}

export function categoriaDeRecurso(tipo: string, nombre: string): CategoriaRecurso | null {
  const n = normalizarTexto(nombre);
  switch (tipo) {
    case "video":
      return "video";
    case "audio":
      return "podcast";
    case "imagen":
      return "infografia";
    case "presentacion":
      return "presentacion";
    case "pdf":
    case "enlace":
    case "archivo": {
      if (n.includes("infograf")) return "infografia";
      if (n.includes("podcast")) return "podcast";
      if (n.includes("present")) return "presentacion";
      if (n.includes("video")) return "video";
      return "documento";
    }
    default:
      return null;
  }
}

function extraerIdDrive(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([^/]+)/);
  return match?.[1] ?? null;
}

function urlsEquivalentes(actual: string | null, nueva: string): boolean {
  if (!actual) return false;
  const idActual = extraerIdDrive(actual);
  const idNueva = extraerIdDrive(nueva);
  if (idActual && idNueva) return idActual === idNueva;
  return actual.trim() === nueva.trim();
}

async function cargarCurso(client: Client): Promise<{ id: string; titulo: string }> {
  const { rows: cursos } = await client.query<{ id: string; titulo: string }>(`
    select c.id, c.titulo
    from cursos c
    where c.deleted_at is null
      and c.es_diplomado = true
      and exists (
        select 1
        from modulos m
        where m.curso_id = c.id
          and m.deleted_at is null
          and lower(m.titulo) like '%aspectos conceptuales de gerencia social%'
      )
    order by c.created_at
    limit 1
  `);

  if (cursos.length === 0) {
    throw new Error("No se encontró el diplomado con módulo 'Aspectos conceptuales de gerencia social'.");
  }
  if (cursos.length > 1) {
    throw new Error("Diplomado ambiguo: hay más de un curso candidato.");
  }
  return cursos[0];
}

async function cargarLecciones(client: Client, cursoId: string): Promise<LeccionDb[]> {
  const { rows } = await client.query<{
    id: string;
    titulo: string;
    modulo_titulo: string;
  }>(`
    select l.id, l.titulo, m.titulo as modulo_titulo
    from modulos m
    join unidades u on u.modulo_id = m.id and u.deleted_at is null
    join lecciones l on l.unidad_id = u.id and l.deleted_at is null
    where m.curso_id = $1 and m.deleted_at is null
    order by m.orden, l.orden
  `, [cursoId]);

  return rows.map((r) => ({
    id: r.id,
    titulo: r.titulo,
    moduloTitulo: r.modulo_titulo,
  }));
}

async function cargarRecursos(client: Client, cursoId: string): Promise<RecursoDb[]> {
  const { rows } = await client.query<{
    id: string;
    tipo: string;
    nombre: string;
    url_externa: string | null;
    leccion_id: string;
    leccion_titulo: string;
    modulo_titulo: string;
  }>(`
    select
      r.id,
      r.tipo::text as tipo,
      r.nombre,
      r.url_externa,
      l.id as leccion_id,
      l.titulo as leccion_titulo,
      m.titulo as modulo_titulo
    from recursos r
    join lecciones l on l.id = r.leccion_id and l.deleted_at is null
    join unidades u on u.id = l.unidad_id and u.deleted_at is null
    join modulos m on m.id = u.modulo_id and m.deleted_at is null
    where m.curso_id = $1 and r.deleted_at is null
  `, [cursoId]);

  return rows.map((r) => ({
    id: r.id,
    tipo: r.tipo,
    nombre: r.nombre,
    urlExterna: r.url_externa,
    leccionId: r.leccion_id,
    leccionTitulo: r.leccion_titulo,
    moduloTitulo: r.modulo_titulo,
  }));
}

function resolverLeccion(
  lecciones: LeccionDb[],
  moduloEsperado: string,
  leccionEsperada: string,
): LeccionDb | null {
  const candidatos = lecciones.filter((l) => textosEquivalentes(moduloEsperado, l.moduloTitulo));
  const porLeccion = candidatos.filter((l) => textosEquivalentes(leccionEsperada, l.titulo));
  if (porLeccion.length === 1) return porLeccion[0];
  if (porLeccion.length > 1) return null;
  return null;
}

function construirDiagnostico(
  curso: { id: string; titulo: string },
  lecciones: LeccionDb[],
  recursos: RecursoDb[],
): FilaDiagnostico[] {
  const filas: FilaDiagnostico[] = [];

  for (const moduloMap of ENLACES_GERENCIA_SOCIAL) {
    for (const leccionMap of moduloMap.lecciones) {
      const leccionDb = resolverLeccion(lecciones, moduloMap.modulo, leccionMap.leccion);
      const recursosLeccion = leccionDb
        ? recursos.filter((r) => r.leccionId === leccionDb.id)
        : [];

      for (const categoria of CATEGORIAS) {
        const urlNueva = leccionMap.recursos[categoria];
        const candidatos = recursosLeccion.filter((r) => {
          const cat = categoriaDeRecurso(r.tipo, r.nombre);
          return cat === categoria;
        });

        let estado: EstadoDiagnostico;
        let resourceId: string | null = null;
        let urlActual: string | null = null;

        if (!leccionDb) {
          estado = "NO_ENCONTRADO";
        } else if (candidatos.length === 0) {
          estado = "NO_ENCONTRADO";
        } else if (candidatos.length > 1) {
          estado = "DUPLICADO";
          resourceId = candidatos.map((c) => c.id).join(", ");
          urlActual = candidatos.map((c) => c.urlExterna ?? "(null)").join(" | ");
        } else {
          const unico = candidatos[0];
          const cat = categoriaDeRecurso(unico.tipo, unico.nombre);
          if (!cat) {
            estado = "TIPO_NO_IDENTIFICADO";
          } else {
            estado = "MATCH";
            resourceId = unico.id;
            urlActual = unico.urlExterna;
          }
        }

        filas.push({
          curso: curso.titulo,
          cursoId: curso.id,
          modulo: moduloMap.modulo,
          moduloDb: leccionDb?.moduloTitulo ?? "(no encontrado)",
          leccion: leccionMap.leccion,
          leccionDb: leccionDb?.titulo ?? "(no encontrada)",
          tipoRecurso: categoria,
          resourceId,
          urlActual,
          urlNueva,
          estado,
        });
      }
    }
  }

  return filas;
}

function imprimirDiagnostico(filas: FilaDiagnostico[]): void {
  console.log("\n=== DIAGNÓSTICO ===\n");
  console.table(
    filas.map((f) => ({
      modulo: f.modulo.slice(0, 40),
      leccion: f.leccion.slice(0, 45),
      tipo: f.tipoRecurso,
      resource_id: f.resourceId?.slice(0, 36) ?? "",
      url_actual: f.urlActual ? `${f.urlActual.slice(0, 50)}...` : "",
      url_nueva: `${f.urlNueva.slice(0, 50)}...`,
      estado: f.estado,
    })),
  );

  const conteo = filas.reduce(
    (acc, f) => {
      acc[f.estado] = (acc[f.estado] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  console.log("\nConteo por estado:", conteo);
}

async function snapshotSeguridad(client: Client, cursoId: string): Promise<SnapshotSeguridad> {
  const [recursos, lecciones, modulos, cursos, inscripciones, progreso, profiles, titulosRecursos, titulosLecciones] =
    await Promise.all([
      client.query<{ count: string }>(
        `select count(*)::text as count from recursos r
         join lecciones l on l.id = r.leccion_id
         join unidades u on u.id = l.unidad_id
         join modulos m on m.id = u.modulo_id
         where m.curso_id = $1 and r.deleted_at is null`,
        [cursoId],
      ),
      client.query<{ count: string }>(
        `select count(*)::text as count from lecciones l
         join unidades u on u.id = l.unidad_id
         join modulos m on m.id = u.modulo_id
         where m.curso_id = $1 and l.deleted_at is null`,
        [cursoId],
      ),
      client.query<{ count: string }>(
        `select count(*)::text as count from modulos where curso_id = $1 and deleted_at is null`,
        [cursoId],
      ),
      client.query<{ count: string }>(`select count(*)::text as count from cursos where deleted_at is null`),
      client.query<{ count: string }>(`select count(*)::text as count from inscripciones where deleted_at is null`),
      client.query<{ count: string }>(`select count(*)::text as count from progreso_lecciones`),
      client.query<{ count: string }>(`select count(*)::text as count from profiles where deleted_at is null`),
      client.query<{ hash: string }>(
        `select md5(string_agg(r.id::text || coalesce(r.tipo::text,'') || coalesce(r.nombre,''), '|' order by r.id)) as hash
         from recursos r
         join lecciones l on l.id = r.leccion_id
         join unidades u on u.id = l.unidad_id
         join modulos m on m.id = u.modulo_id
         where m.curso_id = $1 and r.deleted_at is null`,
        [cursoId],
      ),
      client.query<{ hash: string }>(
        `select md5(string_agg(l.id::text || l.titulo, '|' order by l.id)) as hash
         from lecciones l
         join unidades u on u.id = l.unidad_id
         join modulos m on m.id = u.modulo_id
         where m.curso_id = $1 and l.deleted_at is null`,
        [cursoId],
      ),
    ]);

  return {
    recursos: Number(recursos.rows[0].count),
    lecciones: Number(lecciones.rows[0].count),
    modulos: Number(modulos.rows[0].count),
    cursos: Number(cursos.rows[0].count),
    inscripciones: Number(inscripciones.rows[0].count),
    progreso: Number(progreso.rows[0].count),
    profiles: Number(profiles.rows[0].count),
    titulosRecursos: titulosRecursos.rows[0]?.hash ?? "",
    titulosLecciones: titulosLecciones.rows[0]?.hash ?? "",
  };
}

async function imprimirVerificacionFinal(client: Client, cursoId: string): Promise<void> {
  const { rows } = await client.query<{
    mod_orden: number;
    modulo: string;
    lec_orden: number;
    leccion: string;
    tipo: string;
    nombre: string;
    url_externa: string;
  }>(`
    select m.orden as mod_orden, m.titulo as modulo, l.orden as lec_orden, l.titulo as leccion,
           r.tipo::text as tipo, r.nombre, r.url_externa
    from modulos m
    join unidades u on u.modulo_id = m.id and u.deleted_at is null
    join lecciones l on l.unidad_id = u.id and l.deleted_at is null
    join recursos r on r.leccion_id = l.id and r.deleted_at is null
    where m.curso_id = $1 and m.deleted_at is null
    order by m.orden, l.orden, r.orden
  `, [cursoId]);

  let modActual = -1;
  let lecActual = -1;
  for (const row of rows) {
    if (row.mod_orden !== modActual) {
      modActual = row.mod_orden;
      console.log(`\nMódulo ${modActual + 1} — ${row.modulo}`);
    }
    if (row.lec_orden !== lecActual || row.mod_orden !== modActual) {
      lecActual = row.lec_orden;
      console.log(`  G${lecActual + 1} — ${row.leccion.trim()}`);
    }
    const cat = categoriaDeRecurso(row.tipo, row.nombre) ?? row.tipo;
    console.log(`    ${cat} -> ${row.url_externa}`);
  }
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const connectionString = process.env.MIGRATIONS_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta MIGRATIONS_DATABASE_URL o DATABASE_URL en el entorno.");
  }
  assertConexionLocal(connectionString);

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const curso = await cargarCurso(client);
    const lecciones = await cargarLecciones(client, curso.id);
    const recursos = await cargarRecursos(client, curso.id);
    const filas = construirDiagnostico(curso, lecciones, recursos);

    const modulosEncontrados = new Set(lecciones.map((l) => l.moduloTitulo));
    const leccionesEncontradas = lecciones.length;
    const recursosEncontrados = recursos.length;

    console.log("Diplomado encontrado:", curso.titulo);
    console.log("ID:", curso.id);
    console.log("\nMódulos en BD:");
    for (const titulo of [...modulosEncontrados]) console.log(`  - ${titulo}`);
    console.log(`\nLecciones esperadas: ${LECCIONES_ESPERADAS}`);
    console.log(`Lecciones encontradas: ${leccionesEncontradas}`);
    console.log(`Recursos esperados (mapa): ${RECURSOS_ESPERADOS}`);
    console.log(`Recursos activos en BD: ${recursosEncontrados}`);

    if (leccionesEncontradas !== LECCIONES_ESPERADAS) {
      console.warn(
        `\n⚠ Diferencia de lecciones: se esperaban ${LECCIONES_ESPERADAS}, hay ${leccionesEncontradas}.`,
      );
    }
    if (recursosEncontrados !== RECURSOS_ESPERADOS) {
      console.warn(
        `⚠ Diferencia de recursos: se esperaban ${RECURSOS_ESPERADOS}, hay ${recursosEncontrados}.`,
      );
      console.warn("  Causa probable: lección M5-G1 sin recursos y duplicado en M5-G6 presentación.");
    }

    imprimirDiagnostico(filas);

    const match = filas.filter((f) => f.estado === "MATCH");
    const aActualizar = match.filter((f) => !urlsEquivalentes(f.urlActual, f.urlNueva));
    const sinCambio = match.filter((f) => urlsEquivalentes(f.urlActual, f.urlNueva));
    const noEncontrados = filas.filter((f) => f.estado === "NO_ENCONTRADO");
    const duplicados = filas.filter((f) => f.estado === "DUPLICADO");

    console.log("\n=== RESUMEN PRE-ACTUALIZACIÓN ===");
    console.log(`MATCH: ${match.length}`);
    console.log(`URLs a modificar: ${aActualizar.length}`);
    console.log(`URLs ya correctas: ${sinCambio.length}`);
    console.log(`NO_ENCONTRADO: ${noEncontrados.length}`);
    console.log(`DUPLICADO: ${duplicados.length}`);

    if (!apply) {
      console.log("\nModo diagnóstico. Ejecute con --apply para aplicar cambios.");
      return;
    }

    if (duplicados.length > 0) {
      console.warn("\nHay DUPLICADOS; esos registros no se actualizarán.");
    }

    const antes = await snapshotSeguridad(client, curso.id);

    await client.query("BEGIN");
    let resultado: "COMMIT" | "ROLLBACK" = "ROLLBACK";
    try {
      for (const fila of aActualizar) {
        if (!fila.resourceId || fila.estado !== "MATCH") continue;
        await client.query(
          `update recursos set url_externa = $1, updated_at = now() where id = $2`,
          [fila.urlNueva, fila.resourceId],
        );
      }

      const despues = await snapshotSeguridad(client, curso.id);

      const validaciones = [
        despues.recursos === antes.recursos,
        despues.lecciones === antes.lecciones,
        despues.modulos === antes.modulos,
        despues.cursos === antes.cursos,
        despues.inscripciones === antes.inscripciones,
        despues.progreso === antes.progreso,
        despues.profiles === antes.profiles,
        despues.titulosLecciones === antes.titulosLecciones,
        despues.titulosRecursos === antes.titulosRecursos,
      ];

      if (!validaciones.every(Boolean)) {
        console.error("Validación de seguridad fallida:");
        console.error({ antes, despues });
        await client.query("ROLLBACK");
        throw new Error("ROLLBACK: cambios fuera de url_externa detectados.");
      }

      await client.query("COMMIT");
      resultado = "COMMIT";
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    console.log("\n=== REPORTE FINAL ===");
    console.log(`Diplomado encontrado: ${curso.titulo}`);
    console.log(`ID: ${curso.id}`);
    console.log(`Módulos encontrados: ${modulosEncontrados.size}`);
    console.log(`Lecciones esperadas: ${LECCIONES_ESPERADAS}`);
    console.log(`Lecciones encontradas: ${leccionesEncontradas}`);
    console.log(`Recursos esperados: ${RECURSOS_ESPERADOS}`);
    console.log(`Recursos encontrados antes: ${recursosEncontrados}`);
    console.log(`URLs modificadas: ${aActualizar.length}`);
    console.log(`URLs sin cambios porque ya coincidían: ${sinCambio.length}`);
    console.log(`Recursos no encontrados: ${noEncontrados.length}`);
    console.log(`Duplicados: ${duplicados.length}`);
    console.log(`Resultado de la transacción: ${resultado}`);

    console.log("\n=== VERIFICACIÓN FINAL (recursos en BD) ===");
    await imprimirVerificacionFinal(client, curso.id);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
