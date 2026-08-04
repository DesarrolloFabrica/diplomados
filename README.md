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

Todo el aprovisionamiento (APIs, Cloud SQL, Artifact Registry, bucket y service
accounts para GitHub Actions) está en
[`infra/provision-gcp.ps1`](infra/provision-gcp.ps1). Es un script de un solo
uso: se ejecuta una vez, no como parte del CI.

```powershell
gcloud auth login
./infra/provision-gcp.ps1
```

Al final imprime los Secrets/Variables que debes cargar en GitHub (ver sección
8) y los pasos manuales pendientes (API key de SendGrid, password de
`app_user` tras migrar).

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

## 8. Despliegue: CI/CD con GitHub Actions

`main` es la rama de producción: **no se le hace push directo**, solo se
actualiza mezclando Pull Requests (branch protection activada, ver más
abajo). Cada vez que un PR se mezcla a `main`, el workflow
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) construye la
imagen, la sube a Artifact Registry y despliega a Cloud Run automáticamente.
Los PRs contra `main` corren primero
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) (lint, typecheck,
build) como chequeo obligatorio.

El desarrollo del día a día ocurre en ramas de feature (o en `Cambios`), que
se abren como PR hacia `main` cuando están listas para producción.

Autenticación de GitHub Actions contra GCP: Service Account con JSON key,
generada por [`infra/provision-gcp.ps1`](infra/provision-gcp.ps1). Ese script
imprime los Secrets y Variables que hay que cargar en **Settings → Secrets and
variables → Actions** del repo:

**Secrets:**
- `GCP_SA_KEY` (contenido completo del JSON de la SA de deploy)

**Variables:**
- `RUNTIME_SERVICE_ACCOUNT`
- `INSTANCE_CONNECTION_NAME`
- `GCS_BUCKET`
- `DB_NAME`
- `NEXT_PUBLIC_SITE_URL` (se conoce tras el primer deploy; actualízala después)

Tras cargar `GCP_SA_KEY` en GitHub, borra el archivo JSON local para no dejar
credenciales en disco.

Para desplegar manualmente sin pasar por CI (solo depuración puntual):

```bash
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/plataforma-formacion/app:latest"
gcloud builds submit --tag "$IMAGE"
gcloud run deploy plataforma-formacion --image="$IMAGE" --region="$REGION"
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
