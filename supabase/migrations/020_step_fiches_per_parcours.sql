-- Step → fiche links per parcours (Julien, 2026-11-03).
-- A step is identified by (parcours_id, step). Existing links are VR Center ones.

ALTER TABLE public.session_step_fiches
  ADD COLUMN IF NOT EXISTS parcours_id text REFERENCES public.parcours(id) ON DELETE CASCADE;

UPDATE public.session_step_fiches SET parcours_id = 'vr_centre_client' WHERE parcours_id IS NULL;

ALTER TABLE public.session_step_fiches ALTER COLUMN parcours_id SET NOT NULL;
ALTER TABLE public.session_step_fiches ALTER COLUMN parcours_id SET DEFAULT 'vr_centre_client';

ALTER TABLE public.session_step_fiches DROP CONSTRAINT IF EXISTS session_step_fiches_step_fiche_id_key;
ALTER TABLE public.session_step_fiches DROP CONSTRAINT IF EXISTS session_step_fiches_parcours_step_fiche_key;
ALTER TABLE public.session_step_fiches
  ADD CONSTRAINT session_step_fiches_parcours_step_fiche_key UNIQUE (parcours_id, step, fiche_id);

CREATE INDEX IF NOT EXISTS idx_session_step_fiches_parcours_step
  ON public.session_step_fiches (parcours_id, step);

COMMENT ON COLUMN public.session_step_fiches.parcours_id IS
  'parcours.id; with step (= parcours_steps.step_key) identifies the step. Admin-only write (RLS from 001).';
