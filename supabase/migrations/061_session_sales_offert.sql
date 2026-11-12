-- 061 — Ventes : ligne « Offert » (prix facturé 0, quantité conservée)
-- Additif et idempotent. Les lignes existantes restent is_offered = false, catalog_unit_price = NULL.
-- Déjà appliqué sur dnxy via Lovable (commit cd00e15).
ALTER TABLE public.gh_session_sales
  ADD COLUMN IF NOT EXISTS is_offered boolean NOT NULL DEFAULT false;
ALTER TABLE public.gh_session_sales
  ADD COLUMN IF NOT EXISTS catalog_unit_price numeric(10,2);
COMMENT ON COLUMN public.gh_session_sales.is_offered IS 'Ligne offerte : unit_price = 0, quantity conservée (consommation).';
COMMENT ON COLUMN public.gh_session_sales.catalog_unit_price IS 'Prix catalogue au moment de la vente (référence de la valeur offerte).';
