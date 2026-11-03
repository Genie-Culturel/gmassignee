-- Soft-delete procedure fiches. Validations are kept (no row DELETE, so no FK cascade).
-- Additive only.

ALTER TABLE public.procedure_fiches
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

COMMENT ON COLUMN public.procedure_fiches.deleted_at IS
  'Soft delete. Non-null = hidden from GM and admin lists. Distinct from is_active (temporary hide). fiche_validations are kept.';

CREATE INDEX IF NOT EXISTS idx_procedure_fiches_deleted_at
  ON public.procedure_fiches (deleted_at);

-- GMs (and anon) only see live, active fiches. Admins still manage via is_admin() FOR ALL.
DROP POLICY IF EXISTS "Anyone can read active fiches" ON public.procedure_fiches;
CREATE POLICY "Anyone can read active fiches"
  ON public.procedure_fiches FOR SELECT
  USING (is_active = TRUE AND deleted_at IS NULL);

-- Quiz / validation must ignore soft-deleted fiches.
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
  JOIN public.procedure_fiches f ON f.id = q.fiche_id
  WHERE q.fiche_id = p_fiche_id
    AND f.deleted_at IS NULL
  ORDER BY q.order_index, q.created_at;
$$;

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
  WHERE id = p_fiche_id AND is_active = true AND deleted_at IS NULL;
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
