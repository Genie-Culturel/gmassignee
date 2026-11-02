-- Bug reporter persistence (mirrors the schema already applied on hosted Supabase).
-- Linked optionally to a VR session so GM reports stay correlated.

CREATE TABLE public.bug_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text UNIQUE,
  vr_session_id uuid REFERENCES public.vr_sessions(id) ON DELETE SET NULL,
  game text NOT NULL,
  session_date date NOT NULL,
  session_time time,
  panel text,
  gm text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bug_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_session_id uuid NOT NULL REFERENCES public.bug_sessions(id) ON DELETE CASCADE,
  description text NOT NULL,
  criticality text,
  category text,
  position int DEFAULT 0,
  status text DEFAULT 'open',
  extra jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bug_sessions_vr_session_id ON public.bug_sessions(vr_session_id);
CREATE INDEX idx_bug_sessions_session_date ON public.bug_sessions(session_date DESC);
CREATE INDEX idx_bug_entries_bug_session_id ON public.bug_entries(bug_session_id);

ALTER TABLE public.bug_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sandbox_all"
  ON public.bug_sessions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "sandbox_all"
  ON public.bug_entries
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_bug_sessions_updated_at
  BEFORE UPDATE ON public.bug_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bug_entries_updated_at
  BEFORE UPDATE ON public.bug_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
