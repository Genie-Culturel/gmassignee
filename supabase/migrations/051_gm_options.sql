-- Migration 051: Options GM (feature flags)
-- Singleton row read by GitHub Pages + Lovable shell. Admins / formateur_suivi
-- toggle from Console → Configuration → API & Configuration (« Options GM »).
-- GMs only see enabled features; formateurs keep access to configure.

CREATE TABLE IF NOT EXISTS public.gh_gm_options (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  show_suivi_parties boolean NOT NULL DEFAULT false,
  show_formations boolean NOT NULL DEFAULT false,
  formations_obligatoires boolean NOT NULL DEFAULT true,
  notifications boolean NOT NULL DEFAULT true,
  upload_videos_clients boolean NOT NULL DEFAULT true,
  bug_reporter boolean NOT NULL DEFAULT true,
  encaissement boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

COMMENT ON TABLE public.gh_gm_options IS
  'Feature flags for GM-facing GMassignee modules (Suivi, Formations, souvenirs, bug reporter, ventes, notifications UI). Single row id=default.';

INSERT INTO public.gh_gm_options (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.gh_gm_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read gh_gm_options" ON public.gh_gm_options;
CREATE POLICY "Authenticated read gh_gm_options"
  ON public.gh_gm_options FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Formateurs update gh_gm_options" ON public.gh_gm_options;
CREATE POLICY "Formateurs update gh_gm_options"
  ON public.gh_gm_options FOR UPDATE TO authenticated
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

DROP POLICY IF EXISTS "Formateurs insert gh_gm_options" ON public.gh_gm_options;
CREATE POLICY "Formateurs insert gh_gm_options"
  ON public.gh_gm_options FOR INSERT TO authenticated
  WITH CHECK (public.has_formateur_role());

GRANT SELECT, INSERT, UPDATE ON public.gh_gm_options TO authenticated;

CREATE OR REPLACE FUNCTION public.gh_touch_gm_options()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gh_gm_options_touch ON public.gh_gm_options;
CREATE TRIGGER gh_gm_options_touch
  BEFORE UPDATE ON public.gh_gm_options
  FOR EACH ROW
  EXECUTE FUNCTION public.gh_touch_gm_options();
