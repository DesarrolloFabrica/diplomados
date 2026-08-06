-- Prueba: insertar UN solo curso (sin módulos/lecciones/recursos)
-- autor_id en NULL para no depender de profiles en Cloud SQL
-- ON CONFLICT DO NOTHING: no sobrescribe si ya existe

INSERT INTO public.cursos (
  id, titulo, slug, descripcion, objetivo, imagen_portada_url,
  duracion_estimada_min, nivel_dificultad, categoria_id, estado, autor_id,
  porcentaje_aprobacion, max_intentos, navegacion, es_diplomado, empresa_id,
  created_at, updated_at, deleted_at
) VALUES (
  '6ace5efa-0afc-4c25-acc5-a4e255b2c5f8',
  'DIPLOMADO EN CONSTRUCCIÓN DE PAZ',
  'diplomado-en-construccion-de-paz',
  'El curso de Construcción de Paz tiene como objetivo principal desarrollar enfoques educativos que promuevan la tolerancia, el diálogo intercultural, el respeto por los derechos humanos, la resolución no violenta de conflictos y la inclusión social.',
  'Formar profesionales comprometidos con la promoción de la paz y la equidad en sus comunidades.',
  NULL,
  5760,
  'intermedio'::public.nivel_dificultad,
  NULL,
  'borrador'::public.estado_curso,
  NULL,
  70.00,
  3,
  'libre'::public.tipo_navegacion,
  true,
  NULL,
  '2026-07-30 15:51:18.27281+00'::timestamptz,
  '2026-07-30 17:06:52.183675+00'::timestamptz,
  NULL
) ON CONFLICT (id) DO NOTHING;

SELECT id, titulo, slug, estado FROM public.cursos WHERE slug = 'diplomado-en-construccion-de-paz';
