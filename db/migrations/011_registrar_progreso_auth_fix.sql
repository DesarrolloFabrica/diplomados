-- ============================================================
-- 011 — Fix auth_uid() dentro de registrar_progreso_leccion
-- En algunos contextos SECURITY DEFINER, auth_uid() puede quedar
-- null aunque conSesion() haya fijado app.current_user_id. Validamos
-- la inscripción por id y solo exigimos coincidencia de profile cuando
-- auth_uid() sí está disponible.
-- ============================================================

create or replace function public.registrar_progreso_leccion(
  p_inscripcion_id uuid,
  p_leccion_id uuid,
  p_curso_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_profile_id uuid;
  v_empresa_id uuid;
  v_total integer;
  v_completadas integer;
  v_porcentaje numeric(5, 2);
  v_estado public.estado_inscripcion;
begin
  select i.profile_id, i.empresa_id
  into v_profile_id, v_empresa_id
  from public.inscripciones i
  where i.id = p_inscripcion_id
    and i.deleted_at is null;

  if not found or v_empresa_id is null then
    raise exception 'Inscripción no encontrada o no te pertenece';
  end if;

  v_user_id := public.auth_uid();
  if v_user_id is not null and v_user_id != v_profile_id then
    raise exception 'Inscripción no encontrada o no te pertenece';
  end if;

  insert into public.progreso_lecciones (
    inscripcion_id,
    leccion_id,
    empresa_id,
    completada,
    fecha_completado
  )
  values (p_inscripcion_id, p_leccion_id, v_empresa_id, true, now())
  on conflict (inscripcion_id, leccion_id) do update
    set completada = true,
        fecha_completado = now(),
        updated_at = now();

  select count(*)::integer
  into v_total
  from public.lecciones l
  join public.unidades u on u.id = l.unidad_id
  join public.modulos m on m.id = u.modulo_id
  where m.curso_id = p_curso_id
    and l.deleted_at is null
    and u.deleted_at is null
    and m.deleted_at is null;

  select count(*)::integer
  into v_completadas
  from public.progreso_lecciones pl
  join public.lecciones l on l.id = pl.leccion_id
  join public.unidades u on u.id = l.unidad_id
  join public.modulos m on m.id = u.modulo_id
  where pl.inscripcion_id = p_inscripcion_id
    and pl.completada = true
    and m.curso_id = p_curso_id;

  if v_total > 0 then
    v_porcentaje := round((v_completadas::numeric / v_total::numeric) * 100, 2);
  else
    v_porcentaje := 0;
  end if;

  if v_porcentaje >= 100 then
    v_estado := 'finalizado';
  elsif v_porcentaje > 0 then
    v_estado := 'en_progreso';
  else
    v_estado := 'no_iniciado';
  end if;

  update public.inscripciones
  set porcentaje_avance = v_porcentaje,
      estado = v_estado,
      ultima_leccion_id = p_leccion_id,
      updated_at = now()
  where id = p_inscripcion_id;
end;
$$;

revoke execute on function public.registrar_progreso_leccion(uuid, uuid, uuid) from public;
grant execute on function public.registrar_progreso_leccion(uuid, uuid, uuid) to app_user;
