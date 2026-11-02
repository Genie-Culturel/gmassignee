-- GM mandatory training: fiche versioning, quiz, per-GM validations.
-- Additive only. Do not drop existing objects.

ALTER TABLE public.procedure_fiches
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS skip_version_bump boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.procedure_fiches.version IS
  'Increments when content or quiz questions change (unless skip_version_bump).';
COMMENT ON COLUMN public.procedure_fiches.is_required IS
  'If true, GMs must validate this fiche (read + quiz if any).';
COMMENT ON COLUMN public.procedure_fiches.skip_version_bump IS
  'One-shot flag: set true on UPDATE for a minor correction. Trigger clears it.';

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id uuid NOT NULL REFERENCES public.procedure_fiches(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_choice_ids text[] NOT NULL DEFAULT '{}',
  order_index integer NOT NULL DEFAULT 0,
  is_example boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_fiche_id ON public.quiz_questions (fiche_id);

CREATE TABLE IF NOT EXISTS public.fiche_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gm_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fiche_id uuid NOT NULL REFERENCES public.procedure_fiches(id) ON DELETE CASCADE,
  version integer NOT NULL,
  validated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gm_id, fiche_id)
);

CREATE INDEX IF NOT EXISTS idx_fiche_validations_gm_id ON public.fiche_validations (gm_id);
CREATE INDEX IF NOT EXISTS idx_fiche_validations_fiche_id ON public.fiche_validations (fiche_id);

-- Version bump on fiche content change, unless skip_version_bump.
CREATE OR REPLACE FUNCTION public.bump_procedure_fiche_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Keep the flag so a following quiz write in the same admin save can skip too.
  -- The app clears skip_version_bump after saving questions.
  IF NEW.skip_version_bump THEN
    RETURN NEW;
  END IF;
  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.summary IS DISTINCT FROM OLD.summary
     OR NEW.content_steps IS DISTINCT FROM OLD.content_steps
     OR NEW.category IS DISTINCT FROM OLD.category
     OR NEW.is_required IS DISTINCT FROM OLD.is_required THEN
    NEW.version := OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_procedure_fiche_version ON public.procedure_fiches;
CREATE TRIGGER trg_bump_procedure_fiche_version
  BEFORE UPDATE ON public.procedure_fiches
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_procedure_fiche_version();

-- Quiz insert/update/delete bumps the parent fiche version (unless skip GUC/flag on the UPDATE).
CREATE OR REPLACE FUNCTION public.bump_fiche_version_from_quiz()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  fid uuid;
  skip boolean;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.prompt IS NOT DISTINCT FROM OLD.prompt
     AND NEW.choices IS NOT DISTINCT FROM OLD.choices
     AND NEW.correct_choice_ids IS NOT DISTINCT FROM OLD.correct_choice_ids
     AND NEW.order_index IS NOT DISTINCT FROM OLD.order_index THEN
    RETURN NEW;
  END IF;
  fid := COALESCE(NEW.fiche_id, OLD.fiche_id);
  SELECT skip_version_bump INTO skip FROM public.procedure_fiches WHERE id = fid;
  IF COALESCE(skip, false) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  UPDATE public.procedure_fiches
    SET version = version + 1, updated_at = now()
    WHERE id = fid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_quiz_questions_bump_fiche ON public.quiz_questions;
CREATE TRIGGER trg_quiz_questions_bump_fiche
  AFTER INSERT OR UPDATE OR DELETE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_fiche_version_from_quiz();

DROP TRIGGER IF EXISTS update_quiz_questions_updated_at ON public.quiz_questions;
CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiche_validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Admins manage quiz questions"
  ON public.quiz_questions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "GMs read own validations" ON public.fiche_validations;
CREATE POLICY "GMs read own validations"
  ON public.fiche_validations FOR SELECT
  USING (auth.uid() = gm_id);

DROP POLICY IF EXISTS "GMs write own validations" ON public.fiche_validations;
CREATE POLICY "GMs write own validations"
  ON public.fiche_validations FOR INSERT
  WITH CHECK (auth.uid() = gm_id);

DROP POLICY IF EXISTS "GMs update own validations" ON public.fiche_validations;
CREATE POLICY "GMs update own validations"
  ON public.fiche_validations FOR UPDATE
  USING (auth.uid() = gm_id)
  WITH CHECK (auth.uid() = gm_id);

DROP POLICY IF EXISTS "Admins read all validations" ON public.fiche_validations;
CREATE POLICY "Admins read all validations"
  ON public.fiche_validations FOR SELECT
  USING (public.is_admin());

-- GMs get questions without correct answers (SECURITY DEFINER, columns stripped).
CREATE OR REPLACE FUNCTION public.get_quiz_questions(p_fiche_id uuid)
RETURNS TABLE (
  id uuid,
  fiche_id uuid,
  prompt text,
  choices jsonb,
  order_index integer,
  is_example boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.fiche_id, q.prompt, q.choices, q.order_index, q.is_example
  FROM public.quiz_questions q
  WHERE q.fiche_id = p_fiche_id
  ORDER BY q.order_index, q.created_at;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_questions(uuid) TO anon, authenticated;

-- Grade quiz + upsert validation. Correct answers stay on the server.
CREATE OR REPLACE FUNCTION public.submit_fiche_validation(
  p_fiche_id uuid,
  p_confirmed boolean,
  p_answers jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q record;
  given text[];
  wrong jsonb := '[]'::jsonb;
  fiche_ver integer;
  given_sorted text[];
  correct_sorted text[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT COALESCE(p_confirmed, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'confirm_required');
  END IF;

  SELECT version INTO fiche_ver
  FROM public.procedure_fiches
  WHERE id = p_fiche_id AND is_active = true;
  IF fiche_ver IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'fiche_not_found');
  END IF;

  FOR q IN
    SELECT id, correct_choice_ids
    FROM public.quiz_questions
    WHERE fiche_id = p_fiche_id
    ORDER BY order_index, created_at
  LOOP
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(elem -> 'choice_ids')
      FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) elem
      WHERE elem ->> 'question_id' = q.id::text
    ) INTO given;

    SELECT ARRAY(SELECT unnest(COALESCE(given, '{}')) ORDER BY 1) INTO given_sorted;
    SELECT ARRAY(SELECT unnest(COALESCE(q.correct_choice_ids, '{}')) ORDER BY 1) INTO correct_sorted;

    IF given_sorted IS DISTINCT FROM correct_sorted THEN
      wrong := wrong || jsonb_build_array(q.id);
    END IF;
  END LOOP;

  IF jsonb_array_length(wrong) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'wrong_question_ids', wrong);
  END IF;

  INSERT INTO public.fiche_validations (gm_id, fiche_id, version, validated_at)
  VALUES (auth.uid(), p_fiche_id, fiche_ver, now())
  ON CONFLICT (gm_id, fiche_id)
  DO UPDATE SET version = EXCLUDED.version, validated_at = EXCLUDED.validated_at;

  RETURN jsonb_build_object('ok', true, 'version', fiche_ver);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_fiche_validation(uuid, boolean, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_gm_profiles()
RETURNS TABLE (gm_id uuid, display_name text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
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

GRANT EXECUTE ON FUNCTION public.list_gm_profiles() TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiche_validations TO authenticated;

-- Example quiz questions (marked is_example). No-op if the fiche titles are missing.
INSERT INTO public.quiz_questions (fiche_id, prompt, choices, correct_choice_ids, order_index, is_example)
SELECT f.id,
  'Où installer le premier groupe à son arrivée ? (exemple)',
  '[{"id":"lobby","text":"Au lobby (tables d''accueil)"},{"id":"salle","text":"Directement en salle de jeu"},{"id":"parking","text":"Sur le parking"}]'::jsonb,
  ARRAY['lobby'],
  1,
  true
FROM public.procedure_fiches f
WHERE f.title = 'Installation au lobby'
  AND NOT EXISTS (
    SELECT 1 FROM public.quiz_questions q WHERE q.fiche_id = f.id AND q.is_example
  )
LIMIT 1;

INSERT INTO public.quiz_questions (fiche_id, prompt, choices, correct_choice_ids, order_index, is_example)
SELECT f.id,
  'Combien de tables de 8 y a-t-il au lobby ? (exemple)',
  '[{"id":"1","text":"1 table"},{"id":"2","text":"2 tables"},{"id":"4","text":"4 tables"}]'::jsonb,
  ARRAY['2'],
  2,
  true
FROM public.procedure_fiches f
WHERE f.title = 'Installation au lobby'
  AND NOT EXISTS (
    SELECT 1 FROM public.quiz_questions q
    WHERE q.fiche_id = f.id AND q.prompt LIKE '%tables de 8%'
  )
LIMIT 1;

INSERT INTO public.quiz_questions (fiche_id, prompt, choices, correct_choice_ids, order_index, is_example)
SELECT f.id,
  'Premier geste si un client se sent mal en VR ? (exemple)',
  '[{"id":"casque","text":"Retirer immédiatement le casque"},{"id":"continuer","text":"Le laisser finir la partie"},{"id":"eau_casque","text":"Lui donner de l''eau sans retirer le casque"}]'::jsonb,
  ARRAY['casque'],
  1,
  true
FROM public.procedure_fiches f
WHERE f.title = 'Dépannage : Malaise client'
  AND NOT EXISTS (
    SELECT 1 FROM public.quiz_questions q WHERE q.fiche_id = f.id AND q.is_example
  )
LIMIT 1;
