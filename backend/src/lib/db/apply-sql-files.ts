import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Client } from "pg";

export type TrackingTable = "_migrations" | "_seeds";

export async function ensureTrackingTable(
  client: Client,
  table: TrackingTable,
): Promise<void> {
  await client.query(`
    create table if not exists public.${table} (
      nombre_archivo text primary key,
      aplicada_en timestamptz not null default now()
    );
  `);
}

export async function listSqlFiles(dir: string): Promise<string[]> {
  const archivos = await readdir(dir);
  return archivos.filter((f) => f.endsWith(".sql")).sort();
}

export async function trackingTableExists(
  client: Client,
  table: TrackingTable,
): Promise<boolean> {
  const { rows } = await client.query<{ t: string | null }>(
    "select to_regclass($1) as t",
    [`public.${table}`],
  );
  return rows[0]?.t != null;
}

export async function listAppliedFiles(
  client: Client,
  table: TrackingTable,
): Promise<Set<string>> {
  const { rows } = await client.query<{ nombre_archivo: string }>(
    `select nombre_archivo from public.${table}`,
  );
  return new Set(rows.map((r) => r.nombre_archivo));
}

export async function applyPendingSqlFiles(options: {
  client: Client;
  dir: string;
  table: TrackingTable;
  etiqueta: string;
}): Promise<void> {
  const { client, dir, table, etiqueta } = options;
  await ensureTrackingTable(client, table);

  const archivos = await listSqlFiles(dir);
  const yaAplicadas = await listAppliedFiles(client, table);

  for (const archivo of archivos) {
    if (yaAplicadas.has(archivo)) {
      console.log(`↷ ya aplicada: ${archivo}`);
      continue;
    }

    const sqlContenido = await readFile(path.join(dir, archivo), "utf8");
    console.log(`→ aplicando (${etiqueta}): ${archivo}`);

    await client.query("begin");
    try {
      await client.query(sqlContenido);
      await client.query(
        `insert into public.${table} (nombre_archivo) values ($1)`,
        [archivo],
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw new Error(`Falló ${archivo}: ${(error as Error).message}`);
    }
  }

  console.log(`${etiqueta} al día.`);
}
