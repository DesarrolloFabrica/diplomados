-- ============================================================
-- 013 - Preferencia de variante visual por usuario
-- La variante visual es independiente del tema de color (light/dark).
-- Usuarios existentes pueden permanecer con NULL; la app resuelve NULL
-- como la experiencia creativa actual hasta completar el onboarding.
-- ============================================================

alter table public.profiles
  add column interface_variant varchar(32),
  add column interface_onboarding_completed_at timestamptz,
  add constraint chk_profiles_interface_variant check (
    interface_variant is null
    or interface_variant in ('creative', 'business', 'educational', 'gamified')
  );
