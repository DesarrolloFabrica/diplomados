-- ============================================================
-- 001 — Extensiones y tipos enum
-- ============================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "citext";         -- correos case-insensitive

-- Roles del sistema.
create type public.rol_usuario as enum (
  'superadmin',
  'admin_empresa',
  'instructor',
  'colaborador'
);

-- Estado de una empresa.
create type public.estado_empresa as enum ('activa', 'inactiva');

-- Estado de un curso en su ciclo de publicación.
create type public.estado_curso as enum ('borrador', 'publicado', 'archivado');

-- Nivel de dificultad.
create type public.nivel_dificultad as enum ('basico', 'intermedio', 'avanzado');

-- Tipo de navegación dentro de un curso.
create type public.tipo_navegacion as enum ('obligatoria', 'libre');

-- Tipo de contenido principal de una lección.
create type public.tipo_leccion as enum ('texto', 'video', 'archivo', 'mixto');

-- Cómo se marca una lección como completada.
create type public.tipo_marcado as enum ('automatico', 'manual');

-- Tipo de recurso adjunto a una lección.
create type public.tipo_recurso as enum ('pdf', 'video', 'imagen', 'presentacion', 'enlace', 'archivo');

-- Tipo de pregunta de una evaluación.
create type public.tipo_pregunta as enum (
  'seleccion_unica',
  'seleccion_multiple',
  'verdadero_falso',
  'respuesta_corta'
);

-- Cuándo mostrar resultados de una evaluación.
create type public.visibilidad_resultados as enum ('inmediato', 'al_cerrar', 'nunca');

-- Estado del participante dentro de un curso.
create type public.estado_inscripcion as enum (
  'no_iniciado',
  'en_progreso',
  'pendiente_evaluacion',
  'aprobado',
  'no_aprobado',
  'finalizado'
);

-- Estado de un intento de evaluación.
create type public.estado_intento as enum ('en_curso', 'finalizado', 'expirado');
