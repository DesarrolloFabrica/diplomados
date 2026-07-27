-- ============================================================
-- 008 — Tipo de recurso "audio"
-- El material real de los diplomados incluye podcasts en mp3 junto a
-- documento/infografía/presentación/video para cada lección; el enum
-- original no contemplaba audio.
-- ============================================================

alter type public.tipo_recurso add value if not exists 'audio';
