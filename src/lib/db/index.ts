import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

// En Cloud Run, al desplegar con `--add-cloudsql-instances`, Cloud SQL
// queda disponible como socket unix en /cloudsql/<INSTANCE_CONNECTION_NAME>
// (no hace falta librería adicional ni IP pública). En local se usa
// DATABASE_URL normal, apuntando al Cloud SQL Auth Proxy o a un Postgres local.
function crearPool() {
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

  return new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
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
