-- Migration 047: Fix formateur_suivi role to target gh_* tables
-- La migration 046 ciblait par erreur les tables sans préfixe (vr_sessions, etc.)
-- qui appartiennent à Lovable. Cette migration corrige pour cibler les tables
-- gh_* utilisées par l'app GitHub GMassignee.

-- 1. La fonction has_formateur_role() et l'enum formateur_suivi sont OK (déjà créés en 046)
--    Pas de changement nécessaire pour ces éléments.

-- 2. Supprimer les policies INCORRECTES créées sur les tables sans préfixe
--    (si elles existent et que ces tables existent dans le projet partagé)

-- Tables sessions sans préfixe (tables Lovable, PAS GitHub app)
DROP POLICY IF EXISTS "Formateurs can read all sessions" ON public.vr_sessions;
DROP POLICY IF EXISTS "Formateurs can read all session steps" ON public.session_steps;
DROP POLICY IF EXISTS "Formateurs can read all session sales" ON public.session_sales;
DROP POLICY IF EXISTS "Formateurs read all session media" ON public.session_media;

-- Tables formation sans préfixe (tables Lovable, PAS GitHub app)
DROP POLICY IF EXISTS "Formateurs can manage fiches" ON public.procedure_fiches;
DROP POLICY IF EXISTS "Formateurs manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Formateurs read all validations" ON public.fiche_validations;
DROP POLICY IF EXISTS "Formateurs can manage checklist fiche links" ON public.checklist_template_fiches;
DROP POLICY IF EXISTS "Formateurs can manage session step fiche links" ON public.session_step_fiches;
DROP POLICY IF EXISTS "Formateurs can manage checklist templates" ON public.checklist_templates;
DROP POLICY IF EXISTS "Formateurs can read all check-ins" ON public.gm_checkins;
DROP POLICY IF EXISTS "Formateurs can read all completions" ON public.checklist_completions;
DROP POLICY IF EXISTS "Formateurs can manage parcours fiches" ON public.parcours_fiches;
DROP POLICY IF EXISTS "Formateurs can manage step fiches" ON public.step_fiches;


-- 3. Créer/remplacer les policies CORRECTES sur les tables gh_* (GitHub app)

-- gh_vr_sessions: formateurs peuvent lire toutes les sessions
DROP POLICY IF EXISTS "Admins can read all sessions" ON public.gh_vr_sessions;
CREATE POLICY "Formateurs can read all sessions"
  ON public.gh_vr_sessions FOR SELECT
  USING (public.has_formateur_role());

-- gh_session_steps: formateurs peuvent lire toutes les étapes
DROP POLICY IF EXISTS "Admins can read all session steps" ON public.gh_session_steps;
CREATE POLICY "Formateurs can read all session steps"
  ON public.gh_session_steps FOR SELECT
  USING (public.has_formateur_role());

-- gh_session_sales: formateurs peuvent lire toutes les ventes
DROP POLICY IF EXISTS "Admins can read all session sales" ON public.gh_session_sales;
CREATE POLICY "Formateurs can read all session sales"
  ON public.gh_session_sales FOR SELECT
  USING (public.has_formateur_role());

-- gh_session_media: formateurs peuvent lire tous les médias
DROP POLICY IF EXISTS "Admins read all session media" ON public.gh_session_media;
CREATE POLICY "Formateurs read all session media"
  ON public.gh_session_media FOR SELECT
  USING (public.has_formateur_role());


-- 4. Créer/remplacer les policies sur les tables gh_* de formation

-- gh_procedure_fiches: formateurs peuvent tout gérer (CRUD)
DROP POLICY IF EXISTS "Admins can manage fiches" ON public.gh_procedure_fiches;
CREATE POLICY "Formateurs can manage fiches"
  ON public.gh_procedure_fiches FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- gh_quiz_questions: formateurs peuvent tout gérer
DROP POLICY IF EXISTS "Admins manage quiz questions" ON public.gh_quiz_questions;
CREATE POLICY "Formateurs manage quiz questions"
  ON public.gh_quiz_questions FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- gh_fiche_validations: formateurs peuvent lire toutes les validations
DROP POLICY IF EXISTS "Admins read all validations" ON public.gh_fiche_validations;
CREATE POLICY "Formateurs read all validations"
  ON public.gh_fiche_validations FOR SELECT
  USING (public.has_formateur_role());

-- gh_checklist_template_fiches: formateurs peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage checklist fiche links" ON public.gh_checklist_template_fiches;
CREATE POLICY "Formateurs can manage checklist fiche links"
  ON public.gh_checklist_template_fiches FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- gh_session_step_fiches: formateurs peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage session step fiche links" ON public.gh_session_step_fiches;
CREATE POLICY "Formateurs can manage session step fiche links"
  ON public.gh_session_step_fiches FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- gh_checklist_templates: formateurs peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage checklist templates" ON public.gh_checklist_templates;
CREATE POLICY "Formateurs can manage checklist templates"
  ON public.gh_checklist_templates FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- gh_gm_checkins: formateurs peuvent lire tous les pointages
DROP POLICY IF EXISTS "Admins can read all check-ins" ON public.gh_gm_checkins;
CREATE POLICY "Formateurs can read all check-ins"
  ON public.gh_gm_checkins FOR SELECT
  USING (public.has_formateur_role());

-- gh_checklist_completions: formateurs peuvent lire toutes les complétions
DROP POLICY IF EXISTS "Admins can read all completions" ON public.gh_checklist_completions;
CREATE POLICY "Formateurs can read all completions"
  ON public.gh_checklist_completions FOR SELECT
  USING (public.has_formateur_role());

-- gh_parcours_fiches: formateurs peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage parcours fiches" ON public.gh_parcours_fiches;
CREATE POLICY "Formateurs can manage parcours fiches"
  ON public.gh_parcours_fiches FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- gh_step_fiches: formateurs peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage step fiches" ON public.gh_step_fiches;
CREATE POLICY "Formateurs can manage step fiches"
  ON public.gh_step_fiches FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());


-- 5. Remplacer les fonctions RPC INCORRECTES (sans préfixe) par les CORRECTES (avec gh_)

-- IMPORTANT: Les fonctions sans préfixe créées en 046 peuvent casser Lovable.
-- On les supprime et on crée les bonnes avec préfixe gh_.

DROP FUNCTION IF EXISTS public.admin_delete_session(uuid);
DROP FUNCTION IF EXISTS public.list_gm_profiles();
DROP FUNCTION IF EXISTS public.set_session_flag_reviewed(uuid, boolean);


-- gh_admin_delete_session: formateurs peuvent supprimer les sessions GitHub app
CREATE OR REPLACE FUNCTION public.gh_admin_delete_session(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_steps int;
  v_sales int;
  v_media int;
BEGIN
  IF NOT public.has_formateur_role() THEN
    RAISE EXCEPTION 'Réservé aux administrateurs et formateurs' USING errcode = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.gh_vr_sessions WHERE id = p_session_id) THEN
    RAISE EXCEPTION 'Session introuvable' USING errcode = 'P0002';
  END IF;

  SELECT count(*) INTO v_steps FROM public.gh_session_steps WHERE session_id = p_session_id;
  SELECT count(*) INTO v_sales FROM public.gh_session_sales WHERE session_id = p_session_id;
  SELECT count(*) INTO v_media FROM public.gh_session_media WHERE session_id = p_session_id;

  DELETE FROM public.gh_session_steps WHERE session_id = p_session_id;
  DELETE FROM public.gh_session_sales WHERE session_id = p_session_id;
  DELETE FROM public.gh_session_media WHERE session_id = p_session_id;
  UPDATE public.gh_bug_sessions SET vr_session_id = null WHERE vr_session_id = p_session_id;
  DELETE FROM public.gh_vr_sessions WHERE id = p_session_id;

  RETURN jsonb_build_object('steps', v_steps, 'sales', v_sales, 'media', v_media);
END;
$$;

REVOKE ALL ON FUNCTION public.gh_admin_delete_session(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.gh_admin_delete_session(uuid) TO authenticated;


-- gh_list_gm_profiles: formateurs peuvent lister les profils
CREATE OR REPLACE FUNCTION public.gh_list_gm_profiles()
RETURNS TABLE (gm_id uuid, display_name text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_formateur_role() THEN
    RAISE EXCEPTION 'Réservé aux administrateurs et formateurs' USING errcode = '42501';
  END IF;
  RETURN QUERY
  SELECT
    u.id,
    COALESCE(u.raw_user_meta_data ->> 'full_name', u.email, u.id::text),
    u.email::text
  FROM auth.users u
  ORDER BY 2;
END;
$$;

GRANT EXECUTE ON FUNCTION public.gh_list_gm_profiles() TO authenticated;


-- gh_set_session_flag_reviewed: formateurs peuvent marquer les sessions comme revues
CREATE OR REPLACE FUNCTION public.gh_set_session_flag_reviewed(p_session_id uuid, p_reviewed boolean)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_at timestamptz;
BEGIN
  IF NOT public.has_formateur_role() THEN
    RAISE EXCEPTION 'Réservé aux administrateurs et formateurs' USING errcode = '42501';
  END IF;
  
  v_at := CASE WHEN p_reviewed THEN now() ELSE null END;
  UPDATE public.gh_vr_sessions
     SET flag_reviewed_at = v_at,
         flag_reviewed_by = CASE WHEN p_reviewed THEN auth.uid() ELSE null END
   WHERE id = p_session_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable' USING errcode = 'P0002';
  END IF;
  
  RETURN v_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.gh_set_session_flag_reviewed(uuid, boolean) TO authenticated;


-- 6. Documentation
COMMENT ON FUNCTION public.gh_admin_delete_session IS
  'Supprime une session gh_vr_sessions et ses dépendances (steps, sales, media).
   Réservé aux admins et formateurs (has_formateur_role). Les fichiers storage
   doivent être supprimés AVANT d''appeler cette fonction.';

COMMENT ON FUNCTION public.gh_list_gm_profiles IS
  'Liste tous les profils GM (auth.users) avec display_name et email.
   Réservé aux admins et formateurs (has_formateur_role).';

COMMENT ON FUNCTION public.gh_set_session_flag_reviewed IS
  'Marque une session gh_vr_sessions comme revue (flag_reviewed_at, flag_reviewed_by).
   Réservé aux admins et formateurs (has_formateur_role).';
