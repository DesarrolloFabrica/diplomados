-- Inscripciones demo para Cloud SQL (plataforma_formacion)
-- Ejecutar como postgres en Cloud SQL Studio, o importar con gcloud sql import.

ALTER TABLE public.inscripciones DISABLE ROW LEVEL SECURITY;

INSERT INTO inscripciones (id, curso_id, profile_id, empresa_id, estado)
SELECT
  gen_random_uuid(),
  c.id,
  p.id,
  p.empresa_id,
  'no_iniciado'
FROM profiles p
CROSS JOIN cursos c
WHERE p.deleted_at IS NULL
  AND p.empresa_id IS NOT NULL
  AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM inscripciones i
    WHERE i.curso_id = c.id
      AND i.profile_id = p.id
  );

ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;
