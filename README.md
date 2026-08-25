# Plataforma de Formación Autoguiada — CUN

Plataforma web **multiempresa (SaaS)** para capacitar colaboradores con cursos y diplomados autoguiados. Inspirada en la lógica de un LMS como Moodle, pero más simple y directa.

Desarrollada para la **Corporación Unificada Nacional de Educación Superior (CUN)**.

---

## Tabla de contenidos

- [Descripción general](#descripción-general)
- [Características principales](#características-principales)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Roles y paneles](#roles-y-paneles)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Requisitos previos](#requisitos-previos)
- [Instalación local](#instalación-local)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos](#base-de-datos)
- [Primer usuario (superadmin)](#primer-usuario-superadmin)
- [Scripts disponibles](#scripts-disponibles)
- [Despliegue (CI/CD)](#despliegue-cicd)
- [Seguridad](#seguridad)
- [Licencia](#licencia)

---

## Descripción general

La plataforma permite que distintas empresas gestionen la formación de sus colaboradores desde un mismo sistema, con **aislamiento de datos por empresa** (Row Level Security en PostgreSQL).

Cada empresa puede:

- Tener cursos propios o acceder a un catálogo global.
- Inscribir y dar seguimiento a colaboradores.
- Consultar reportes de progreso.

Los colaboradores avanzan por una **ruta de aprendizaje visual** (roadmap), completan lecciones, recursos multimedia y evaluaciones con reintentos configurables.

---

## Características principales

| Módulo | Funcionalidad |
|--------|---------------|
| **Autenticación** | Login, recuperación y restablecimiento de contraseña (JWT + cookie httpOnly) |
| **Superadmin** | Gestión de empresas, usuarios, cursos globales y reportes consolidados |
| **Admin empresa** | Colaboradores, asignaciones y reportes por empresa |
| **Instructor** | CRUD de cursos, módulos, lecciones, recursos (GCS/Drive/enlaces) y evaluaciones (importación GIFT) |
| **Colaborador** | Catálogo de cursos, inscripción libre, roadmap de progreso, lecciones y evaluaciones |
| **Contenidos** | Texto, video, PDF, audio, presentaciones, imágenes y embeds (YouTube, Google Drive, Adobe InDesign) |
| **Almacenamiento** | Google Cloud Storage con URLs firmadas para archivos privados |
| **Correo** | SendGrid para invitaciones y recuperación de contraseña |

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Server Actions, Drizzle ORM, Zod, React Hook Form |
| Base de datos | PostgreSQL 16 (Cloud SQL en producción) |
| Autenticación | JWT (`jose`) + bcrypt, sesión deslizante en middleware |
| Archivos | Google Cloud Storage |
| Correo | SendGrid |
| Gráficos | Recharts |
| Infraestructura | Google Cloud Run, Artifact Registry, GitHub Actions |
| Local | Docker Compose (Postgres), Cloud SQL Auth Proxy (opcional) |

---

## Arquitectura

Monorepo **npm workspaces** con dos paquetes. Next.js sigue siendo el runtime único en producción (no hay API REST separada).

```
┌─────────────────────────────────────────────────────────┐
│                    Cloud Run (producción)                │
│  ┌───────────────────────────────────────────────────┐  │
│  │              frontend/ (Next.js 15)               │  │
│  │   Páginas · Componentes · Middleware · API routes │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │ importa                       │
│  ┌───────────────────────▼───────────────────────────┐  │
│  │         backend/ (@plataforma/backend)              │  │
│  │   Server Actions · Queries · DB · Auth · Storage  │  │
│  └───────────────────────┬───────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │  PostgreSQL (Cloud SQL) │
              │  + Google Cloud Storage │
              └─────────────────────────┘
```

---

## Roles y paneles

| Rol | Panel de inicio | Permisos |
|-----|-----------------|----------|
| `superadmin` | `/admin` | Acceso total: empresas, usuarios, cursos, reportes globales |
| `admin_empresa` | `/empresa` | Gestión de su empresa: colaboradores, asignaciones, reportes |
| `instructor` | `/instructor` | Creación y edición de cursos, módulos, lecciones y evaluaciones |
| `colaborador` | `/mis-cursos` | Consumo de cursos, progreso y evaluaciones |

El **middleware** bloquea el acceso cruzado entre paneles según el rol del usuario autenticado.

---

## Estructura del repositorio

```
diplomados/
├── backend/                    # Lógica de servidor (@plataforma/backend)
│   ├── db/
│   │   ├── migrations/         # Migraciones SQL (esquema, RLS, funciones)
│   │   └── docker-init/        # Init script para Postgres local
│   └── src/
│       ├── server/
│       │   ├── actions/        # Mutaciones (Server Actions)
│       │   └── queries/        # Consultas de lectura
│       ├── lib/
│       │   ├── db/             # Drizzle ORM, pool, schema
│       │   ├── auth/           # JWT, cookies, sesión, contraseñas
│       │   ├── storage/        # Google Cloud Storage
│       │   ├── email/          # SendGrid
│       │   └── validators/     # Esquemas Zod
│       ├── config/roles.ts
│       └── types/
├── frontend/                   # Aplicación Next.js
│   ├── public/                 # Assets estáticos
│   └── src/
│       ├── app/
│       │   ├── (auth)/         # Login, recuperar/restablecer clave
│       │   ├── (superadmin)/   # Panel /admin
│       │   ├── (empresa)/      # Panel /empresa
│       │   ├── (instructor)/   # Panel /instructor
│       │   ├── (estudiante)/   # Panel /mis-cursos
│       │   └── api/            # API routes (p. ej. proxy imágenes Drive)
│       ├── components/         # UI (shadcn) y componentes compartidos
│       ├── config/             # Navegación por rol
│       ├── lib/                # Utilidades de UI (media, roadmap, imágenes)
│       └── middleware.ts       # Protección de rutas y sesión
├── .github/workflows/          # CI (lint, typecheck, build) y deploy a Cloud Run
├── docker-compose.yml          # Postgres local para desarrollo
├── Dockerfile                  # Imagen de producción
├── .env.example                # Plantilla de variables de entorno
└── package.json                # Scripts del monorepo (workspaces)
```

---

## Requisitos previos

- **Node.js** 20 o superior
- **npm** 10+
- **Docker** (opcional, para Postgres local con `docker compose`)
- **gcloud CLI** (para producción y Cloud Storage local)
- Cuenta de **Google Cloud Platform** con Cloud SQL, GCS y Cloud Run configurados

---

## Instalación local

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/haiderbellocun/diplomados.git
cd diplomados
npm install
```

### 2. Configurar entorno

```bash
cp .env.example .env
# Edita .env con tus credenciales (ver sección Variables de entorno)
```

> El archivo `.env` vive en la **raíz del monorepo** y es compartido por frontend y backend.

### 3. Levantar Postgres local (opcional)

```bash
docker compose up -d
```

Postgres queda disponible en `localhost:5433` (usuario `postgres`, contraseña `dev_postgres_password`, base `plataforma_formacion`).

Ajusta `DATABASE_URL` y `MIGRATIONS_DATABASE_URL` en `.env` apuntando al puerto **5433**.

### 4. Aplicar migraciones

```bash
npm run db:migrate
```

### 5. Iniciar la aplicación

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Sin sesión activa redirige a `/login`.

---

## Variables de entorno

Copia `.env.example` a `.env` en la raíz del proyecto:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión de la app (rol `app_user`, sujeto a RLS) |
| `MIGRATIONS_DATABASE_URL` | Conexión privilegiada solo para migraciones (rol `postgres`) |
| `JWT_SECRET` | Secreto para firmar tokens de sesión (`openssl rand -base64 48`) |
| `NEXT_PUBLIC_SITE_URL` | URL base de la app (enlaces de recuperación de contraseña) |
| `GCS_BUCKET` | Bucket privado de Google Cloud Storage |
| `SENDGRID_API_KEY` | API key de SendGrid |
| `SENDGRID_FROM_EMAIL` | Remitente de correos transaccionales |

Para **Cloud Storage en local**:

```bash
gcloud auth application-default login
```

En **Cloud Run**, las credenciales se obtienen automáticamente de la cuenta de servicio del servicio.

---

## Base de datos

- **Motor:** PostgreSQL 16
- **ORM:** Drizzle (schema en `backend/src/lib/db/schema.ts`)
- **Migraciones:** archivos SQL en `backend/db/migrations/`, aplicados con `npm run db:migrate`
- **Seguridad:** Row Level Security (RLS) con aislamiento por `empresa_id`
- **Roles de conexión:**
  - `postgres` — solo migraciones (dueño del esquema)
  - `app_user` — conexión de la aplicación en runtime (RLS activo)

Explorar datos visualmente:

```bash
npm run db:studio
```

---

## Primer usuario (superadmin)

No hay auto-registro. El primer usuario se crea directamente en la base de datos:

```sql
INSERT INTO public.profiles (email, password_hash, rol, nombre_completo)
VALUES (
  'admin@tuempresa.com',
  -- Genera el hash: node -e "console.log(require('bcryptjs').hashSync('tu-clave', 12))"
  '$2a$12$...',
  'superadmin',
  'Nombre del Superadmin'
);
```

Los demás roles (`admin_empresa`, `instructor`, `colaborador`) se gestionan desde la interfaz de administración e incluyen `empresa_id` cuando aplica.

---

## Scripts disponibles

Ejecutar desde la **raíz del monorepo**:

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (`http://localhost:3000`) |
| `npm run build` | Build de producción |
| `npm run start` | Servir el build compilado |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación de tipos (frontend + backend) |
| `npm run db:migrate` | Aplicar migraciones SQL pendientes |
| `npm run db:studio` | Explorador visual Drizzle Studio |

---

## Despliegue (CI/CD)

La rama **`main`** es producción. Al hacer merge a `main`:

1. **CI** (`.github/workflows/ci.yml`) — lint, typecheck y build en cada Pull Request.
2. **Deploy** (`.github/workflows/deploy.yml`) — construye imagen Docker, la sube a Artifact Registry y despliega en **Cloud Run**.

### Secrets y variables en GitHub Actions

**Secrets:**

| Nombre | Descripción |
|--------|-------------|
| `GCP_SA_KEY` | JSON de la service account de deploy |
| `DATABASE_URL` | URL de conexión (Secret Manager en Cloud Run) |
| `JWT_SECRET` | Secreto JWT (Secret Manager en Cloud Run) |

**Variables:**

| Nombre | Descripción |
|--------|-------------|
| `INSTANCE_CONNECTION_NAME` | Conexión Cloud SQL (`proyecto:region:instancia`) |
| `GCS_BUCKET` | Nombre del bucket de archivos |
| `NEXT_PUBLIC_SITE_URL` | URL pública de la app |

### Deploy manual (solo depuración)

```bash
docker build -t diplomados .
# Subir a Artifact Registry y desplegar con gcloud run deploy
```

---

## Seguridad

- **Aislamiento multiempresa** mediante RLS en PostgreSQL; cada transacción autenticada fija `app.current_user_id` para que las políticas apliquen correctamente.
- **Dos roles de BD:** migraciones con `postgres`, runtime con `app_user` (sujeto a RLS).
- **Sesión JWT** en cookie httpOnly (1 día, renovación deslizante en middleware).
- **Autorización por rol** en middleware y Server Actions (`requerirRol`, `requerirSesion`).
- **Validación Zod** compartida entre formularios cliente y Server Actions.
- **Archivos privados** servidos con URLs firmadas de GCS; imágenes de Drive via proxy interno.

---

## Licencia

Proyecto privado — Corporación Unificada Nacional de Educación Superior (CUN).  
Todos los derechos reservados.
