import type { Config } from "drizzle-kit";

// Solo para `npm run db:studio` (explorar datos). Las migraciones reales
// son los .sql en db/migrations, aplicadas por src/lib/db/migrate.ts —
// drizzle-kit no genera ni gestiona el DDL de este proyecto.
export default {
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
