-- ============================================================
-- 012 — Escuela visual del curso
-- Cada curso pertenece a una escuela CUN; el frontend usa este id para
-- paleta, atmósfera y estaciones del roadmap. El valor por defecto
-- cubre cursos ya existentes hasta que se clasifiquen.
-- ============================================================

create type public.escuela_visual as enum (
  'sociales',
  'diseno',
  'ingenieria',
  'salud',
  'empresarial',
  'neutral'
);

alter table public.cursos
  add column escuela public.escuela_visual not null default 'neutral';

create index idx_cursos_escuela on public.cursos (escuela);
