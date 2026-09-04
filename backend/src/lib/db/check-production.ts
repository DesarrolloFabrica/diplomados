import { Client } from "pg";
import { loadMonorepoEnv } from "./load-monorepo-env";
import {
  printConnectionPreview,
  requireEnvUrl,
  assertProductionMigrationsUrl,
  pgClientConfig,
  explainPgConnectionError,
} from "./pg-connection";

loadMonorepoEnv();

async function main(): Promise<void> {
  const connectionString = requireEnvUrl(
    "PRODUCTION_MIGRATIONS_DATABASE_URL",
    "consulta",
  );
  const info = assertProductionMigrationsUrl(connectionString);
  printConnectionPreview("PRODUCCIÓN (solo lectura)", info);

  const client = new Client(pgClientConfig(connectionString));
  await client.connect();

  try {
    const database = await client.query<{ current_database: string }>(
      "select current_database()",
    );
    const usuario = await client.query<{ current_user: string }>(
      "select current_user",
    );
    const version = await client.query<{ version: string }>("select version()");
    const ahora = await client.query<{ now: Date }>("select now()");

    console.log("Conexión Cloud SQL correcta");
    console.log(`Database: ${database.rows[0]?.current_database ?? ""}`);
    console.log(`User: ${usuario.rows[0]?.current_user ?? ""}`);
    const versionTexto = version.rows[0]?.version ?? "";
    console.log(`Version: ${versionTexto.split(",")[0] ?? versionTexto}`);
    console.log(`NOW(): ${ahora.rows[0]?.now?.toISOString() ?? ""}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(explainPgConnectionError(error));
  process.exit(1);
});
