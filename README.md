# Plataforma Empresarial de Formación Autoguiada

Aplicación web multiempresa (SaaS) para que las empresas capaciten a sus
colaboradores con cursos y diplomados autoguiados. Inspirada en la lógica de un
LMS como Moodle, pero más simple y directa.

**Stack:** Next.js 15 (App Router) · TypeScript estricto · Tailwind CSS ·
shadcn/ui · PostgreSQL propio (Drizzle ORM) sobre **Google Cloud SQL** ·
Autenticación propia (JWT + cookie httpOnly) · **Google Cloud Storage** ·
**SendGrid** (correo) · Despliegue en **Cloud Run** · React Hook Form · Zod ·
Recharts.

> Estado actual: **Etapa 2 — Cimientos** completada (configuración, base de
> datos, migraciones, seguridad RLS, autenticación y protección de rutas por
> rol), migrada de Supabase a infraestructura propia sobre GCP. Los paneles
> muestran páginas placeholder que se completan en las etapas siguientes.

---

## 1. Requisitos

- Node.js 20 o superior
- `gcloud` CLI autenticado, con un proyecto de GCP elegido
- Docker (solo para construir la imagen de Cloud Run)

## 2. Instalación local

```bash
npm install
cp .env.example .env.local   # y completa los valores (ver secciones 3-6)
npm run db:migrate           # aplica db/migrations/ contra tu Postgres
npm run dev                  # http://localhost:3000
```

Scripts disponibles:

```bash
npm run dev         # entorno de desarrollo
npm run build       # build de producción
npm run start       # servir el build
npm run typecheck   # verificación de tipos (tsc --noEmit)
npm run lint        # ESLint
npm run db:migrate  # aplica las migraciones pendientes de db/migrations/
npm run db:studio   # explorador visual de datos (Drizzle Studio)
```

## 3. Aprovisionar la infraestructura en GCP

Estos comandos los ejecutas tú (no se corrieron automáticamente). Ajusta
`PROJECT_ID`, `REGION` e `INSTANCE` a tu gusto.

```bash
export PROJECT_ID=tu-proyecto-gcp
export REGION=southamerica-west1        # Santiago; usa la región que prefieras
export INSTANCE=plataforma-formacion-db
export DB_NAME=plataforma_formacion

gcloud config set project "$PROJECT_ID"

# 3.1 Habilitar APIs
gcloud services enable \
  sqladmin.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com

# 3.2 Cloud SQL for PostgreSQL (arranca en el tier más chico; súbelo si hace falta)
gcloud sql instances create "$INSTANCE" \
  --database-version=POSTGRES_16 \
  --region="$REGION" \
  --tier=db-f1-micro \
  --storage-auto-increase

gcloud sql databases create "$DB_NAME" --instance="$INSTANCE"

# Contraseña del usuario admin (el que usa MIGRATIONS_DATABASE_URL)
gcloud sql users set-password postgres \
  --instance="$INSTANCE" \
  --password="$(openssl rand -base64 24)"   # guarda este valor

# 3.3 Bucket privado en Cloud Storage
gsutil mb -l "$REGION" -b on "gs://${PROJECT_ID}-plataforma-formacion"

# 3.4 Cuenta de servicio para Cloud Run
gcloud iam service-accounts create plataforma-formacion-run \
  --display-name="Plataforma Formación (Cloud Run)"

export SA="plataforma-formacion-run@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA}" --role="roles/cloudsql.client"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA}" --role="roles/secretmanager.secretAccessor"
gsutil iam ch "serviceAccount:${SA}:roles/storage.objectAdmin" \
  "gs://${PROJECT_ID}-plataforma-formacion"

# 3.5 Artifact Registry para la imagen Docker
gcloud artifacts repositories create plataforma-formacion \
  --repository-format=docker --location="$REGION"
```

## 4. Aplicar las migraciones

Conéctate a Cloud SQL desde tu máquina con el [Cloud SQL Auth
Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy), o usa la IP
pública/privada de la instancia. Con `MIGRATIONS_DATABASE_URL` apuntando al
usuario `postgres` (ver `.env.example`):

```bash
npm run db:migrate
```

La migración `005_app_role_and_grants.sql` crea el rol `app_user` (sin
contraseña). Asígnasela después:

```bash
gcloud sql users set-password app_user \
  --instance="$INSTANCE" \
  --password="$(openssl rand -base64 24)"   # este es el que va en DATABASE_URL/DB_PASSWORD
```

> Por qué dos roles: en Postgres, el dueño de las tablas y los superusuarios
> **no** están sujetos a Row Level Security. Las migraciones corren como
> `postgres` (dueño del esquema); la app **siempre** se conecta como
> `app_user` para que las políticas RLS de aislamiento por empresa se
> apliquen de verdad.

## 5. Variables de entorno

Completa `.env.local` según `.env.example`: base de datos (`DATABASE_URL`,
`MIGRATIONS_DATABASE_URL`), `JWT_SECRET` (genera uno con
`openssl rand -base64 48`), `GCS_BUCKET`, y las credenciales de SendGrid
(`SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`).

Para desarrollo local con Cloud Storage, autentica con:

```bash
gcloud auth application-default login
```

## 6. Crear el primer superadministrador

Como no hay auto-registro, el primer usuario se crea a mano contra la base de
datos (por ejemplo con `npm run db:studio` o `psql`):

```sql
insert into public.profiles (email, password_hash, rol, nombre_completo)
values (
  'admin@tuempresa.com',
  -- genera el hash con bcrypt (12 rounds), p. ej. con:
  --   node -e "console.log(require('bcryptjs').hashSync('tu-clave', 12))"
  '$2a$12$...',
  'superadmin',
  'Nombre del Superadmin'
);
```

> Para crear un `admin_empresa`, `instructor` o `colaborador`, incluye
> `empresa_id` (referencia a una fila de `empresas`) y el `rol`
> correspondiente. La gestión de usuarios desde la interfaz llega en la
> Etapa 3.

## 7. Probar el acceso

`npm run dev` → entra a `http://localhost:3000`. Sin sesión te lleva a
`/login`. Al entrar, el middleware te redirige al panel según tu rol:

| Rol | Panel |
|-----|-------|
| superadmin | `/admin` |
| admin_empresa | `/empresa` |
| instructor | `/instructor/cursos` |
| colaborador | `/mis-cursos` |

Intentar entrar a un panel que no te corresponde te devuelve al tuyo.

## 8. Build y despliegue en Cloud Run

```bash
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/plataforma-formacion/app:latest"

gcloud builds submit --tag "$IMAGE"

gcloud run deploy plataforma-formacion \
  --image="$IMAGE" \
  --region="$REGION" \
  --service-account="$SA" \
  --add-cloudsql-instances="${PROJECT_ID}:${REGION}:${INSTANCE}" \
  --set-env-vars="INSTANCE_CONNECTION_NAME=${PROJECT_ID}:${REGION}:${INSTANCE},DB_USER=app_user,DB_NAME=${DB_NAME},GCS_BUCKET=${PROJECT_ID}-plataforma-formacion,NEXT_PUBLIC_SITE_URL=https://TU-URL-DE-CLOUD-RUN" \
  --set-secrets="DB_PASSWORD=db-password:latest,JWT_SECRET=jwt-secret:latest,SENDGRID_API_KEY=sendgrid-api-key:latest" \
  --allow-unauthenticated
```

Antes de este paso, sube los secretos referenciados (`--set-secrets`) a
Secret Manager:

```bash
echo -n "TU_PASSWORD_DE_APP_USER" | gcloud secrets create db-password --data-file=-
echo -n "TU_JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
echo -n "TU_SENDGRID_API_KEY" | gcloud secrets create sendgrid-api-key --data-file=-
```

---

## Estructura del proyecto

```
db/migrations/         Migraciones SQL (esquema, RLS, funciones, rol de app)
src/
  app/
    (auth)/            Login, recuperar y restablecer contraseña
    (superadmin)/      Panel superadmin  → /admin
    (empresa)/         Panel empresa      → /empresa
    (instructor)/      Panel instructor   → /instructor
    (estudiante)/      Panel colaborador  → /mis-cursos
  components/
    ui/                Componentes base (shadcn/ui)
    layout/            Shell de panel, barra lateral, panel de marca
    shared/             Componentes reutilizables
  config/              Roles, rutas y navegación
  lib/
    db/                Esquema Drizzle, pool de conexión, runner de migraciones
    auth/              JWT, cookies, hashing de contraseñas, sesión, middleware
    storage/           Google Cloud Storage (URLs firmadas)
    email/             Envío de correo transaccional (SendGrid)
    validators/        Esquemas Zod
  server/actions/      Server Actions (mutaciones)
  types/               Tipos del dominio
middleware.ts          Refresco de sesión (JWT) y protección de rutas
Dockerfile             Imagen para Cloud Run
```

## Modelo de seguridad (resumen)

- **Aislamiento por empresa** con RLS: cada fila de datos operativos lleva
  `empresa_id` y las políticas impiden ver o tocar datos de otra empresa. La
  app se conecta siempre como el rol `app_user` (no superusuario, no dueño de
  las tablas) para que RLS se aplique de verdad; cada transacción autenticada
  fija `app.current_user_id` (ver `src/lib/db/index.ts`), que es lo que leen
  las políticas a través de `auth_uid()`.
- **Cursos como catálogo compartido:** `empresa_id` nulo = curso global; con
  valor = curso privado de esa empresa.
- **Inscripción libre:** un colaborador puede matricularse él mismo en
  cualquier curso publicado que pueda ver (global o de su empresa). La
  asignación forzada por `admin_empresa`/`superadmin` se conserva como
  capacidad adicional.
- **Autorización centralizada** en funciones `SECURITY DEFINER`
  (`auth_rol`, `auth_empresa_id`, `puede_ver_curso`, `puede_editar_curso`)
  para evitar recursión en las políticas.
- **Sesión propia:** JWT de corta duración (1 día) en cookie httpOnly,
  firmado con `JWT_SECRET`. El middleware solo lee el JWT (rápido, sin ir a
  la base); `obtenerSesion()` (usada en Server Components/Actions) sí
  vuelve a consultar el `profile`, así que un rol cambiado o una cuenta
  desactivada tienen efecto inmediato ahí.
- **Mutaciones vía Server Actions** con validación Zod compartida
  cliente/servidor.
