-- 060 — Catalogue « Ventes & encaissement » aligné sur la carte officielle
-- « FEUILLE DE CONSO / SELF SERVICE BAR / VIRTUAL REALITY CENTER ».
-- Idempotent : peut être relancé sans créer de doublon.
-- Déjà appliqué sur dnxy via Lovable (commit 9a7c26a).
-- Ne touche pas gh_session_sales (les ventes passées gardent nom + prix enregistrés).
-- Aucun DELETE : « Jus de fruits » est seulement désactivé.

-- 1) « Eau minérale » devient « Eau » (si « Eau » n'existe pas déjà)
UPDATE public.gh_sales_products
SET name = 'Eau', updated_at = now()
WHERE name = 'Eau minérale'
  AND NOT EXISTS (SELECT 1 FROM public.gh_sales_products WHERE name = 'Eau');

-- 2) Carte du bar : insérer ce qui manque, puis aligner prix / catégorie / ordre
WITH target(name, unit_price, category, order_index) AS (
  VALUES
    ('Coca-Cola',             3.50, 'boisson',  1),
    ('Coca-Cola Zéro',        3.50, 'boisson',  2),
    ('Neastea Citron',        4.50, 'boisson',  3),
    ('Neastea Pêche',         4.50, 'boisson',  4),
    ('Red Bull',              3.90, 'boisson',  5),
    ('Café',                  3.60, 'boisson',  6),
    ('Eau',                   3.60, 'boisson',  7),
    ('Fendant 75 cl',        20.00, 'alcool',   8),
    ('Fendant 50 cl',        15.00, 'alcool',   9),
    ('Assemblage Rouge 75cl',23.00, 'alcool',  10),
    ('Bière Valaisanne',      3.60, 'alcool',  11),
    ('Pop Corn',              4.00, 'snack',   12)
)
INSERT INTO public.gh_sales_products (name, unit_price, category, order_index, is_active)
SELECT t.name, t.unit_price, t.category, t.order_index, true
FROM target t
WHERE NOT EXISTS (SELECT 1 FROM public.gh_sales_products p WHERE p.name = t.name);

WITH target(name, unit_price, category, order_index) AS (
  VALUES
    ('Coca-Cola',             3.50, 'boisson',  1),
    ('Coca-Cola Zéro',        3.50, 'boisson',  2),
    ('Neastea Citron',        4.50, 'boisson',  3),
    ('Neastea Pêche',         4.50, 'boisson',  4),
    ('Red Bull',              3.90, 'boisson',  5),
    ('Café',                  3.60, 'boisson',  6),
    ('Eau',                   3.60, 'boisson',  7),
    ('Fendant 75 cl',        20.00, 'alcool',   8),
    ('Fendant 50 cl',        15.00, 'alcool',   9),
    ('Assemblage Rouge 75cl',23.00, 'alcool',  10),
    ('Bière Valaisanne',      3.60, 'alcool',  11),
    ('Pop Corn',              4.00, 'snack',   12)
)
UPDATE public.gh_sales_products p
SET unit_price = t.unit_price,
    category = t.category,
    order_index = t.order_index,
    is_active = true,
    updated_at = now()
FROM target t
WHERE p.name = t.name;

-- 3) Options : seulement l'ordre (noms, prix, min/max, descriptions inchangés)
UPDATE public.gh_sales_products p
SET order_index = o.order_index, updated_at = now()
FROM (VALUES
  ('Planchettes', 20),
  ('SVELTE', 21),
  ('DODU', 22),
  ('Pack Birthday', 23),
  ('EVJF Escape & Pole', 24)
) AS o(name, order_index)
WHERE p.name = o.name AND p.order_index IS DISTINCT FROM o.order_index;

-- 4) « Autre » reste en dernier
UPDATE public.gh_sales_products
SET order_index = 99, updated_at = now()
WHERE name = 'Autre' AND order_index IS DISTINCT FROM 99;

-- 5) Plus sur la carte : désactivé (pas supprimé)
UPDATE public.gh_sales_products
SET is_active = false, updated_at = now()
WHERE name = 'Jus de fruits' AND is_active;
