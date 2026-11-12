-- 063 — Correct Neastea Citron and Neastea Pêche unit_price to 3.50 (official Self Service Bar card)
-- Idempotent. Pas de DELETE. Ne touche pas aux autres produits, ni à is_active,
-- ni à order_index, ni à gh_session_sales.
-- Repo mirror of the SQL already applied on dnxy
-- (Lovable commit 9e19053991346a4218aef183b848afbe98b9eadd,
--  file supabase/migrations/20261112102114_a44bfad2-1bd5-455d-a1a2-9ac20dbd0c0c.sql).

UPDATE public.gh_sales_products
SET unit_price = 3.50, updated_at = now()
WHERE name IN (
  'Neastea Citron',
  'Neastea Pêche'
);
