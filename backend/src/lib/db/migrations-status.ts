import path from "node:path";
import { Client } from "pg";
import {
  listAppliedFiles,
  listSqlFiles,
  trackingTableExists,
} from "./apply-sql-files";
import { loadMonorepoEnv } from "./load-monorepo-env";
import {
  assertLocalMigrationsUrl,
  assertProductionMigrationsUrl,
  explainPgConnectionError,
  pgClientConfig,
} from "./pg-connection";

loadMonorepoEnv();

const MIGRATIONS_DIR = path.join(import.meta.dirname, "../../../db/migrations");

async function leerAplicadas(
  etiqueta: string,
  envName: string,
  connectionString: string | undefined,
  validar: (url: string) => void,
): Promise<string[] | null> {
  if (!connectionString || connectionString.trim() === "") {
    console.log(`${etiqueta}: no configurada (${envName})`);
    return null;
  }

  try {
    validar(connectionString);
    const client = new Client(pgClientConfig(connectionString));
    try {
      await client.connect();
      const existe = await trackingTableExists(client, "_migrations");
      if (!existe) {
        return [];
      }
      const aplicadas = await listAppliedFiles(client, "_migrations");
      return [...aplicadas].sort();
    } finally {
      await client.end().catch(() => undefined);
    }
  } catch (error) {
    console.error(
      `${etiqueta}: no se pudo leer public._migrations\n${explainPgConnectionError(error)}`,
    );
    return null;
  }
}

async function main(): Promise<void> {
  const enRepo = await listSqlFiles(MIGRATIONS_DIR);

  const local = await leerAplicadas(
    "Local",
    "MIGRATIONS_DATABASE_URL",
    process.env.MIGRATIONS_DATABASE_URL,
    assertLocalMigrationsUrl,
  );

  const produccion = await leerAplicadas(
    "Producción",
    "PRODUCTION_MIGRATIONS_DATABASE_URL",
    process.env.PRODUCTION_MIGRATIONS_DATABASE_URL,
    assertProductionMigrationsUrl,
  );

  console.log(`Migraciones repo: ${enRepo.length}`);
  console.log(
    `Migraciones local: ${local === null ? "desconocido" : local.length}`,
  );
  console.log(
    `Migraciones producción: ${produccion === null ? "desconocido" : produccion.length}`,
  );

  if (produccion) {
    const pendientes = enRepo.filter((f) => !produccion.includes(f));
    if (pendientes.length === 0) {
      console.log("Pendientes en producción: ninguna");
    } else {
      console.log("Pendientes en producción:");
      for (const archivo of pendientes) {
        console.log(archivo);
      }
    }
  }

  if (local) {
    const pendientesLocal = enRepo.filter((f) => !local.includes(f));
    if (pendientesLocal.length > 0) {
      console.log("Pendientes en local:");
      for (const archivo of pendientesLocal) {
        console.log(archivo);
      }
    }
  }
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
