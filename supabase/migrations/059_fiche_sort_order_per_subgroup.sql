-- Migration 059 : sort_order unique par (catégorie, sous-groupe)
-- À coller dans l'éditeur SQL Lovable / Supabase. Idempotent.
-- Ne bump PAS la version des fiches (skip_version_bump).
--
-- BUG : l'éditeur Formations réordonnait un groupe (ex. VR Center) en
-- réutilisant les sort_order déjà présents. Beaucoup de fiches partagent 0
-- (DEFAULT) ou le même rang, donc le persist n'écrivait rien / le rechargement
-- retriait par titre et mélangeait les cartes. Vue GM = même tri.
--
-- Cette migration densifie 10, 20, 30… DANS chaque (category, sub_group)
-- sans changer l'ordre actuellement affiché (sort_order, puis titre).
-- Les autres groupes gardent leurs propres numéros (collisions inter-groupes
-- sans effet : l'UI trie toujours à l'intérieur du groupe).

-- ============================================================================
-- 1. Colonne (déjà là si 016 a été appliqué sur les tables gh_*)
-- ============================================================================

ALTER TABLE public.gh_procedure_fiches
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.gh_procedure_fiches
  ADD COLUMN IF NOT EXISTS sub_group text;

ALTER TABLE public.gh_procedure_fiches
  ADD COLUMN IF NOT EXISTS skip_version_bump boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_gh_procedure_fiches_category_subgroup_sort
  ON public.gh_procedure_fiches (category, sub_group, sort_order);

-- ============================================================================
-- 2. Densifier les fiches non supprimées, sans bump de version
-- ============================================================================

WITH ordered AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY category, COALESCE(sub_group, '')
      ORDER BY sort_order ASC NULLS LAST, title ASC, created_at ASC, id ASC
    ) * 10 AS rn
  FROM public.gh_procedure_fiches
  WHERE deleted_at IS NULL
)
UPDATE public.gh_procedure_fiches f
SET sort_order = ordered.rn,
    skip_version_bump = true
FROM ordered
WHERE f.id = ordered.id
  AND f.sort_order IS DISTINCT FROM ordered.rn;

UPDATE public.gh_procedure_fiches
SET skip_version_bump = false
WHERE skip_version_bump IS TRUE;

COMMENT ON COLUMN public.gh_procedure_fiches.sort_order IS
  'Ordre d''affichage dans (category, sub_group). Unique par groupe (10, 20, 30…). Ne pas incrémenter version.';
