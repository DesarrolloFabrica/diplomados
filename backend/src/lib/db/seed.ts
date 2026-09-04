import path from "node:path";
import { Client } from "pg";
import { applyPendingSqlFiles, listSqlFiles } from "./apply-sql-files";
import { loadMonorepoEnv } from "./load-monorepo-env";
import {
  printConnectionPreview,
  resolveCliTarget,
  resolveMigrationsUrl,
  pgClientConfig,
  explainPgConnectionError,
} from "./pg-connection";

loadMonorepoEnv();

const SEEDS_DIR = path.join(import.meta.dirname, "../../../db/seeds");

async function main(): Promise<void> {
  const archivos = await listSqlFiles(SEEDS_DIR).catch(() => [] as string[]);
  if (archivos.length === 0) {
    console.log("No hay archivos .sql en backend/db/seeds/. Nada que aplicar.");
    return;
  }

  const target = resolveCliTarget(process.argv.slice(2));
  const { connectionString, info, entorno } = resolveMigrationsUrl(target);
  printConnectionPreview(`${entorno} (seeds)`, info);

  const client = new Client(pgClientConfig(connectionString));
  await client.connect();

  try {
    await applyPendingSqlFiles({
      client,
      dir: SEEDS_DIR,
      table: "_seeds",
      etiqueta: "Seeds",
    });
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(explainPgConnectionError(error));
  process.exit(1);
});
