-- ============================================================
-- 006 — Row Level Security
-- Regla de oro: la base de datos es la última barrera. Ningún usuario
-- puede leer o escribir datos de otra empresa aunque manipule peticiones.
-- Requiere que la app se conecte como `app_user` (ver 005) y fije
-- `app.current_user_id` en cada transacción (ver src/lib/db/index.ts).
-- ============================================================

alter table public.empresas               enable row level security;
alter table public.profiles               enable row level security;
alter table public.categorias             enable row level security;
alter table public.cursos                 enable row level security;
alter table public.modulos                enable row level security;
alter table public.unidades               enable row level security;
alter table public.lecciones              enable row level security;
alter table public.recursos               enable row level security;
alter table public.evaluaciones           enable row level security;
alter table public.preguntas              enable row level security;
alter table public.opciones_respuesta     enable row level security;
alter table public.inscripciones          enable row level security;
alter table public.progreso_lecciones     enable row level security;
alter table public.intentos_evaluacion    enable row level security;
alter table public.respuestas_participante enable row level security;
alter table public.historial_actividad    enable row level security;

-- ── empresas ────────────────────────────────────────────────
create policy "empresas_select" on public.empresas for select to app_user
  using (public.auth_rol() = 'superadmin' or id = public.auth_empresa_id());
create policy "empresas_insert" on public.empresas for insert to app_user
  with check (public.auth_rol() = 'superadmin');
create policy "empresas_update" on public.empresas for update to app_user
  using (public.auth_rol() = 'superadmin') with check (public.auth_rol() = 'superadmin');
create policy "empresas_delete" on public.empresas for delete to app_user
  using (public.auth_rol() = 'superadmin');

-- ── profiles ────────────────────────────────────────────────
create policy "profiles_select" on public.profiles for select to app_user
  using (
    id = public.auth_uid()
    or public.auth_rol() = 'superadmin'
    or (public.auth_rol() in ('admin_empresa', 'instructor')
        and empresa_id = public.auth_empresa_id())
  );
create policy "profiles_update" on public.profiles for update to app_user
  using (
    id = public.auth_uid()
    or public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'admin_empresa' and empresa_id = public.auth_empresa_id())
  )
  with check (
    id = public.auth_uid()
    or public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'admin_empresa' and empresa_id = public.auth_empresa_id())
  );
-- Alta de usuarios: la hace la app en una transacción autenticada como
-- superadmin/admin_empresa (ya no hay trigger sobre auth.users).
create policy "profiles_insert" on public.profiles for insert to app_user
  with check (
    public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'admin_empresa' and empresa_id = public.auth_empresa_id())
  );

-- ── categorias ──────────────────────────────────────────────
create policy "categorias_select" on public.categorias for select to app_user
  using (deleted_at is null);
create policy "categorias_write" on public.categorias for all to app_user
  using (public.auth_rol() in ('superadmin', 'instructor'))
  with check (public.auth_rol() in ('superadmin', 'instructor'));

-- ── cursos ──────────────────────────────────────────────────
create policy "cursos_select" on public.cursos for select to app_user
  using (public.puede_ver_curso(id));
create policy "cursos_insert" on public.cursos for insert to app_user
  with check (
    public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'instructor' and autor_id = public.auth_uid())
  );
create policy "cursos_update" on public.cursos for update to app_user
  using (public.puede_editar_curso(id))
  with check (public.puede_editar_curso(id));
create policy "cursos_delete" on public.cursos for delete to app_user
  using (public.puede_editar_curso(id));

-- ── modulos / unidades / lecciones / recursos ───────────────
-- Ver: si puede ver el curso. Escribir: si puede editar el curso.

create policy "modulos_select" on public.modulos for select to app_user
  using (public.puede_ver_curso(curso_id));
create policy "modulos_write" on public.modulos for all to app_user
  using (public.puede_editar_curso(curso_id))
  with check (public.puede_editar_curso(curso_id));

create policy "unidades_select" on public.unidades for select to app_user
  using (public.puede_ver_curso(public.curso_de_modulo(modulo_id)));
create policy "unidades_write" on public.unidades for all to app_user
  using (public.puede_editar_curso(public.curso_de_modulo(modulo_id)))
  with check (public.puede_editar_curso(public.curso_de_modulo(modulo_id)));

create policy "lecciones_select" on public.lecciones for select to app_user
  using (public.puede_ver_curso(public.curso_de_unidad(unidad_id)));
create policy "lecciones_write" on public.lecciones for all to app_user
  using (public.puede_editar_curso(public.curso_de_unidad(unidad_id)))
  with check (public.puede_editar_curso(public.curso_de_unidad(unidad_id)));

create policy "recursos_select" on public.recursos for select to app_user
  using (public.puede_ver_curso(public.curso_de_leccion(leccion_id)));
create policy "recursos_write" on public.recursos for all to app_user
  using (public.puede_editar_curso(public.curso_de_leccion(leccion_id)))
  with check (public.puede_editar_curso(public.curso_de_leccion(leccion_id)));

-- ── evaluaciones / preguntas / opciones ─────────────────────

create policy "evaluaciones_select" on public.evaluaciones for select to app_user
  using (public.puede_ver_curso(curso_id));
create policy "evaluaciones_write" on public.evaluaciones for all to app_user
  using (public.puede_editar_curso(curso_id))
  with check (public.puede_editar_curso(curso_id));

create policy "preguntas_select" on public.preguntas for select to app_user
  using (public.puede_ver_curso(public.curso_de_evaluacion(evaluacion_id)));
create policy "preguntas_write" on public.preguntas for all to app_user
  using (public.puede_editar_curso(public.curso_de_evaluacion(evaluacion_id)))
  with check (public.puede_editar_curso(public.curso_de_evaluacion(evaluacion_id)));

-- Las opciones no exponen si son correctas al colaborador desde el cliente;
-- eso se controla en la capa de datos (la calificación ocurre en el servidor).
create policy "opciones_select" on public.opciones_respuesta for select to app_user
  using (public.puede_ver_curso(public.curso_de_evaluacion(public.evaluacion_de_pregunta(pregunta_id))));
create policy "opciones_write" on public.opciones_respuesta for all to app_user
  using (public.puede_editar_curso(public.curso_de_evaluacion(public.evaluacion_de_pregunta(pregunta_id))))
  with check (public.puede_editar_curso(public.curso_de_evaluacion(public.evaluacion_de_pregunta(pregunta_id))));

-- ── inscripciones ───────────────────────────────────────────
-- Inscripción libre: un colaborador puede matricularse él mismo en
-- cualquier curso que pueda ver (publicado, global o de su empresa).
-- La asignación por admin_empresa/superadmin se conserva como capacidad
-- adicional (asignado_por queda null en la autoinscripción).
create policy "inscripciones_select" on public.inscripciones for select to app_user
  using (
    public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'admin_empresa' and empresa_id = public.auth_empresa_id())
    or (public.auth_rol() = 'instructor' and public.puede_editar_curso(curso_id))
    or profile_id = public.auth_uid()
  );
create policy "inscripciones_insert" on public.inscripciones for insert to app_user
  with check (
    public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'admin_empresa' and empresa_id = public.auth_empresa_id())
    or (
      profile_id = public.auth_uid()
      and empresa_id = public.auth_empresa_id()
      and public.puede_ver_curso(curso_id)
    )
  );
create policy "inscripciones_update" on public.inscripciones for update to app_user
  using (
    public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'admin_empresa' and empresa_id = public.auth_empresa_id())
    or profile_id = public.auth_uid()
  )
  with check (
    public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'admin_empresa' and empresa_id = public.auth_empresa_id())
    or profile_id = public.auth_uid()
  );
create policy "inscripciones_delete" on public.inscripciones for delete to app_user
  using (
    public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'admin_empresa' and empresa_id = public.auth_empresa_id())
    or profile_id = public.auth_uid()
  );

-- ── progreso_lecciones ──────────────────────────────────────
create policy "progreso_select" on public.progreso_lecciones for select to app_user
  using (
    public.auth_rol() = 'superadmin'
    or (public.auth_rol() in ('admin_empresa', 'instructor') and empresa_id = public.auth_empresa_id())
    or public.es_mi_inscripcion(inscripcion_id)
  );
create policy "progreso_write" on public.progreso_lecciones for all to app_user
  using (
    public.auth_rol() = 'superadmin'
    or (empresa_id = public.auth_empresa_id() and public.es_mi_inscripcion(inscripcion_id))
  )
  with check (
    public.auth_rol() = 'superadmin'
    or (empresa_id = public.auth_empresa_id() and public.es_mi_inscripcion(inscripcion_id))
  );

-- ── intentos_evaluacion ─────────────────────────────────────
create policy "intentos_select" on public.intentos_evaluacion for select to app_user
  using (
    public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'admin_empresa' and empresa_id = public.auth_empresa_id())
    or (public.auth_rol() = 'instructor' and public.puede_editar_curso(public.curso_de_evaluacion(evaluacion_id)))
    or profile_id = public.auth_uid()
  );
create policy "intentos_write" on public.intentos_evaluacion for all to app_user
  using (
    public.auth_rol() = 'superadmin'
    or (profile_id = public.auth_uid() and empresa_id = public.auth_empresa_id())
  )
  with check (
    public.auth_rol() = 'superadmin'
    or (profile_id = public.auth_uid() and empresa_id = public.auth_empresa_id())
  );

-- ── respuestas_participante ─────────────────────────────────
create policy "respuestas_select" on public.respuestas_participante for select to app_user
  using (
    public.auth_rol() = 'superadmin'
    or exists (
      select 1 from public.intentos_evaluacion i
      where i.id = intento_id
        and (
          i.profile_id = public.auth_uid()
          or (public.auth_rol() = 'admin_empresa' and i.empresa_id = public.auth_empresa_id())
          or (public.auth_rol() = 'instructor' and public.puede_editar_curso(public.curso_de_evaluacion(i.evaluacion_id)))
        )
    )
  );
create policy "respuestas_write" on public.respuestas_participante for all to app_user
  using (
    public.auth_rol() = 'superadmin'
    or exists (
      select 1 from public.intentos_evaluacion i
      where i.id = intento_id and i.profile_id = public.auth_uid()
    )
  )
  with check (
    public.auth_rol() = 'superadmin'
    or exists (
      select 1 from public.intentos_evaluacion i
      where i.id = intento_id and i.profile_id = public.auth_uid()
    )
  );

-- ── historial_actividad (registro inmutable) ────────────────
create policy "historial_select" on public.historial_actividad for select to app_user
  using (
    public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'admin_empresa' and empresa_id = public.auth_empresa_id())
  );
create policy "historial_insert" on public.historial_actividad for insert to app_user
  with check (profile_id = public.auth_uid());
-- Sin update ni delete: el historial no se modifica.

-- ── password_reset_tokens ────────────────────────────────────
-- Sin RLS: solo la app backend (Server Actions) los crea/lee, nunca se
-- consultan desde el cliente. Mantenemos RLS deshabilitado a propósito
-- porque no hay noción de "usuario actual" antes de autenticar.
