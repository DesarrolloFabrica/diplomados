# Flujo de base de datos (local → Cloud SQL)

Local (Docker en `localhost:5433`) y Cloud SQL son bases **independientes**.
Solo se promociona el **esquema** (y, si hace falta, seeds explícitos).
Nunca se copia la base de desarrollo sobre producción.

Cloud Run **no** ejecuta migraciones al desplegar. Hay que aplicarlas a
mano con el proxy.

```
CAMBIO LOCAL
↓
crear migración en backend/db/migrations/NNN_nombre.sql
↓
npm run db:migrate
↓
probar con npm run dev (localhost)
↓
commit
↓
push
↓
deploy (Cloud Run; no toca el esquema)
↓
Cloud SQL Proxy :5434
↓
npm run db:check:production
↓
npm run db:migrations:status
↓
npm run db:migrate:production
↓
verificar Cloud SQL
```

## Cómo funciona el runner

`npm run db:migrate` ejecuta `backend/src/lib/db/migrate.ts`.

- Lee los `.sql` de `backend/db/migrations/` en orden de nombre.
- Crea si no existe `public._migrations (nombre_archivo, aplicada_en)`.
- Aplica en una transacción cada archivo que aún no esté en esa tabla.
- **Local** usa solo `MIGRATIONS_DATABASE_URL` (sin fallback a `DATABASE_URL`).
- **Producción** usa solo `PRODUCTION_MIGRATIONS_DATABASE_URL`.

Drizzle Kit (`db:generate` / `db:studio`) no aplica estas migraciones SQL.

La siguiente migración nueva debe ser `013_...sql` (la última versionada
hoy es `012_escuela_visual.sql`). No edites un `.sql` que ya se aplicó
en producción.

## Variables (raíz del monorepo, archivo `.env` no versionado)

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | App local (`app_user`, RLS). `npm run dev`. |
| `MIGRATIONS_DATABASE_URL` | Migraciones y seeds **locales**. Usuario admin (`postgres`). Puerto **5433**. |
| `PRODUCTION_MIGRATIONS_DATABASE_URL` | Migraciones y seeds **manuales** vía proxy. Usuario admin de Cloud SQL. Host `127.0.0.1`, puerto **5434**. |

El secret de Cloud Run `database-url` es de la aplicación (`app_user`).
Este flujo **no** lo modifica.

Ejemplo de producción en `.env` (contraseña solo en tu máquina):

```env
PRODUCTION_MIGRATIONS_DATABASE_URL=postgresql://postgres:TU_CLAVE@127.0.0.1:5434/plataforma_formacion
```

## Desarrollo

```bash
docker compose up -d
npm run db:migrate
npm run dev
```

## Promover esquema a Cloud SQL

1. Autenticación ADC si el proxy lo requiere: `gcloud auth application-default login`
2. En PowerShell, dejar el proxy abierto:

```powershell
.\scripts\database\cloud-sql-proxy.ps1
```

3. En otra terminal, desde la raíz del repo:

```bash
npm run db:check:production
npm run db:migrations:status
npm run db:migrate:production
```

Comando exacto de migración a Cloud SQL (con el proxy ya escuchando en 5434
y `PRODUCTION_MIGRATIONS_DATABASE_URL` en `.env`):

```bash
npm run db:migrate:production
```

## Datos maestros (opcional)

No dumps. Archivos idempotentes en `backend/db/seeds/`. Ver README de esa carpeta.

```bash
npm run db:seed
npm run db:seed:production
```

## Nunca hacer

* No conectar `npm run dev` directamente a producción (`DATABASE_URL` no debe apuntar a Cloud SQL).
* No copiar toda la base local sobre producción (`pg_dump` / restore completo).
* No usar `app_user` para cambios administrativos si RLS o grants lo impiden; las migraciones van con el usuario dueño del esquema.
* No editar migraciones que ya se ejecutaron en algún entorno compartido.
* No incluir contraseñas de Cloud SQL en Git.
* No asumir que un deploy de Cloud Run ejecuta migraciones.
* No ejecutar producción si el proxy no está en `127.0.0.1:5434` (el script aborta si ve `localhost:5433` u otro host/puerto).
* No usar `npm run db:migrate` contra el puerto 5434; ese comando está reservado a local.

## Instancia GCP de referencia

- Proyecto: `gen-lang-client-0049269139`
- Instancia: `diplomados`
- Región: `us-central1`
- Connection name: `gen-lang-client-0049269139:us-central1:diplomados`
