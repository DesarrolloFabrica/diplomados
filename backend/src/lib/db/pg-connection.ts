export type PgConnectionInfo = {
  host: string;
  port: number;
  database: string;
  user: string;
};

export type CliTarget = "local" | "production";

const LOCAL_DOCKER_PORT = 5433;
const PRODUCTION_PROXY_PORT = 5434;

export function parsePostgresUrl(connectionString: string): PgConnectionInfo {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("La URL de conexión no es válida. No se mostrará el valor.");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("La URL de conexión debe usar el protocolo postgresql://.");
  }

  const host = url.hostname.trim().toLowerCase();
  const port = url.port ? Number(url.port) : 5432;
  const database = decodeURIComponent(
    url.pathname.replace(/^\//, "").split("/")[0] ?? "",
  );
  const user = decodeURIComponent(url.username);

  if (!host || Number.isNaN(port) || !database) {
    throw new Error("La URL de conexión no incluye host, puerto o nombre de base.");
  }

  return { host, port, database, user };
}

export function printConnectionPreview(entorno: string, info: PgConnectionInfo): void {
  console.log(`Entorno: ${entorno}`);
  console.log(`Host: ${info.host}`);
  console.log(`Puerto: ${info.port}`);
  console.log(`Database: ${info.database}`);
  console.log(`Usuario: ${info.user || "(sin usuario en la URL)"}`);
}

function esHostLoopback(host: string): boolean {
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

export function assertLocalMigrationsUrl(connectionString: string): PgConnectionInfo {
  const info = parsePostgresUrl(connectionString);
  if (esHostLoopback(info.host) && info.port === PRODUCTION_PROXY_PORT) {
    throw new Error(
      "ERROR: MIGRATIONS_DATABASE_URL apunta al puerto 5434 (proxy de Cloud SQL).\n" +
        "Usa npm run db:migrate:production con PRODUCTION_MIGRATIONS_DATABASE_URL.\n" +
        "No se ejecutó ninguna migración.",
    );
  }
  return info;
}

export function assertProductionMigrationsUrl(connectionString: string): PgConnectionInfo {
  const info = parsePostgresUrl(connectionString);

  if (esHostLoopback(info.host) && info.port === LOCAL_DOCKER_PORT) {
    throw new Error(
      "ERROR: PRODUCTION_MIGRATIONS_DATABASE_URL apunta a localhost:5433 (Postgres Docker local).\n" +
        "No se ejecutó ninguna operación contra esa base.",
    );
  }

  if (!esHostLoopback(info.host)) {
    throw new Error(
      "ERROR: las migraciones de producción deben ir por Cloud SQL Auth Proxy " +
        `(host 127.0.0.1 o localhost, puerto ${PRODUCTION_PROXY_PORT}). ` +
        `Host detectado: ${info.host}.\n` +
        "No se ejecutó ninguna operación.",
    );
  }

  if (info.port !== PRODUCTION_PROXY_PORT) {
    throw new Error(
      `ERROR: el proxy de producción debe usar el puerto ${PRODUCTION_PROXY_PORT} ` +
        `(detectado: ${info.port}). Arranca scripts/database/cloud-sql-proxy.ps1.\n` +
        "No se ejecutó ninguna operación.",
    );
  }

  return info;
}

export function requireEnvUrl(
  nombre: string,
  nadaEjecutado = "migración",
): string {
  const valor = process.env[nombre];
  if (!valor || valor.trim() === "") {
    throw new Error(
      `ERROR: ${nombre} no está configurada.\nNo se ejecutó ninguna ${nadaEjecutado}.`,
    );
  }
  return valor;
}

export function pgClientConfig(connectionString: string): {
  connectionString: string;
  ssl: false;
} {
  // El Auth Proxy ya cifra hacia Cloud SQL. node-pg no debe negociar TLS
  // contra 127.0.0.1 (sslmode=prefer provoca handshakes raros en Windows).
  return { connectionString, ssl: false };
}

export function explainPgConnectionError(error: unknown): string {
  const mensaje = error instanceof Error ? error.message : String(error);
  const esReset =
    /ECONNRESET/i.test(mensaje) ||
    /ECONNREFUSED/i.test(mensaje) ||
    /connect ECONN/i.test(mensaje);

  if (!esReset) {
    return mensaje;
  }

  return [
    mensaje,
    "",
    "El cliente local llegó al puerto 5434, pero el Cloud SQL Auth Proxy cerró el socket.",
    "Mira la ventana de cloud-sql-proxy.ps1. Si ves:",
    "  tls: failed to verify certificate: x509: certificate signed by unknown authority",
    "entonces no es la contraseña de postgres: el proxy no puede validar el certificado",
    "TLS de Cloud SQL (CA interna). Suele ser inspección SSL de la red/VPN/antivirus.",
    "",
    "Qué probar (en este orden):",
    "1. Otra red (datos del móvil, sin VPN corporativa) y repetir el check.",
    "2. Pedir a TI que no inspeccione TLS hacia la IP pública de la instancia diplomados.",
    "3. Si accedes por VPC: cloud-sql-proxy ... --port 5434 --private-ip",
  ].join("\n");
}

export function resolveCliTarget(argv: string[]): CliTarget {
  const production = argv.includes("--production");
  return production ? "production" : "local";
}

export function resolveMigrationsUrl(target: CliTarget): {
  connectionString: string;
  info: PgConnectionInfo;
  entorno: string;
} {
  switch (target) {
    case "local": {
      const connectionString = requireEnvUrl("MIGRATIONS_DATABASE_URL");
      const info = assertLocalMigrationsUrl(connectionString);
      return { connectionString, info, entorno: "LOCAL" };
    }
    case "production": {
      const connectionString = requireEnvUrl("PRODUCTION_MIGRATIONS_DATABASE_URL");
      const info = assertProductionMigrationsUrl(connectionString);
      return { connectionString, info, entorno: "PRODUCCIÓN" };
    }
    default: {
      const neverTarget: never = target;
      throw new Error(`Destino no soportado: ${String(neverTarget)}`);
    }
  }
}
