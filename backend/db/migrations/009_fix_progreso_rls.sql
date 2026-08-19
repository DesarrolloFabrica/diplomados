-- Corrige progreso_write: un colaborador puede registrar avance en su propia
-- inscripción (es_mi_inscripcion), igual que en progreso_select. La política
-- anterior exigía además empresa_id = auth_empresa_id(), lo que fallaba cuando
-- el empresa_id del profile no coincidía con el de la inscripción importada.

drop policy if exists "progreso_write" on public.progreso_lecciones;

create policy "progreso_write" on public.progreso_lecciones for all to app_user
  using (
    public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'admin_empresa' and empresa_id = public.auth_empresa_id())
    or public.es_mi_inscripcion(inscripcion_id)
  )
  with check (
    public.auth_rol() = 'superadmin'
    or (public.auth_rol() = 'admin_empresa' and empresa_id = public.auth_empresa_id())
    or (
      public.es_mi_inscripcion(inscripcion_id)
      and empresa_id = (
        select i.empresa_id
        from public.inscripciones i
        where i.id = inscripcion_id
          and i.deleted_at is null
      )
    )
  );
