-- Locations, games, and fiche scopes (all / locations / games).
-- Additive only. Existing fiches default to Virtual Reality Center.

CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short_name text NOT NULL,
  kind text NOT NULL DEFAULT 'vr',
  sort_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_games_location_id ON public.games (location_id);

ALTER TABLE public.procedure_fiches
  ADD COLUMN IF NOT EXISTS scope_kind text NOT NULL DEFAULT 'all';

ALTER TABLE public.procedure_fiches
  DROP CONSTRAINT IF EXISTS procedure_fiches_scope_kind_check;
ALTER TABLE public.procedure_fiches
  ADD CONSTRAINT procedure_fiches_scope_kind_check
  CHECK (scope_kind IN ('all', 'locations', 'games'));

COMMENT ON COLUMN public.procedure_fiches.scope_kind IS
  'all = every venue; locations = one or more venues; games = one or more games.';

CREATE TABLE IF NOT EXISTS public.fiche_scope_locations (
  fiche_id uuid NOT NULL REFERENCES public.procedure_fiches(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  PRIMARY KEY (fiche_id, location_id)
);

CREATE TABLE IF NOT EXISTS public.fiche_scope_games (
  fiche_id uuid NOT NULL REFERENCES public.procedure_fiches(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  PRIMARY KEY (fiche_id, game_id)
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiche_scope_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiche_scope_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read locations" ON public.locations;
CREATE POLICY "Authenticated read locations"
  ON public.locations FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage locations" ON public.locations;
CREATE POLICY "Admins manage locations"
  ON public.locations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated read games" ON public.games;
CREATE POLICY "Authenticated read games"
  ON public.games FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage games" ON public.games;
CREATE POLICY "Admins manage games"
  ON public.games FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated read fiche_scope_locations" ON public.fiche_scope_locations;
CREATE POLICY "Authenticated read fiche_scope_locations"
  ON public.fiche_scope_locations FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage fiche_scope_locations" ON public.fiche_scope_locations;
CREATE POLICY "Admins manage fiche_scope_locations"
  ON public.fiche_scope_locations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated read fiche_scope_games" ON public.fiche_scope_games;
CREATE POLICY "Authenticated read fiche_scope_games"
  ON public.fiche_scope_games FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage fiche_scope_games" ON public.fiche_scope_games;
CREATE POLICY "Admins manage fiche_scope_games"
  ON public.fiche_scope_games FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.locations, public.games, public.fiche_scope_locations, public.fiche_scope_games TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations, public.games, public.fiche_scope_locations, public.fiche_scope_games TO authenticated;

INSERT INTO public.locations (slug, name, short_name, kind, sort_index) VALUES
  ('vr_center', 'Virtual Reality Center', 'VR Center', 'vr', 1),
  ('chandoline', 'Usine de Chandoline', 'Chandoline', 'xr', 2),
  ('escape_sion', 'Escape Life Sion', 'Sion', 'outdoor', 3),
  ('escape_sierre', 'Escape Life Sierre', 'Sierre', 'outdoor', 4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  kind = EXCLUDED.kind,
  sort_index = EXCLUDED.sort_index;

INSERT INTO public.games (location_id, slug, name, sort_index)
SELECT l.id, v.slug, v.name, v.sort_index
FROM public.locations l
JOIN (VALUES
  ('vr_center', 'planta', 'Planta', 1),
  ('vr_center', 'serviteur', 'Serviteur', 2),
  ('vr_center', 'saga', 'Saga', 3),
  ('vr_center', 'schoolcrafter', 'Schoolcrafter', 4),
  ('chandoline', 'usine_chandoline', 'Usine de Chandoline', 1),
  ('escape_sion', 'davinci', 'Davinci', 1),
  ('escape_sierre', 'feux_sacres', 'Feux sacrés', 1)
) AS v(location_slug, slug, name, sort_index) ON v.location_slug = l.slug
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  location_id = EXCLUDED.location_id,
  sort_index = EXCLUDED.sort_index;

-- Existing content comes from the VR Center (skip already-scoped rows).
UPDATE public.procedure_fiches
SET scope_kind = 'locations'
WHERE deleted_at IS NULL
  AND scope_kind = 'all'
  AND title NOT IN (
    'Règles générales GM',
    'Accueil Usine de Chandoline',
    '🚧 Lancement Usine de Chandoline',
    'Briefing Davinci',
    'Briefing Feux sacrés'
  )
  AND NOT EXISTS (SELECT 1 FROM public.fiche_scope_locations s WHERE s.fiche_id = procedure_fiches.id)
  AND NOT EXISTS (SELECT 1 FROM public.fiche_scope_games s WHERE s.fiche_id = procedure_fiches.id);

INSERT INTO public.fiche_scope_locations (fiche_id, location_id)
SELECT f.id, l.id
FROM public.procedure_fiches f
CROSS JOIN public.locations l
WHERE l.slug = 'vr_center'
  AND f.deleted_at IS NULL
  AND f.scope_kind = 'locations'
  AND NOT EXISTS (SELECT 1 FROM public.fiche_scope_locations s WHERE s.fiche_id = f.id)
ON CONFLICT DO NOTHING;

-- Game-specific launch fiches already in the library.
UPDATE public.procedure_fiches SET scope_kind = 'games'
WHERE deleted_at IS NULL AND (
  title ILIKE '%Lancement de la Planta%'
  OR title ILIKE '%Lancement de la Saga%'
  OR title ILIKE '%Lancement du Serviteur%'
);

DELETE FROM public.fiche_scope_locations fl
USING public.procedure_fiches f
WHERE fl.fiche_id = f.id AND f.scope_kind = 'games';

INSERT INTO public.fiche_scope_games (fiche_id, game_id)
SELECT f.id, g.id
FROM public.procedure_fiches f
JOIN public.games g ON g.slug = 'planta'
WHERE f.title ILIKE '%Lancement de la Planta%' AND f.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.fiche_scope_games (fiche_id, game_id)
SELECT f.id, g.id
FROM public.procedure_fiches f
JOIN public.games g ON g.slug = 'saga'
WHERE f.title ILIKE '%Lancement de la Saga%' AND f.deleted_at IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.fiche_scope_games (fiche_id, game_id)
SELECT f.id, g.id
FROM public.procedure_fiches f
JOIN public.games g ON g.slug = 'serviteur'
WHERE f.title ILIKE '%Lancement du Serviteur%' AND f.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- Example fiches for the other venues (placeholders).
INSERT INTO public.procedure_fiches (category, title, summary, content_steps, is_placeholder, tags, is_active, is_required, scope_kind)
SELECT 'procedure_deroulement', 'Accueil Usine de Chandoline',
  'Accueil des visiteurs à l''Usine de Chandoline (à compléter).',
  '[{"order":1,"text":"🚧 Accueil et briefing XR — à documenter"}]'::jsonb,
  true, ARRAY['chandoline','accueil'], true, true, 'locations'
WHERE NOT EXISTS (SELECT 1 FROM public.procedure_fiches WHERE title = 'Accueil Usine de Chandoline');

INSERT INTO public.fiche_scope_locations (fiche_id, location_id)
SELECT f.id, l.id
FROM public.procedure_fiches f
JOIN public.locations l ON l.slug = 'chandoline'
WHERE f.title = 'Accueil Usine de Chandoline'
ON CONFLICT DO NOTHING;

INSERT INTO public.procedure_fiches (category, title, summary, content_steps, is_placeholder, tags, is_active, is_required, scope_kind)
SELECT 'formation_technique', '🚧 Lancement Usine de Chandoline',
  'Lancement du jeu XR Usine de Chandoline (à compléter).',
  '[{"order":1,"text":"🚧 Procédure de lancement XR — à documenter"}]'::jsonb,
  true, ARRAY['chandoline','lancement'], true, true, 'games'
WHERE NOT EXISTS (SELECT 1 FROM public.procedure_fiches WHERE title = '🚧 Lancement Usine de Chandoline');

INSERT INTO public.fiche_scope_games (fiche_id, game_id)
SELECT f.id, g.id
FROM public.procedure_fiches f
JOIN public.games g ON g.slug = 'usine_chandoline'
WHERE f.title = '🚧 Lancement Usine de Chandoline'
ON CONFLICT DO NOTHING;

INSERT INTO public.procedure_fiches (category, title, summary, content_steps, is_placeholder, tags, is_active, is_required, scope_kind)
SELECT 'procedure_deroulement', 'Briefing Davinci',
  'Briefing du jeu extérieur Davinci à Escape Life Sion (à compléter).',
  '[{"order":1,"text":"🚧 Briefing Davinci — à documenter"}]'::jsonb,
  true, ARRAY['davinci','sion'], true, true, 'games'
WHERE NOT EXISTS (SELECT 1 FROM public.procedure_fiches WHERE title = 'Briefing Davinci');

INSERT INTO public.fiche_scope_games (fiche_id, game_id)
SELECT f.id, g.id
FROM public.procedure_fiches f
JOIN public.games g ON g.slug = 'davinci'
WHERE f.title = 'Briefing Davinci'
ON CONFLICT DO NOTHING;

INSERT INTO public.procedure_fiches (category, title, summary, content_steps, is_placeholder, tags, is_active, is_required, scope_kind)
SELECT 'procedure_deroulement', 'Briefing Feux sacrés',
  'Briefing du jeu extérieur Feux sacrés à Escape Life Sierre (à compléter).',
  '[{"order":1,"text":"🚧 Briefing Feux sacrés — à documenter"}]'::jsonb,
  true, ARRAY['feux-sacres','sierre'], true, true, 'games'
WHERE NOT EXISTS (SELECT 1 FROM public.procedure_fiches WHERE title = 'Briefing Feux sacrés');

INSERT INTO public.fiche_scope_games (fiche_id, game_id)
SELECT f.id, g.id
FROM public.procedure_fiches f
JOIN public.games g ON g.slug = 'feux_sacres'
WHERE f.title = 'Briefing Feux sacrés'
ON CONFLICT DO NOTHING;

INSERT INTO public.procedure_fiches (category, title, summary, content_steps, is_placeholder, tags, is_active, is_required, scope_kind)
SELECT 'formation_technique', 'Règles générales GM',
  'Règles communes à tous les lieux (à compléter).',
  '[{"order":1,"text":"S''appliquer à tous les sites : sécurité, posture, communication."}]'::jsonb,
  true, ARRAY['general','tous-lieux'], true, true, 'all'
WHERE NOT EXISTS (SELECT 1 FROM public.procedure_fiches WHERE title = 'Règles générales GM');
