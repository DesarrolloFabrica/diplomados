import path from "node:path";
import { config } from "dotenv";

/** Raíz del monorepo (cuatro niveles por encima de `backend/src/lib/db`). */
export const MONOREPO_ROOT = path.resolve(import.meta.dirname, "../../../..");

export function loadMonorepoEnv(): void {
  config({ path: path.join(MONOREPO_ROOT, ".env.local"), quiet: true });
  config({ path: path.join(MONOREPO_ROOT, ".env"), quiet: true });
}
