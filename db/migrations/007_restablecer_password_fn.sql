-- ============================================================
-- 007 — Bootstrap de restablecimiento de contraseña
-- restablecerClave() ocurre ANTES de autenticar (la persona todavía no
-- tiene sesión), así que RLS bloquearía el update sobre profiles con
-- app.current_user_id sin fijar (auth_uid() = null no matchea ninguna
-- policy de profiles_update). Sin esta función, el update se ejecutaba
-- silenciosamente sobre 0 filas: no fallaba, pero tampoco cambiaba nada.
-- Igual patrón que public.perfil_por_email() para el login.
-- ============================================================

create or replace function public.restablecer_password(p_token_hash text, p_password_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token_id   uuid;
  v_profile_id uuid;
begin
  select id, profile_id into v_token_id, v_profile_id
  from public.password_reset_tokens
  where token_hash = p_token_hash
    and used_at is null
    and expires_at > now();

  if v_token_id is null then
    return false;
  end if;

  update public.profiles set password_hash = p_password_hash where id = v_profile_id;
  update public.password_reset_tokens set used_at = now() where id = v_token_id;

  return true;
end;
$$;

revoke execute on function public.restablecer_password(text, text) from public;
grant execute on function public.restablecer_password(text, text) to app_user;
