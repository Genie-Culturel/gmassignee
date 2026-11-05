-- 053: le GM peut annuler une session en cours (mauvais démarrage / test).
-- Soft-cancel : cancelled_at. L'app pose aussi ended_at pour libérer l'index
-- unique « une session ouverte par assignment » (ended_at IS NULL) sans
-- dépendre du nom exact de cet index sur gh_vr_sessions.
-- Les lignes annulées sont exclues de l'Historique (listRecordedSessions).

ALTER TABLE public.gh_vr_sessions
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

COMMENT ON COLUMN public.gh_vr_sessions.cancelled_at IS
  'Annulation GM d''une session démarrée par erreur ou en test. Exclue de l''historique ; le créneau redevient disponible.';

CREATE INDEX IF NOT EXISTS idx_gh_vr_sessions_cancelled_at
  ON public.gh_vr_sessions (cancelled_at)
  WHERE cancelled_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.gh_cancel_open_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gm uuid;
  v_ended timestamptz;
  v_cancelled timestamptz;
BEGIN
  SELECT gm_id, ended_at, cancelled_at
    INTO v_gm, v_ended, v_cancelled
    FROM public.gh_vr_sessions
   WHERE id = p_session_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable' USING errcode = 'P0002';
  END IF;

  IF v_gm IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Tu ne peux annuler que tes propres sessions' USING errcode = '42501';
  END IF;

  -- Déjà annulée : no-op (double clic / retry).
  IF v_cancelled IS NOT NULL THEN
    RETURN;
  END IF;

  IF v_ended IS NOT NULL THEN
    RAISE EXCEPTION 'Cette session est déjà terminée' USING errcode = 'P0001';
  END IF;

  UPDATE public.gh_vr_sessions
     SET cancelled_at = now(),
         ended_at = now()
   WHERE id = p_session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.gh_cancel_open_session(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.gh_cancel_open_session(uuid) TO authenticated;

COMMENT ON FUNCTION public.gh_cancel_open_session IS
  'Annule une session gh_vr_sessions encore ouverte (ended_at IS NULL) appartenant au GM connecté.
   Soft-cancel : cancelled_at + ended_at. Le créneau planning redevient démarrable ;
   la ligne n''apparaît pas dans l''historique des sessions.';
