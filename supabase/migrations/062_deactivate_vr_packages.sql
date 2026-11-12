-- 062 — Désactiver les 5 forfaits VR du catalogue « Ventes & encaissement »
-- Idempotent. Pas de DELETE. Ne touche pas aux prix, order_index, descriptions,
-- ni aux autres produits, ni à gh_session_sales.
-- Déjà appliqué sur dnxy via Lovable (commit 5b061a2, fichier
-- supabase/migrations/20261112100703_da337f35-ea1d-4664-b82c-19ae2574b929.sql).

UPDATE public.gh_sales_products
SET is_active = false, updated_at = now()
WHERE name IN (
  'Planchettes',
  'SVELTE',
  'DODU',
  'Pack Birthday',
  'EVJF Escape & Pole'
)
AND is_active;
