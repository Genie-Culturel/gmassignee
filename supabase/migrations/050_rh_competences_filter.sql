-- Migration 050: RH Compétences Filter
-- Filter formations/suivi fiches based on LIVE Lovable RH compétences (gm_game_competencies).
-- Only show fiches for games where the GM has at least one compétence.
-- Formateurs and admins see everything (no filter).

-- ============================================================================
-- LIVE RH TABLES (already exist in Lovable Supabase dnxyidnkmtrmkxucqrry)
-- ============================================================================
-- DO NOT CREATE — these already exist:
--   - public.games: RH jeux (Lovable)
--   - public.game_masters: RH GMs
--   - public.gm_game_competencies: gm_id → games.id, competency_level 1-6
--   - public.profiles: user_id (auth.users) → gm_id (game_masters.id)
--   - public.gh_games: training/GitHub jeux (different naming/granularity)
--
-- Identity bridge: auth.uid() → profiles.gm_id → gm_game_competencies
-- No FK between games and gh_games (names differ: e.g. Serviteur I/II vs serviteur)
--
-- Arsenii example (test case):
--   - auth user_id: 21cf641a-32f9-440c-9188-143cd823865b
--   - game_masters gm_id: e9401281-1167-4f61-8cb6-6eb53d0d98e3
--   - Compétences: RAVE 1, Serviteur I 4, Serviteur II 4, SAGA 4
--   - Should see: Serviteur + SAGA fiches (+ all/locations), NOT Feu Sacré/Da Vinci

-- ============================================================================
-- 1. Mapping table: Lovable RH games → gh_games (training fiches)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gh_game_rh_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  games_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  gh_games_id uuid NOT NULL REFERENCES public.gh_games(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(games_id, gh_games_id)
);

COMMENT ON TABLE public.gh_game_rh_map IS
  'Maps Lovable RH games to gh_games for compétence filtering. Many-to-many: e.g. Serviteur I + II (2 games rows) → serviteur (1 gh_games row).';

CREATE INDEX IF NOT EXISTS idx_gh_game_rh_map_games_id ON public.gh_game_rh_map (games_id);
CREATE INDEX IF NOT EXISTS idx_gh_game_rh_map_gh_games_id ON public.gh_game_rh_map (gh_games_id);

-- RLS: readable by authenticated
ALTER TABLE public.gh_game_rh_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read gh_game_rh_map" ON public.gh_game_rh_map;
CREATE POLICY "Authenticated read gh_game_rh_map"
  ON public.gh_game_rh_map FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Formateurs manage gh_game_rh_map" ON public.gh_game_rh_map;
CREATE POLICY "Formateurs manage gh_game_rh_map"
  ON public.gh_game_rh_map FOR ALL TO authenticated
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

GRANT SELECT ON public.gh_game_rh_map TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gh_game_rh_map TO authenticated;

-- ============================================================================
-- 2. Seed mapping: known RH games → gh_games
-- ============================================================================

-- Resolve by matching game names/slugs (names differ; must document gaps)
-- Serviteur: RH has separate I and II; gh_games has one "serviteur"
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Serviteur I → serviteur (Le Serviteur 1 & 2)'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE g.name ILIKE '%Serviteur%Rédemption%I%'
  AND ghg.slug = 'serviteur'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Serviteur II → serviteur (Le Serviteur 1 & 2)'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE g.name ILIKE '%Serviteur%Rédemption%II%'
  AND ghg.slug = 'serviteur'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- SAGA: likely matches exactly
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'SAGA → saga'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE (g.name ILIKE '%SAGA%' OR g.name ILIKE '%SR I%II%')
  AND ghg.slug = 'saga'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- Planta
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Planta → planta'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE g.name ILIKE '%Planta%'
  AND ghg.slug = 'planta'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- Schoolcrafter
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Schoolcrafter → schoolcrafter'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE g.name ILIKE '%Schoolcrafter%'
  AND ghg.slug = 'schoolcrafter'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- Usine de Chandoline
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Usine Chandoline → usine_chandoline'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE g.name ILIKE '%Chandoline%'
  AND ghg.slug = 'usine_chandoline'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- Da Vinci (Escape Life Sion)
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Da Vinci → davinci'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE g.name ILIKE '%Da%Vinci%'
  AND ghg.slug = 'davinci'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- Le Feu Sacré (Escape Life Sierre)
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Feu Sacré → feux_sacres'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE (g.name ILIKE '%Feu%Sacré%' OR g.name ILIKE '%Feux%sacré%')
  AND ghg.slug = 'feux_sacres'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- RAVE: exists in public.games but NOT in gh_games → no mapping (expected gap)
-- Document: GMs with only RAVE compétence will see no game-scoped fiches (only all/locations)

COMMENT ON TABLE public.gh_game_rh_map IS
  'Known gaps: RAVE has no gh_games entry (no training fiches for RAVE exist yet).
   Serviteur I + II (2 RH rows) both map to serviteur (1 gh_games row).';

-- ============================================================================
-- 3. Helper function: Get authorized gh_games IDs for the current user
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gh_get_authorized_game_ids(p_user_id uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gm_id uuid;
  v_game_ids uuid[];
BEGIN
  -- Formateurs/admins see everything → return NULL (no filter)
  IF public.has_formateur_role(p_user_id) THEN
    RETURN NULL;
  END IF;

  -- Resolve auth user → game_masters.id via profiles
  SELECT p.gm_id INTO v_gm_id
  FROM public.profiles p
  WHERE p.user_id = p_user_id;

  IF v_gm_id IS NULL THEN
    -- No GM profile → no competences → return empty array (hide all game-scoped fiches)
    RETURN ARRAY[]::uuid[];
  END IF;

  -- Get gh_games.id via: gm_game_competencies → games → gh_game_rh_map → gh_games
  SELECT ARRAY_AGG(DISTINCT m.gh_games_id)
  INTO v_game_ids
  FROM public.gm_game_competencies c
  INNER JOIN public.gh_game_rh_map m ON m.games_id = c.game_id
  WHERE c.gm_id = v_gm_id;

  -- If no competences or no mapped games, return empty array
  RETURN COALESCE(v_game_ids, ARRAY[]::uuid[]);
END;
$$;

COMMENT ON FUNCTION public.gh_get_authorized_game_ids(uuid) IS
  'Returns gh_games.id array for which the GM (via profiles.gm_id → gm_game_competencies → gh_game_rh_map) has a compétence.
   Returns NULL for formateurs/admins (no filter). Returns [] if no competences or unmapped games.
   
   Test case (Arsenii):
     user_id 21cf641a-32f9-440c-9188-143cd823865b → gm_id e9401281-... → compétences Serviteur I/II + SAGA
     Expected: [serviteur.id, saga.id] (from gh_games)';

GRANT EXECUTE ON FUNCTION public.gh_get_authorized_game_ids(uuid) TO authenticated;

-- ============================================================================
-- 4. Documentation
-- ============================================================================

-- Verify the mapping worked (run after migration):
-- SELECT g.name AS rh_game, ghg.name AS training_game, m.notes
-- FROM public.gh_game_rh_map m
-- INNER JOIN public.games g ON g.id = m.games_id
-- INNER JOIN public.gh_games ghg ON ghg.id = m.gh_games_id
-- ORDER BY g.name;

-- Test Arsenii's authorized games (expects serviteur + saga):
-- SELECT public.gh_get_authorized_game_ids('21cf641a-32f9-440c-9188-143cd823865b'::uuid);

-- Arsenii's competences (should return 4 rows: RAVE 1, Serviteur I 4, Serviteur II 4, SAGA 4):
-- SELECT g.name, c.competency_level
-- FROM public.gm_game_competencies c
-- INNER JOIN public.games g ON g.id = c.game_id
-- WHERE c.gm_id = 'e9401281-1167-4f61-8cb6-6eb53d0d98e3'
-- ORDER BY g.name;
