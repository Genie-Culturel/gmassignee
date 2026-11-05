-- Migration 050: RH Compétences Filter
-- Filter formations/suivi fiches based on GM's RH Compétences from Lovable
-- Only show fiches for games where the GM has at least one compétence.
-- Formateurs and admins see everything (no filter).

-- ============================================================================
-- 1. RH Tables (may already exist in Lovable; create if not exists)
-- ============================================================================

-- Table: games (RH reference, may be non-prefixed in Lovable)
-- This table lists all games/experiences for which GMs can have compétences.
CREATE TABLE IF NOT EXISTS public.games_rh (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.games_rh IS 
  'RH: Référentiel des jeux/expériences pour les compétences GM (Lovable RH tab).';

-- Table: competences (RH assignments)
-- Each row assigns a GM a compétence for a specific game at a given level.
CREATE TABLE IF NOT EXISTS public.competences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gm_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games_rh(id) ON DELETE CASCADE,
  niveau integer NOT NULL CHECK (niveau >= 1 AND niveau <= 6),
  date_formation timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(gm_id, game_id)
);

COMMENT ON TABLE public.competences IS
  'RH: Compétences GM par jeu. Un GM ne voit que les fiches des jeux pour lesquels il a une compétence.';

CREATE INDEX IF NOT EXISTS idx_competences_gm_id ON public.competences (gm_id);
CREATE INDEX IF NOT EXISTS idx_competences_game_id ON public.competences (game_id);

-- Enable RLS
ALTER TABLE public.games_rh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competences ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can read games_rh
DROP POLICY IF EXISTS "Authenticated read games_rh" ON public.games_rh;
CREATE POLICY "Authenticated read games_rh"
  ON public.games_rh FOR SELECT TO authenticated
  USING (true);

-- Policies: GMs can read their own competences, formateurs/admins can read all
DROP POLICY IF EXISTS "GMs read own competences" ON public.competences;
CREATE POLICY "GMs read own competences"
  ON public.competences FOR SELECT TO authenticated
  USING (gm_id = auth.uid() OR public.has_formateur_role());

-- Policies: only formateurs/admins can manage competences
DROP POLICY IF EXISTS "Formateurs manage competences" ON public.competences;
CREATE POLICY "Formateurs manage competences"
  ON public.competences FOR ALL TO authenticated
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

DROP POLICY IF EXISTS "Formateurs manage games_rh" ON public.games_rh;
CREATE POLICY "Formateurs manage games_rh"
  ON public.games_rh FOR ALL TO authenticated
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

GRANT SELECT ON public.games_rh, public.competences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games_rh, public.competences TO authenticated;

-- ============================================================================
-- 2. Mapping RH games to gh_games
-- ============================================================================

-- Add a mapping column to gh_games to link to RH games
-- This allows flexible name matching even if RH and gh_games use different names
ALTER TABLE public.gh_games
  ADD COLUMN IF NOT EXISTS rh_game_id uuid REFERENCES public.games_rh(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gh_games_rh_game_id ON public.gh_games (rh_game_id);

COMMENT ON COLUMN public.gh_games.rh_game_id IS
  'Link to RH games table for compétence filtering. When set, fiches scoped to this game require the GM to have a compétence for the linked RH game.';

-- ============================================================================
-- 3. Seed RH games (match existing gh_games structure)
-- ============================================================================

-- Insert RH games matching the structure in migration 015
INSERT INTO public.games_rh (slug, name) VALUES
  ('rave', 'RAVE'),
  ('serviteur_redemption_1', 'Serviteur de la Rédemption I'),
  ('serviteur_redemption_2', 'Serviteur de la Rédemption II'),
  ('saga', 'SAGA - SR I & II'),
  ('planta', 'Planta'),
  ('le_feu_sacre', 'Le Feu Sacré (Escape Life)'),
  ('davinci', 'Da Vinci'),
  ('usine_chandoline', 'Usine de Chandoline'),
  ('schoolcrafter', 'Schoolcrafter')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name;

-- Link gh_games to RH games by matching slugs/names
-- This creates a robust mapping between the two systems

-- VR Center games
UPDATE public.gh_games SET rh_game_id = (SELECT id FROM public.games_rh WHERE slug = 'planta')
WHERE slug = 'planta';

UPDATE public.gh_games SET rh_game_id = (SELECT id FROM public.games_rh WHERE slug = 'serviteur_redemption_1')
WHERE slug = 'serviteur' AND name ILIKE '%Serviteur%';

UPDATE public.gh_games SET rh_game_id = (SELECT id FROM public.games_rh WHERE slug = 'saga')
WHERE slug = 'saga';

UPDATE public.gh_games SET rh_game_id = (SELECT id FROM public.games_rh WHERE slug = 'schoolcrafter')
WHERE slug = 'schoolcrafter';

-- Chandoline
UPDATE public.gh_games SET rh_game_id = (SELECT id FROM public.games_rh WHERE slug = 'usine_chandoline')
WHERE slug = 'usine_chandoline';

-- Escape Life games
UPDATE public.gh_games SET rh_game_id = (SELECT id FROM public.games_rh WHERE slug = 'davinci')
WHERE slug = 'davinci';

UPDATE public.gh_games SET rh_game_id = (SELECT id FROM public.games_rh WHERE slug = 'le_feu_sacre')
WHERE slug = 'feux_sacres';

-- ============================================================================
-- 4. Helper function: Get authorized game IDs for a GM
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gh_get_authorized_game_ids(p_gm_id uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Return all gh_games.id where the GM has a compétence for the linked RH game
  -- If the GM is a formateur/admin, return NULL (meaning no filter)
  SELECT CASE
    WHEN public.has_formateur_role(p_gm_id) THEN NULL
    ELSE ARRAY(
      SELECT DISTINCT g.id
      FROM public.gh_games g
      INNER JOIN public.competences c ON c.game_id = g.rh_game_id
      WHERE c.gm_id = p_gm_id
    )
  END;
$$;

COMMENT ON FUNCTION public.gh_get_authorized_game_ids(uuid) IS
  'Returns array of gh_games.id for which the GM has a compétence, or NULL for formateurs/admins (no filter).';

GRANT EXECUTE ON FUNCTION public.gh_get_authorized_game_ids(uuid) TO authenticated;

-- ============================================================================
-- 5. Documentation
-- ============================================================================

COMMENT ON COLUMN public.competences.niveau IS '1-6: niveau de compétence du GM pour ce jeu';
COMMENT ON COLUMN public.competences.date_formation IS 'Date de la formation initiale';

-- ============================================================================
-- 6. Example data for testing (optional, can be removed in production)
-- ============================================================================

-- Example: Assign some compétences for testing
-- Uncomment and customize with real GM user IDs after migration

-- INSERT INTO public.competences (gm_id, game_id, niveau, date_formation) VALUES
--   ((SELECT id FROM auth.users WHERE email = 'arsenii.nedorezov@gmail.com'), 
--    (SELECT id FROM public.games_rh WHERE slug = 'serviteur_redemption_1'), 
--    4, 
--    '2026-01-15'),
--   ((SELECT id FROM auth.users WHERE email = 'arsenii.nedorezov@gmail.com'), 
--    (SELECT id FROM public.games_rh WHERE slug = 'saga'), 
--    4, 
--    '2026-02-20')
-- ON CONFLICT (gm_id, game_id) DO NOTHING;
