-- VR Center Procedures Module Migration
-- This migration creates tables for GM check-ins, checklists, sessions AND procedure fiches
-- DO NOT RUN AGAINST PRODUCTION - Create a test/local Supabase project first

-- Enable RLS
-- Note: do not ALTER DATABASE SET "app.jwt_secret" here — hosted Supabase
-- does not allow that, and JWT secrets are managed by the platform.

-- Create enum types
CREATE TYPE checklist_type AS ENUM ('opening', 'closing', 'weekly_cleaning');
CREATE TYPE session_step AS ENUM (
  'reception_seating',
  'reception_drinks',
  'reception_popcorn',
  'reception_checkin',
  'salon_briefing',
  'salon_lockers',
  'game_playing',
  'game_filming',
  'salon_return',
  'reception_debrief',
  'videos_sent',
  'google_review',
  'socials_shared',
  'cleaning'
);
CREATE TYPE fiche_category AS ENUM (
  'equipment_setup',      -- Configuration matériel (Quest 3, etc.)
  'game_launch',          -- Lancement des jeux
  'troubleshooting',      -- Dépannage (bugs, malaises, casse)
  'cleaning',             -- Nettoyage
  'client_experience',    -- Accueil et expérience client
  'safety',               -- Sécurité
  'other'                 -- Autre
);
CREATE TYPE incident_type AS ENUM ('bug', 'malaise', 'casse', 'autre');

-- Table: procedure_fiches
-- Library of technical procedure cards (admin-editable)
CREATE TABLE procedure_fiches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category fiche_category NOT NULL,
  title TEXT NOT NULL,
  summary TEXT, -- short description shown in lists
  content_steps JSONB NOT NULL DEFAULT '[]', -- array of {order, text, completed}
  is_placeholder BOOLEAN NOT NULL DEFAULT FALSE, -- true for "à compléter" fiches
  tags TEXT[], -- for search/filtering
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: gm_checkins
-- Tracks when GMs arrive for their shifts
CREATE TABLE gm_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gm_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID, -- nullable: can be a daily check-in without a specific event
  checkin_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_time TIMESTAMPTZ, -- when they should have arrived (event_start - 45 min)
  is_late BOOLEAN GENERATED ALWAYS AS (
    expected_time IS NOT NULL AND checkin_time > expected_time
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: checklist_templates
-- Editable checklist items (admin-managed)
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type checklist_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: checklist_template_fiches
-- Links checklist items to procedure fiches ("Comment faire?")
CREATE TABLE checklist_template_fiches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  fiche_id UUID NOT NULL REFERENCES procedure_fiches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, fiche_id)
);

-- Table: checklist_completions
-- Tracks checklist item completion per day/session
CREATE TABLE checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  gm_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL, -- for daily checklists
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, date) -- one completion per item per day
);

-- Table: vr_sessions
-- Tracks per-event sessions with client flow
CREATE TABLE vr_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL, -- reference to events table (not created here)
  gm_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  group_name TEXT, -- optional group identifier
  notes TEXT,
  has_incident BOOLEAN NOT NULL DEFAULT FALSE,
  incident_type incident_type,
  incident_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: session_steps
-- Tracks completion of each step in the client flow
CREATE TABLE session_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vr_sessions(id) ON DELETE CASCADE,
  step session_step NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: session_step_fiches
-- Links session steps to procedure fiches (which fiches are relevant for each step)
CREATE TABLE session_step_fiches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step session_step NOT NULL,
  fiche_id UUID NOT NULL REFERENCES procedure_fiches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(step, fiche_id)
);

-- Indexes for performance
CREATE INDEX idx_procedure_fiches_category ON procedure_fiches(category);
CREATE INDEX idx_procedure_fiches_is_active ON procedure_fiches(is_active);
CREATE INDEX idx_gm_checkins_gm_id ON gm_checkins(gm_id);
CREATE INDEX idx_gm_checkins_event_id ON gm_checkins(event_id);
CREATE INDEX idx_gm_checkins_checkin_time ON gm_checkins(checkin_time DESC);
CREATE INDEX idx_checklist_completions_date ON checklist_completions(date DESC);
CREATE INDEX idx_checklist_completions_gm_id ON checklist_completions(gm_id);
CREATE INDEX idx_vr_sessions_event_id ON vr_sessions(event_id);
CREATE INDEX idx_vr_sessions_gm_id ON vr_sessions(gm_id);
CREATE INDEX idx_vr_sessions_started_at ON vr_sessions(started_at DESC);
CREATE INDEX idx_session_steps_session_id ON session_steps(session_id);

-- Row Level Security (RLS) Policies

-- Procedure fiches: everyone reads active, admins manage
ALTER TABLE procedure_fiches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active fiches"
  ON procedure_fiches FOR SELECT
  USING (is_active = TRUE);
CREATE POLICY "Admins can manage fiches"
  ON procedure_fiches FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Fiche links: everyone reads, admins manage
ALTER TABLE checklist_template_fiches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read checklist fiche links"
  ON checklist_template_fiches FOR SELECT
  USING (TRUE);
CREATE POLICY "Admins can manage checklist fiche links"
  ON checklist_template_fiches FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

ALTER TABLE session_step_fiches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read session step fiche links"
  ON session_step_fiches FOR SELECT
  USING (TRUE);
CREATE POLICY "Admins can manage session step fiche links"
  ON session_step_fiches FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- GMs can insert their own check-ins and read their own data
ALTER TABLE gm_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GMs can insert their own check-ins"
  ON gm_checkins FOR INSERT
  WITH CHECK (auth.uid() = gm_id);
CREATE POLICY "GMs can read their own check-ins"
  ON gm_checkins FOR SELECT
  USING (auth.uid() = gm_id);
CREATE POLICY "Admins can read all check-ins"
  ON gm_checkins FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Checklist templates: GMs read, admins manage
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active checklist templates"
  ON checklist_templates FOR SELECT
  USING (is_active = TRUE);
CREATE POLICY "Admins can manage checklist templates"
  ON checklist_templates FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Checklist completions: GMs manage their own
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GMs can manage their own completions"
  ON checklist_completions FOR ALL
  USING (auth.uid() = gm_id);
CREATE POLICY "Admins can read all completions"
  ON checklist_completions FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- VR sessions: GMs manage their own
ALTER TABLE vr_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GMs can manage their own sessions"
  ON vr_sessions FOR ALL
  USING (auth.uid() = gm_id);
CREATE POLICY "Admins can read all sessions"
  ON vr_sessions FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Session steps: owned by the session's GM
ALTER TABLE session_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GMs can manage steps for their sessions"
  ON session_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vr_sessions
      WHERE vr_sessions.id = session_steps.session_id
      AND vr_sessions.gm_id = auth.uid()
    )
  );
CREATE POLICY "Admins can read all session steps"
  ON session_steps FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON checklist_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procedure_fiches_updated_at
  BEFORE UPDATE ON procedure_fiches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
