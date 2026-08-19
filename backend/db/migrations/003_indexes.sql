-- ============================================================
-- 003 — Índices
-- Todas las columnas empresa_id se filtran constantemente por RLS,
-- y las FK muy consultadas necesitan índice para joins y listados.
-- ============================================================

-- Identidad
create index idx_profiles_empresa on public.profiles (empresa_id);
create index idx_profiles_rol on public.profiles (rol);

-- Catálogo
create index idx_cursos_categoria on public.cursos (categoria_id);
create index idx_cursos_autor on public.cursos (autor_id);
create index idx_cursos_empresa on public.cursos (empresa_id);
create index idx_cursos_estado on public.cursos (estado);
create index idx_modulos_curso on public.modulos (curso_id);
create index idx_unidades_modulo on public.unidades (modulo_id);
create index idx_lecciones_unidad on public.lecciones (unidad_id);
create index idx_recursos_leccion on public.recursos (leccion_id);

-- Evaluaciones
create index idx_evaluaciones_curso on public.evaluaciones (curso_id);
create index idx_preguntas_evaluacion on public.preguntas (evaluacion_id);
create index idx_opciones_pregunta on public.opciones_respuesta (pregunta_id);

-- Asignación y progreso
create index idx_inscripciones_empresa on public.inscripciones (empresa_id);
create index idx_inscripciones_curso on public.inscripciones (curso_id);
create index idx_inscripciones_profile on public.inscripciones (profile_id);
create index idx_inscripciones_estado on public.inscripciones (estado);
create index idx_progreso_empresa on public.progreso_lecciones (empresa_id);
create index idx_progreso_inscripcion on public.progreso_lecciones (inscripcion_id);
create index idx_intentos_empresa on public.intentos_evaluacion (empresa_id);
create index idx_intentos_inscripcion on public.intentos_evaluacion (inscripcion_id);
create index idx_intentos_profile on public.intentos_evaluacion (profile_id);
create index idx_respuestas_intento on public.respuestas_participante (intento_id);

-- Auditoría
create index idx_historial_empresa on public.historial_actividad (empresa_id);
create index idx_historial_profile on public.historial_actividad (profile_id);
create index idx_historial_fecha on public.historial_actividad (created_at desc);
