-- Placeholder fiches (Julien, 2026-11-03): Novasphère is still being designed,
-- Schoolcrafter has no GM procedure yet. Scoped to their game (migration 015).

INSERT INTO public.procedure_fiches (category, title, summary, content_steps, is_placeholder, tags, is_active, is_required, scope_kind, sort_order)
SELECT 'procedure_deroulement', '🚧 Procédure Novasphère (à compléter)',
  'Déroulement d''une partie Novasphère à l''Usine de Chandoline (en cours d''élaboration).',
  '[{"order":1,"text":"🚧 Procédure en cours d''élaboration — à compléter"}]'::jsonb,
  true, ARRAY['novasphere','chandoline'], true, true, 'games',
  COALESCE((SELECT max(sort_order) FROM public.procedure_fiches WHERE category = 'procedure_deroulement' AND deleted_at IS NULL), 0) + 10
WHERE NOT EXISTS (SELECT 1 FROM public.procedure_fiches WHERE title = '🚧 Procédure Novasphère (à compléter)' AND deleted_at IS NULL);

INSERT INTO public.procedure_fiches (category, title, summary, content_steps, is_placeholder, tags, is_active, is_required, scope_kind, sort_order)
SELECT 'procedure_deroulement', '🚧 Procédure GM Schoolcrafter (à compléter)',
  'Procédure GM pour Schoolcrafter au VR Center (pas encore de document).',
  '[{"order":1,"text":"🚧 Procédure GM à compléter"}]'::jsonb,
  true, ARRAY['schoolcrafter','vr'], true, true, 'games',
  COALESCE((SELECT max(sort_order) FROM public.procedure_fiches WHERE category = 'procedure_deroulement' AND deleted_at IS NULL), 0) + 20
WHERE NOT EXISTS (SELECT 1 FROM public.procedure_fiches WHERE title = '🚧 Procédure GM Schoolcrafter (à compléter)' AND deleted_at IS NULL);

INSERT INTO public.fiche_scope_games (fiche_id, game_id)
SELECT f.id, g.id FROM public.procedure_fiches f JOIN public.games g ON g.slug = 'usine_chandoline'
WHERE f.title = '🚧 Procédure Novasphère (à compléter)' AND f.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.fiche_scope_games (fiche_id, game_id)
SELECT f.id, g.id FROM public.procedure_fiches f JOIN public.games g ON g.slug = 'schoolcrafter'
WHERE f.title = '🚧 Procédure GM Schoolcrafter (à compléter)' AND f.deleted_at IS NULL
ON CONFLICT DO NOTHING;
