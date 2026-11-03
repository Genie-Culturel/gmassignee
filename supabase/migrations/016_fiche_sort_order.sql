-- Manual fiche order within each category.
-- Additive only. Does not bump fiche version (trigger watches content fields only).

ALTER TABLE public.procedure_fiches
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.procedure_fiches.sort_order IS
  'Display order within a category. Admin-managed. Changing this must not increment version.';

CREATE INDEX IF NOT EXISTS idx_procedure_fiches_category_sort_order
  ON public.procedure_fiches (category, sort_order);

-- Preserve the current list order (category, then title).
WITH ordered AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY category ORDER BY title ASC, created_at ASC) * 10 AS rn
  FROM public.procedure_fiches
)
UPDATE public.procedure_fiches f
SET sort_order = ordered.rn
FROM ordered
WHERE f.id = ordered.id
  AND f.sort_order = 0;

-- Explicitly ignore sort_order (and other non-content fields) when bumping version.
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
  -- sort_order, scope_kind, is_active, deleted_at, tags, is_placeholder, updated_at
  -- are admin/cosmetic and must not force GM revalidation.
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
