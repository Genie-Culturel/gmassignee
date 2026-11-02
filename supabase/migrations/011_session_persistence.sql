-- Persist enough session context to resume on another device, and to
-- link bug reports (game, date, time, players, parcours, assignment).
-- event_id is no longer required: this module has no events table, and
-- mock GMassignee assignment ids are not UUIDs.

ALTER TABLE public.vr_sessions
  ALTER COLUMN event_id DROP NOT NULL;

ALTER TABLE public.vr_sessions
  ADD COLUMN IF NOT EXISTS game text,
  ADD COLUMN IF NOT EXISTS session_date date,
  ADD COLUMN IF NOT EXISTS session_time time,
  ADD COLUMN IF NOT EXISTS player_count integer,
  ADD COLUMN IF NOT EXISTS parcours_id text,
  ADD COLUMN IF NOT EXISTS assignment_id text,
  ADD COLUMN IF NOT EXISTS gm_name text;

CREATE INDEX IF NOT EXISTS idx_vr_sessions_assignment_id
  ON public.vr_sessions (assignment_id);

-- One open session per GM + assignment (resume the same row).
CREATE UNIQUE INDEX IF NOT EXISTS idx_vr_sessions_open_assignment
  ON public.vr_sessions (gm_id, assignment_id)
  WHERE assignment_id IS NOT NULL AND ended_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'session_steps_session_id_step_key'
  ) THEN
    ALTER TABLE public.session_steps
      ADD CONSTRAINT session_steps_session_id_step_key UNIQUE (session_id, step);
  END IF;
END $$;

COMMENT ON COLUMN public.vr_sessions.assignment_id IS
  'Stable id from GMassignee planning (or mock assignment+date). Used to resume.';
COMMENT ON COLUMN public.vr_sessions.parcours_id IS
  'Key from src/lib/parcours.ts (e.g. vr_centre_client).';
