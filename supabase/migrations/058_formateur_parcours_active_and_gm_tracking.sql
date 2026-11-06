-- Migration 058 : case Active des parcours + Suivi des validations par compétences
-- À coller dans l'éditeur SQL Lovable / Supabase dnxyidnkmtrmkxucqrry.
-- Idempotent. Ne pas publier Lovable.
--
-- BUG 1 : gh_parcours / gh_parcours_steps n'ont jamais reçu has_formateur_role()
-- (047 n'a couvert que gh_parcours_fiches / gh_step_fiches). Un formateur_suivi
-- peut LIRE les étapes (policy authenticated SELECT) mais un UPDATE RLS avec
-- is_admin() matche 0 ligne, sans erreur PostgREST → la case Active revient.
--
-- BUG 2 : RPC batch user_id (auth.users) → gh_games.id[] via le même pont RH
-- que gh_get_authorized_game_ids (profiles.gm_id → gm_game_competencies →
-- gh_game_rh_map). Le client élargit ensuite au circuit (competenceFilter.ts).

-- ============================================================================
-- 1. Colonne is_active (déjà là si 018 a été appliqué sur les tables gh_*)
-- ============================================================================

ALTER TABLE public.gh_parcours_steps
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.gh_parcours_steps
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.gh_parcours_steps
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- ============================================================================
-- 2. RLS : admins ET formateurs peuvent écrire les parcours / étapes
-- ============================================================================

DROP POLICY IF EXISTS "Admins manage parcours" ON public.gh_parcours;
DROP POLICY IF EXISTS "Admins can manage parcours" ON public.gh_parcours;
DROP POLICY IF EXISTS "Formateurs can manage parcours" ON public.gh_parcours;
DROP POLICY IF EXISTS "Formateurs manage parcours" ON public.gh_parcours;

CREATE POLICY "Formateurs can manage parcours"
  ON public.gh_parcours FOR ALL TO authenticated
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

DROP POLICY IF EXISTS "Admins manage parcours_steps" ON public.gh_parcours_steps;
DROP POLICY IF EXISTS "Admins can manage parcours_steps" ON public.gh_parcours_steps;
DROP POLICY IF EXISTS "Formateurs can manage parcours_steps" ON public.gh_parcours_steps;
DROP POLICY IF EXISTS "Formateurs manage parcours_steps" ON public.gh_parcours_steps;

CREATE POLICY "Formateurs can manage parcours_steps"
  ON public.gh_parcours_steps FOR ALL TO authenticated
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gh_parcours, public.gh_parcours_steps TO authenticated;

COMMENT ON POLICY "Formateurs can manage parcours" ON public.gh_parcours IS
  'Admins + formateur_suivi (has_formateur_role) peuvent éditer les parcours GitHub app.';
COMMENT ON POLICY "Formateurs can manage parcours_steps" ON public.gh_parcours_steps IS
  'Admins + formateur_suivi peuvent activer/désactiver et éditer les étapes de parcours.';

-- ============================================================================
-- 3. RPC : compétences RH → gh_games.id[] pour chaque compte (Suivi éditeur)
--    Même sémantique que gh_get_authorized_game_ids(p_user_id) :
--      formateur/admin → NULL (pas de filtre, comme leur vue Formations)
--      0 compétence / pas de profil GM → {}
--      sinon → ids mappés (le client élargit au circuit)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gh_list_gm_authorized_game_ids()
RETURNS TABLE (user_id uuid, game_ids uuid[])
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_formateur_role() THEN
    RAISE EXCEPTION 'Réservé aux administrateurs et formateurs' USING errcode = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    CASE
      WHEN public.has_formateur_role(u.id) THEN NULL::uuid[]
      ELSE (
        SELECT COALESCE(
          ARRAY_AGG(DISTINCT m.gh_games_id) FILTER (WHERE m.gh_games_id IS NOT NULL),
          ARRAY[]::uuid[]
        )
        FROM public.profiles p
        LEFT JOIN public.gm_game_competencies c ON c.gm_id = p.gm_id
        LEFT JOIN public.gh_game_rh_map m ON m.games_id = c.game_id
        WHERE p.user_id = u.id
      )
    END AS game_ids
  FROM auth.users u;
END;
$$;

COMMENT ON FUNCTION public.gh_list_gm_authorized_game_ids() IS
  'Pour le Suivi des validations : user_id (auth.users) → gh_games.id[] via profiles.gm_id,
   gm_game_competencies et gh_game_rh_map. NULL = formateur/admin (pas de filtre).
   {} = 0 compétence. Réservé à has_formateur_role. Même pont que gh_get_authorized_game_ids.';

GRANT EXECUTE ON FUNCTION public.gh_list_gm_authorized_game_ids() TO authenticated;

-- ============================================================================
-- 4. Vérifications (après collage)
-- ============================================================================
-- SELECT polname, cmd, qual, with_check
-- FROM pg_policy
-- WHERE polrelid IN ('public.gh_parcours'::regclass, 'public.gh_parcours_steps'::regclass);
--
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'gh_parcours_steps'
--   AND column_name IN ('is_active', 'sort_order', 'deleted_at');
--
-- -- Doit renvoyer des tableaux différents selon les compétences RH (pas tous identiques) :
-- SELECT u.email, x.game_ids
-- FROM public.gh_list_gm_authorized_game_ids() x
-- JOIN auth.users u ON u.id = x.user_id
-- ORDER BY u.email
-- LIMIT 20;
