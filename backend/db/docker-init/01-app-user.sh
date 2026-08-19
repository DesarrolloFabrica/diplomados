#!/bin/bash
set -euo pipefail

# Prepara el rol de la app (la migración 005 también lo crea si no existe).
# La contraseña debe coincidir con DATABASE_URL en .env.local.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
      CREATE ROLE app_user WITH LOGIN PASSWORD 'dev_app_password';
    ELSE
      ALTER ROLE app_user WITH LOGIN PASSWORD 'dev_app_password';
    END IF;
  END
  \$\$;
EOSQL
