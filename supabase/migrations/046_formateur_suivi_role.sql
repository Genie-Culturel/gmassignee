-- Migration 046: Add formateur_suivi role
-- Nouveau rôle « Formateur et suivi sessions » avec les mêmes pouvoirs que admin
-- sur les fonctionnalités sessions et formations uniquement (pas les privilèges Lovable admin).

-- 1. Ajouter la valeur au type enum app_role (projet Lovable partagé)
--    Note: ALTER TYPE ADD VALUE doit être dans sa propre transaction et commit
--    avant d'être utilisé. Si le rôle existe déjà, IF NOT EXISTS évite l'erreur.
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'formateur_suivi';

-- 2. Fonction helper pour vérifier les permissions de formateur
--    Retourne true si l'utilisateur a le rôle 'admin' OU 'formateur_suivi'
CREATE OR REPLACE FUNCTION public.has_formateur_role(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = $1
      AND role IN ('admin', 'formateur_suivi')
  );
$$;

COMMENT ON FUNCTION public.has_formateur_role(uuid) IS
  'True when the user has admin OR formateur_suivi role. Used for session management and formation editing.';

GRANT EXECUTE ON FUNCTION public.has_formateur_role(uuid) TO anon, authenticated;


-- 3. Modifier les policies RLS sur les tables gh_* (sessions)

-- vr_sessions: formateurs peuvent lire toutes les sessions et les supprimer
DROP POLICY IF EXISTS "Admins can read all sessions" ON public.vr_sessions;
CREATE POLICY "Formateurs can read all sessions"
  ON public.vr_sessions FOR SELECT
  USING (public.has_formateur_role());

-- session_steps: formateurs peuvent lire toutes les étapes
DROP POLICY IF EXISTS "Admins can read all session steps" ON public.session_steps;
CREATE POLICY "Formateurs can read all session steps"
  ON public.session_steps FOR SELECT
  USING (public.has_formateur_role());

-- session_sales: formateurs peuvent lire toutes les ventes
DROP POLICY IF EXISTS "Admins can read all session sales" ON public.session_sales;
CREATE POLICY "Formateurs can read all session sales"
  ON public.session_sales FOR SELECT
  USING (public.has_formateur_role());

-- session_media: formateurs peuvent lire tous les médias
DROP POLICY IF EXISTS "Admins read all session media" ON public.session_media;
CREATE POLICY "Formateurs read all session media"
  ON public.session_media FOR SELECT
  USING (public.has_formateur_role());


-- 4. Modifier les policies RLS sur les tables de formation

-- procedure_fiches: formateurs peuvent tout gérer (CRUD)
DROP POLICY IF EXISTS "Admins can manage fiches" ON public.procedure_fiches;
CREATE POLICY "Formateurs can manage fiches"
  ON public.procedure_fiches FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- quiz_questions: formateurs peuvent tout gérer
DROP POLICY IF EXISTS "Admins manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Formateurs manage quiz questions"
  ON public.quiz_questions FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- fiche_validations: formateurs peuvent lire toutes les validations
DROP POLICY IF EXISTS "Admins read all validations" ON public.fiche_validations;
CREATE POLICY "Formateurs read all validations"
  ON public.fiche_validations FOR SELECT
  USING (public.has_formateur_role());

-- checklist_template_fiches: formateurs peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage checklist fiche links" ON public.checklist_template_fiches;
CREATE POLICY "Formateurs can manage checklist fiche links"
  ON public.checklist_template_fiches FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- session_step_fiches: formateurs peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage session step fiche links" ON public.session_step_fiches;
CREATE POLICY "Formateurs can manage session step fiche links"
  ON public.session_step_fiches FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- checklist_templates: formateurs peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage checklist templates" ON public.checklist_templates;
CREATE POLICY "Formateurs can manage checklist templates"
  ON public.checklist_templates FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- gm_checkins: formateurs peuvent lire tous les pointages
DROP POLICY IF EXISTS "Admins can read all check-ins" ON public.gm_checkins;
CREATE POLICY "Formateurs can read all check-ins"
  ON public.gm_checkins FOR SELECT
  USING (public.has_formateur_role());

-- checklist_completions: formateurs peuvent lire toutes les complétions
DROP POLICY IF EXISTS "Admins can read all completions" ON public.checklist_completions;
CREATE POLICY "Formateurs can read all completions"
  ON public.checklist_completions FOR SELECT
  USING (public.has_formateur_role());

-- parcours_fiches: formateurs peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage parcours fiches" ON public.parcours_fiches;
CREATE POLICY "Formateurs can manage parcours fiches"
  ON public.parcours_fiches FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- step_fiches: formateurs peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage step fiches" ON public.step_fiches;
CREATE POLICY "Formateurs can manage step fiches"
  ON public.step_fiches FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());


-- 5. Mettre à jour les fonctions RPC pour accepter formateur_suivi

-- admin_delete_session: formateurs peuvent supprimer les sessions
CREATE OR REPLACE FUNCTION public.admin_delete_session(p_session_id uuid)
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
  IF NOT EXISTS (SELECT 1 FROM public.vr_sessions WHERE id = p_session_id) THEN
    RAISE EXCEPTION 'Session introuvable' USING errcode = 'P0002';
  END IF;

  SELECT count(*) INTO v_steps FROM public.session_steps WHERE session_id = p_session_id;
  SELECT count(*) INTO v_sales FROM public.session_sales WHERE session_id = p_session_id;
  SELECT count(*) INTO v_media FROM public.session_media WHERE session_id = p_session_id;

  DELETE FROM public.session_steps WHERE session_id = p_session_id;
  DELETE FROM public.session_sales WHERE session_id = p_session_id;
  DELETE FROM public.session_media WHERE session_id = p_session_id;
  UPDATE public.bug_sessions SET vr_session_id = null WHERE vr_session_id = p_session_id;
  DELETE FROM public.vr_sessions WHERE id = p_session_id;

  RETURN jsonb_build_object('steps', v_steps, 'sales', v_sales, 'media', v_media);
END;
$$;

-- list_gm_profiles: formateurs peuvent lister les profils
CREATE OR REPLACE FUNCTION public.list_gm_profiles()
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

-- set_session_flag_reviewed: formateurs peuvent marquer les sessions comme revues
CREATE OR REPLACE FUNCTION public.set_session_flag_reviewed(p_session_id uuid, p_reviewed boolean)
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
  UPDATE public.vr_sessions
     SET flag_reviewed_at = v_at,
         flag_reviewed_by = CASE WHEN p_reviewed THEN auth.uid() ELSE null END
   WHERE id = p_session_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable' USING errcode = 'P0002';
  END IF;
  
  RETURN v_at;
END;
$$;


-- 6. Storage policies pour session-media
--    Note: Les storage policies peuvent déjà exister sur le bucket session-media.
--    On ne peut pas DROP POLICY IF EXISTS sur storage, donc on doit vérifier manuellement.
--    Si ces policies n'existent pas encore, cette section peut être ignorée.

-- Les storage policies doivent être créées via le dashboard Supabase ou via
-- des migrations spécifiques au storage. Cette migration se concentre sur les tables RLS.
-- Pour le bucket session-media, assurez-vous que les policies suivantes existent :
-- 
-- SELECT: has_formateur_role() OR (propriétaire de la session)
-- INSERT/UPDATE/DELETE: has_formateur_role() OR (propriétaire de la session)


-- 7. Documentation
COMMENT ON FUNCTION public.has_formateur_role IS
  'Vérifie si l''utilisateur a le rôle admin OU formateur_suivi.
   Le rôle formateur_suivi donne accès à :
   - Vue et gestion de toutes les sessions (lecture + suppression)
   - Édition complète des formations (fiches, quiz, parcours)
   - Vue de toutes les validations et progressions des GMs
   
   Ce rôle ne donne PAS accès aux fonctionnalités Lovable admin générales.
   
   Attribution du rôle : un admin doit insérer manuellement dans user_roles :
   INSERT INTO public.user_roles (user_id, role)
   VALUES (''<uuid-utilisateur>'', ''formateur_suivi'');';
