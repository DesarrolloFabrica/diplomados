-- ============================================================
-- 005 — Rol de aplicación y permisos
-- Reemplaza el antiguo Access Token Hook de Supabase (ya no aplica: los
-- claims rol/empresa_id ahora los emite la app al firmar el JWT, ver
-- src/lib/auth/jwt.ts).
--
-- Este archivo crea el rol NO superusuario con el que la app se conecta.
-- Es indispensable: en Postgres/Cloud SQL, el dueño de las tablas y los
-- superusuarios NO están sujetos a RLS. Las migraciones se ejecutan con
-- un rol con privilegios (p. ej. el usuario admin de Cloud SQL); la app
-- SIEMPRE se conecta como `app_user` para que las políticas de 006_rls.sql
-- se apliquen de verdad.
--
-- La contraseña de `app_user` se define aparte (ALTER ROLE ... WITH
-- PASSWORD), fuera de este archivo y fuera del control de versiones —
-- normalmente al aprovisionar la instancia, leyendo el valor desde
-- Secret Manager. Ver README para el comando exacto.
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_user') then
    create role app_user with login;
  end if;
end $$;

grant usage on schema public to app_user;
grant select, insert, update, delete on all tables in schema public to app_user;
grant usage, select on all sequences in schema public to app_user;
grant execute on all functions in schema public to app_user;

-- Para que las tablas creadas por migraciones futuras también queden
-- accesibles sin tener que volver a otorgar permisos a mano.
alter default privileges in schema public
  grant select, insert, update, delete on tables to app_user;
alter default privileges in schema public
  grant usage, select on sequences to app_user;
alter default privileges in schema public
  grant execute on functions to app_user;

-- FORCE asegura que RLS se aplique aunque `app_user` termine siendo dueño
-- de alguna tabla (por ejemplo si migró con ese mismo rol por error).
alter table public.empresas                force row level security;
alter table public.profiles                force row level security;
alter table public.categorias              force row level security;
alter table public.cursos                  force row level security;
alter table public.modulos                 force row level security;
alter table public.unidades                force row level security;
alter table public.lecciones               force row level security;
alter table public.recursos                force row level security;
alter table public.evaluaciones            force row level security;
alter table public.preguntas               force row level security;
alter table public.opciones_respuesta      force row level security;
alter table public.inscripciones           force row level security;
alter table public.progreso_lecciones      force row level security;
alter table public.intentos_evaluacion     force row level security;
alter table public.respuestas_participante force row level security;
alter table public.historial_actividad     force row level security;
