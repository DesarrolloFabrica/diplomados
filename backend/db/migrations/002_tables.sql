-- ============================================================
-- 002 — Tablas del modelo de datos
-- Convención: nombres en español, snake_case. Auditoría en todas las
-- tablas de negocio. Borrado lógico (deleted_at) donde importa el histórico.
-- ============================================================

-- ── Identidad y multiempresa ────────────────────────────────

create table public.empresas (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  nit           text unique,
  logo_url      text,
  estado        public.estado_empresa not null default 'activa',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- Identidad propia (ya no extiende auth.users de Supabase): email +
-- password_hash viven aquí. El login y los tokens JWT los emite la app.
create table public.profiles (
  id               uuid primary key default gen_random_uuid(),
  email            citext not null unique,
  password_hash    text not null,
  empresa_id       uuid references public.empresas (id) on delete restrict,
  rol              public.rol_usuario not null default 'colaborador',
  nombre_completo  text not null,
  cargo            text,
  area             text,
  avatar_url       text,
  activo           boolean not null default true,
  ultimo_acceso    timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  -- El superadmin no pertenece a ninguna empresa; los demás roles sí.
  constraint chk_empresa_por_rol check (
    (rol = 'superadmin' and empresa_id is null)
    or (rol <> 'superadmin' and empresa_id is not null)
  )
);

-- Tokens de un solo uso para restablecer contraseña (reemplaza el flujo
-- de recuperación de Supabase Auth). El correo se envía vía SendGrid.
create table public.password_reset_tokens (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  token_hash   text not null unique,
  expires_at   timestamptz not null,
  used_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- ── Catálogo de contenido ───────────────────────────────────

create table public.categorias (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table public.cursos (
  id                     uuid primary key default gen_random_uuid(),
  titulo                 text not null,
  slug                   text not null unique,
  descripcion            text,
  objetivo               text,
  imagen_portada_url     text,
  duracion_estimada_min  integer check (duracion_estimada_min is null or duracion_estimada_min >= 0),
  nivel_dificultad       public.nivel_dificultad not null default 'basico',
  categoria_id           uuid references public.categorias (id) on delete set null,
  estado                 public.estado_curso not null default 'borrador',
  autor_id               uuid references public.profiles (id) on delete set null,
  porcentaje_aprobacion  numeric(5, 2) not null default 70 check (porcentaje_aprobacion between 0 and 100),
  max_intentos           integer not null default 3 check (max_intentos >= 1),
  navegacion             public.tipo_navegacion not null default 'libre',
  es_diplomado           boolean not null default false,
  -- null = catálogo compartido; con valor = curso privado de esa empresa.
  empresa_id             uuid references public.empresas (id) on delete cascade,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  deleted_at             timestamptz
);

create table public.modulos (
  id          uuid primary key default gen_random_uuid(),
  curso_id    uuid not null references public.cursos (id) on delete cascade,
  titulo      text not null,
  descripcion text,
  orden       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table public.unidades (
  id          uuid primary key default gen_random_uuid(),
  modulo_id   uuid not null references public.modulos (id) on delete cascade,
  titulo      text not null,
  descripcion text,
  orden       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table public.lecciones (
  id                uuid primary key default gen_random_uuid(),
  unidad_id         uuid not null references public.unidades (id) on delete cascade,
  titulo            text not null,
  tipo_contenido    public.tipo_leccion not null default 'texto',
  contenido         jsonb not null default '{}'::jsonb,  -- texto enriquecido / bloques
  orden             integer not null default 0,
  es_obligatoria    boolean not null default true,
  marcado           public.tipo_marcado not null default 'manual',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create table public.recursos (
  id            uuid primary key default gen_random_uuid(),
  leccion_id    uuid not null references public.lecciones (id) on delete cascade,
  tipo          public.tipo_recurso not null,
  nombre        text not null,
  storage_path  text,     -- ruta del objeto en Google Cloud Storage
  url_externa   text,     -- enlace externo (YouTube, sitios, etc.)
  tamano_bytes  bigint check (tamano_bytes is null or tamano_bytes >= 0),
  obligatorio   boolean not null default false,
  orden         integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  -- Debe tener o un archivo en Storage o un enlace externo.
  constraint chk_recurso_origen check (storage_path is not null or url_externa is not null)
);

-- ── Evaluaciones ────────────────────────────────────────────

create table public.evaluaciones (
  id                     uuid primary key default gen_random_uuid(),
  curso_id               uuid not null references public.cursos (id) on delete cascade,
  titulo                 text not null,
  descripcion            text,
  tiempo_limite_min      integer check (tiempo_limite_min is null or tiempo_limite_min > 0),
  max_intentos           integer not null default 3 check (max_intentos >= 1),
  puntaje_minimo         numeric(5, 2) not null default 70 check (puntaje_minimo between 0 and 100),
  preguntas_aleatorias   boolean not null default false,
  num_preguntas_mostrar  integer check (num_preguntas_mostrar is null or num_preguntas_mostrar > 0),
  mostrar_resultados     public.visibilidad_resultados not null default 'al_cerrar',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  deleted_at             timestamptz
);

create table public.preguntas (
  id               uuid primary key default gen_random_uuid(),
  evaluacion_id    uuid not null references public.evaluaciones (id) on delete cascade,
  tipo             public.tipo_pregunta not null,
  enunciado        text not null,
  puntaje          numeric(6, 2) not null default 1 check (puntaje >= 0),
  retroalimentacion text,
  orden            integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table public.opciones_respuesta (
  id                uuid primary key default gen_random_uuid(),
  pregunta_id       uuid not null references public.preguntas (id) on delete cascade,
  texto             text not null,
  es_correcta       boolean not null default false,
  retroalimentacion text,
  orden             integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── Asignación, progreso y auditoría (datos por empresa) ─────

create table public.inscripciones (
  id                 uuid primary key default gen_random_uuid(),
  empresa_id         uuid not null references public.empresas (id) on delete cascade,
  curso_id           uuid not null references public.cursos (id) on delete cascade,
  profile_id         uuid not null references public.profiles (id) on delete cascade,
  -- null = inscripción libre (el propio colaborador se matriculó).
  asignado_por       uuid references public.profiles (id) on delete set null,
  fecha_asignacion   timestamptz not null default now(),
  fecha_limite       timestamptz,
  estado             public.estado_inscripcion not null default 'no_iniciado',
  porcentaje_avance  numeric(5, 2) not null default 0 check (porcentaje_avance between 0 and 100),
  ultima_leccion_id  uuid references public.lecciones (id) on delete set null,
  calificacion_final numeric(5, 2) check (calificacion_final is null or calificacion_final between 0 and 100),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  constraint uq_inscripcion unique (curso_id, profile_id)
);

create table public.progreso_lecciones (
  id               uuid primary key default gen_random_uuid(),
  inscripcion_id   uuid not null references public.inscripciones (id) on delete cascade,
  leccion_id       uuid not null references public.lecciones (id) on delete cascade,
  empresa_id       uuid not null references public.empresas (id) on delete cascade,
  completada       boolean not null default false,
  fecha_completado timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint uq_progreso unique (inscripcion_id, leccion_id)
);

create table public.intentos_evaluacion (
  id             uuid primary key default gen_random_uuid(),
  evaluacion_id  uuid not null references public.evaluaciones (id) on delete cascade,
  inscripcion_id uuid not null references public.inscripciones (id) on delete cascade,
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  empresa_id     uuid not null references public.empresas (id) on delete cascade,
  numero_intento integer not null default 1 check (numero_intento >= 1),
  iniciado_en    timestamptz not null default now(),
  finalizado_en  timestamptz,
  puntaje        numeric(5, 2) check (puntaje is null or puntaje between 0 and 100),
  aprobado       boolean,
  estado         public.estado_intento not null default 'en_curso',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint uq_intento unique (evaluacion_id, profile_id, numero_intento)
);

create table public.respuestas_participante (
  id               uuid primary key default gen_random_uuid(),
  intento_id       uuid not null references public.intentos_evaluacion (id) on delete cascade,
  pregunta_id      uuid not null references public.preguntas (id) on delete cascade,
  opcion_id        uuid references public.opciones_respuesta (id) on delete set null,
  texto_respuesta  text,
  es_correcta      boolean,
  puntaje_obtenido numeric(6, 2) not null default 0,
  created_at       timestamptz not null default now()
);

create table public.historial_actividad (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid references public.empresas (id) on delete set null,
  profile_id  uuid references public.profiles (id) on delete set null,
  accion      text not null,
  entidad     text,
  entidad_id  uuid,
  detalle     jsonb not null default '{}'::jsonb,
  ip          inet,
  created_at  timestamptz not null default now()
);
