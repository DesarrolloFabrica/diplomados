-- ============================================================
-- 004 — Funciones auxiliares y triggers
-- Los helpers de autorización son SECURITY DEFINER: leen la jerarquía
-- sin quedar sujetos a RLS, evitando recursión en las políticas.
-- ============================================================

-- ── updated_at automático ───────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in
    select table_name
    from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format(
      'create trigger trg_%1$s_updated_at
         before update on public.%1$I
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ── Identidad del usuario actual ─────────────────────────────
-- Ya no hay auth.uid() de Supabase (eso lo resolvía PostgREST leyendo el
-- JWT). Aquí la app abre cada conexión/transacción y ejecuta
-- `select set_config('app.current_user_id', '<uuid>', true)` justo
-- después de autenticar la petición (ver lib/db/index.ts). Esta función
-- solo lee esa variable de sesión.

create or replace function public.auth_uid()
returns uuid
language sql stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- ── Contexto del usuario actual (basado en su profile) ──────

create or replace function public.auth_rol()
returns public.rol_usuario
language sql stable security definer set search_path = public
as $$
  select rol from public.profiles where id = public.auth_uid();
$$;

create or replace function public.auth_empresa_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select empresa_id from public.profiles where id = public.auth_uid();
$$;

-- ── Resolución de la jerarquía académica ────────────────────

create or replace function public.curso_de_modulo(p_id uuid)
returns uuid language sql stable security definer set search_path = public
as $$ select curso_id from public.modulos where id = p_id; $$;

create or replace function public.curso_de_unidad(p_id uuid)
returns uuid language sql stable security definer set search_path = public
as $$
  select m.curso_id
  from public.unidades u
  join public.modulos m on m.id = u.modulo_id
  where u.id = p_id;
$$;

create or replace function public.curso_de_leccion(p_id uuid)
returns uuid language sql stable security definer set search_path = public
as $$
  select m.curso_id
  from public.lecciones l
  join public.unidades u on u.id = l.unidad_id
  join public.modulos m on m.id = u.modulo_id
  where l.id = p_id;
$$;

create or replace function public.evaluacion_de_pregunta(p_id uuid)
returns uuid language sql stable security definer set search_path = public
as $$ select evaluacion_id from public.preguntas where id = p_id; $$;

create or replace function public.curso_de_evaluacion(p_id uuid)
returns uuid language sql stable security definer set search_path = public
as $$ select curso_id from public.evaluaciones where id = p_id; $$;

-- ── Permisos sobre cursos ───────────────────────────────────

create or replace function public.puede_ver_curso(p_curso_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.cursos c
    where c.id = p_curso_id
      and c.deleted_at is null
      and (
        public.auth_rol() = 'superadmin'
        or c.autor_id = public.auth_uid()
        or (
          c.estado = 'publicado'
          and (c.empresa_id is null or c.empresa_id = public.auth_empresa_id())
        )
      )
  );
$$;

create or replace function public.puede_editar_curso(p_curso_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.cursos c
    where c.id = p_curso_id
      and (public.auth_rol() = 'superadmin' or c.autor_id = public.auth_uid())
  );
$$;

-- ── Propiedad de una inscripción por el colaborador ─────────

create or replace function public.es_mi_inscripcion(p_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.inscripciones i
    where i.id = p_id and i.profile_id = public.auth_uid()
  );
$$;

-- ── Bootstrap de autenticación ───────────────────────────────
-- Antes de autenticar a alguien no existe todavía un app.current_user_id,
-- así que RLS bloquearía cualquier select directo sobre profiles (ver
-- policy profiles_select en 006_rls.sql). Esta función, SECURITY DEFINER,
-- es la única puerta para leer credenciales por email durante
-- login/recuperación de clave (usada por src/server/actions/auth.ts).
create or replace function public.perfil_por_email(p_email citext)
returns table (
  id uuid,
  password_hash text,
  rol public.rol_usuario,
  empresa_id uuid,
  nombre_completo text,
  activo boolean,
  deleted_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select id, password_hash, rol, empresa_id, nombre_completo, activo, deleted_at
  from public.profiles
  where email = p_email;
$$;
