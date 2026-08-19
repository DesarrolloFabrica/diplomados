// Runner de migraciones: aplica los .sql de db/migrations en orden y dentro
// de una transacción cada uno, llevando el registro en la tabla
// public._migrations. Se conecta con credenciales privilegiadas
// (MIGRATIONS_DATABASE_URL) porque 005_app_role_and_grants.sql necesita
// crear el rol `app_user` — la app en tiempo de ejecución NUNCA usa esta
// conexión, solo `npm run db:migrate` la usa.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { Client } from "pg";

// Este script corre standalone (fuera de Next.js), así que .env.local no
// se carga solo: hay que leerlo a mano. Las variables viven en la raíz del monorepo.
const MONOREPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
config({ path: path.join(MONOREPO_ROOT, ".env.local"), quiet: true });
config({ path: path.join(MONOREPO_ROOT, ".env"), quiet: true });

const MIGRATIONS_DIR = path.join(import.meta.dirname, "../../../db/migrations");

async function main() {
  const connectionString = process.env.MIGRATIONS_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta MIGRATIONS_DATABASE_URL (o DATABASE_URL) en el entorno.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      create table if not exists public._migrations (
        nombre_archivo text primary key,
        aplicada_en timestamptz not null default now()
      );
    `);

    const archivos = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const { rows: aplicadas } = await client.query<{ nombre_archivo: string }>(
      "select nombre_archivo from public._migrations",
    );
    const yaAplicadas = new Set(aplicadas.map((r) => r.nombre_archivo));

    for (const archivo of archivos) {
      if (yaAplicadas.has(archivo)) {
        console.log(`↷ ya aplicada: ${archivo}`);
        continue;
      }

      const sqlContenido = await readFile(path.join(MIGRATIONS_DIR, archivo), "utf8");
      console.log(`→ aplicando: ${archivo}`);

      await client.query("begin");
      try {
        await client.query(sqlContenido);
        await client.query("insert into public._migrations (nombre_archivo) values ($1)", [
          archivo,
        ]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw new Error(`Falló la migración ${archivo}: ${(error as Error).message}`);
      }
    }

    console.log("Migraciones al día.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
