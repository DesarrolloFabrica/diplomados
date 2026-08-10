import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

// En Cloud Run el secreto DATABASE_URL suele traer el socket unix
// (`?host=/cloudsql/<INSTANCE>`). En local se usa DATABASE_URL con TCP
// (IP autorizada o Auth Proxy). INSTANCE_CONNECTION_NAME solo se usa
// como fallback legacy cuando no hay DATABASE_URL.
function crearPool() {
  if (process.env.DATABASE_URL) {
    const raw = process.env.DATABASE_URL;
    const esSocketUnix = raw.includes("/cloudsql/");

    // Socket de Cloud Run: sin tocar SSL.
    if (esSocketUnix) {
      return new Pool({ connectionString: raw, max: 10 });
    }

    // En pg reciente, sslmode=require se trata como verify-full y rompe
    // con inspección SSL corporativa / CA de Cloud SQL. Quitamos sslmode
    // y controlamos SSL a mano.
    const sinSslMode = raw
      .replace(/([?&])sslmode=[^&]*/gi, "$1")
      .replace(/[?&]$/, "")
      .replace(/\?&/, "?")
      .replace(/\?$/, "");

    const hostLocal =
      /@localhost[:/]/i.test(raw) || /@127\.0\.0\.1[:/]/i.test(raw);
    const pedíaSsl = /[?&]sslmode=/i.test(raw);

    return new Pool({
      connectionString: sinSslMode,
      max: 10,
      keepAlive: true,
      idleTimeoutMillis: 60_000,
      connectionTimeoutMillis: 15_000,
      ...(!hostLocal || pedíaSsl
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    });
  }

  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
  if (instanceConnectionName) {
    return new Pool({
      host: `/cloudsql/${instanceConnectionName}`,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 10,
    });
  }

  throw new Error("Falta DATABASE_URL (o INSTANCE_CONNECTION_NAME + DB_*).");
}

export const pool = crearPool();
export const db = drizzle(pool, { schema });

// Toda query autenticada de la app debe pasar por aquí: abre una
// transacción y fija `app.current_user_id` para esa transacción, que es
// lo que leen las políticas RLS (ver public.auth_uid() en
// db/migrations/004_functions_triggers.sql). Sin este SET, auth_uid() es
// null y RLS deniega todo lo que no sea explícitamente público.
export async function conSesion<T>(
  usuarioId: string | null,
  fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    if (usuarioId) {
      await tx.execute(sql`select set_config('app.current_user_id', ${usuarioId}, true)`);
    }
    return fn(tx);
  });
}
