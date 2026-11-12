-- 062 — Ventes Pages -> stock Lovable (trigger GHS-<id>).
-- Déjà appliqué sur dnxy via Lovable : 20261112123238_e77fcfdd (M1) + 20261112123549_61f34705 (M2 REVOKE). Commits Lovable 0ce64c0, 0abf167 (non publiés, SQL live).
-- Fichier de référence uniquement (idempotent). Aucun changement frontend Pages.

-- 2026-11-12 — Pages « Ventes & encaissement » (gh_session_sales) -> stock Lovable (stock_movements)
-- Chaque ligne de vente Pages (y compris Offert) crée / met à jour / supprime UN mouvement
-- stock_movements de référence 'GHS-<id de la ligne>'. Pas de rattrapage historique.
-- Auto Vinum : les produits « DV Vinum » (Bouteille Blanc/Rouge, Eau, Jus de raisin) ne sont
-- JAMAIS déduits par Pages (exclus dans la fonction), Auto Vinum reste la seule source pour eux.
-- ROLLBACK :
--   DROP TRIGGER IF EXISTS trg_gh_session_sales_stock ON public.gh_session_sales;
--   DROP TRIGGER IF EXISTS trg_gh_vr_sessions_cancel_stock ON public.gh_vr_sessions;
--   DROP FUNCTION IF EXISTS public.gh_session_sales_stock_trigger();
--   DROP FUNCTION IF EXISTS public.gh_vr_sessions_cancel_stock_trigger();
--   DROP FUNCTION IF EXISTS public.gh_sync_session_sale_stock(uuid);
--   DELETE FROM public.stock_movements WHERE reference LIKE 'GHS-%';   -- seulement si on veut aussi retirer les déductions déjà faites
--   DROP INDEX IF EXISTS public.stock_movements_ghs_reference_uniq;
--   DROP TABLE IF EXISTS public.gh_sales_stock_map;

-- 1) Table de correspondance catalogue Pages -> produit stock
CREATE TABLE IF NOT EXISTS public.gh_sales_stock_map (
  sales_product_id uuid PRIMARY KEY REFERENCES public.gh_sales_products(id) ON DELETE CASCADE,
  stock_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  units_per_sale integer NOT NULL DEFAULT 1 CHECK (units_per_sale > 0),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.gh_sales_stock_map IS
  'Correspondance carte Pages (gh_sales_products) -> produit stock Lovable (products). Sans ligne active = pas de déduction de stock (ex. Autre, forfaits VR).';

ALTER TABLE public.gh_sales_stock_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gh_sales_stock_map_read ON public.gh_sales_stock_map;
CREATE POLICY gh_sales_stock_map_read ON public.gh_sales_stock_map
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS gh_sales_stock_map_admin ON public.gh_sales_stock_map;
CREATE POLICY gh_sales_stock_map_admin ON public.gh_sales_stock_map
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.gh_sales_stock_map (sales_product_id, stock_product_id, notes) VALUES
  ('35f294df-8660-4961-8120-c562f282dc49','398708e3-c840-4f1d-8d06-511e42636f83','Coca-Cola -> Coca Cola'),
  ('896aa1a9-2219-4e14-972d-0eeaf97bf55d','5d432235-552e-49a0-9f44-d10219aa69cd','Coca-Cola Zéro -> Coca Zero'),
  ('95a9c0b5-d9f4-4370-9a66-efb227b26df2','fb6458eb-a61d-4689-82f7-ddef20ce109c','Neastea Citron -> Neastea Lemon'),
  ('456ceaf0-660a-4019-800e-2cdc3de459f7','07372dd9-0a65-46db-8c81-8a3899c5f0dd','Neastea Pêche -> Neastea Peche'),
  ('318ef6b0-b5f1-41dd-9e6f-3675c3fd7bda','dbf0a9c4-0959-4c66-a201-754260af78ba','Red Bull -> RedBull'),
  ('63237455-6377-4b22-93c4-6b0578d7c83f','85c0e183-ebc7-4d9f-9f85-76fb08350af1','Café -> Cafe'),
  ('a88b5d1e-d90d-4cce-ba67-17119c755bf3','f5ba4504-b7a2-4b19-9378-c357176033f4','Eau -> Eau (pas Eau - DV Vinum)'),
  ('0f740c36-298a-4523-8140-419e0882d367','6f43d10c-1998-4781-a670-9dcddcba48bf','Fendant 75 cl -> Fendant 75cl'),
  ('15cf7c0a-2cf0-4cd1-b060-036e15aabe4e','9be67bcf-418f-48fa-99f6-25de8d3f6c78','Fendant 50 cl -> Fendant 50cl'),
  ('346fb8c5-01fe-478d-af95-e3ed58019f29','686d1d32-fac4-438d-b236-41eba7abbb90','Assemblage Rouge 75cl -> Assemblage Rouge 75cl'),
  ('526f9f73-3c02-4f19-9a80-0496a9ba1fb4','9055d7d0-6313-41ab-967f-0754dab01c02','Bière Valaisanne -> Biere valaisanne'),
  ('2bfd0daa-ee69-45c7-85c7-aeac1890cd9a','27a48512-ece4-4692-ab2e-ded45323e0c5','Pop Corn -> Popcorn à emporter')
ON CONFLICT (sales_product_id) DO NOTHING;

-- 2) Un seul mouvement par ligne de vente Pages
CREATE UNIQUE INDEX IF NOT EXISTS stock_movements_ghs_reference_uniq
  ON public.stock_movements (reference) WHERE reference LIKE 'GHS-%';

-- 3) Synchronisation d'une ligne (idempotente)
CREATE OR REPLACE FUNCTION public.gh_sync_session_sale_stock(p_sale_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref text := 'GHS-' || p_sale_id::text;
  s public.gh_session_sales%ROWTYPE;
  v_sess record;
  v_sales_product uuid;
  v_stock_product uuid;
  v_units integer;
  v_qty integer;
  v_gm uuid;
  v_notes text;
BEGIN
  SELECT * INTO s FROM public.gh_session_sales WHERE id = p_sale_id;
  IF NOT FOUND THEN
    DELETE FROM public.stock_movements WHERE reference = v_ref;
    RETURN;
  END IF;

  SELECT id, gm_id, cancelled_at, game, group_name, session_date
    INTO v_sess FROM public.gh_vr_sessions WHERE id = s.session_id;
  -- Session annulée (ou introuvable) : pas de déduction
  IF NOT FOUND OR v_sess.cancelled_at IS NOT NULL THEN
    DELETE FROM public.stock_movements WHERE reference = v_ref;
    RETURN;
  END IF;

  -- Produit de la carte : product_id d'abord, sinon le nom exact
  v_sales_product := s.product_id;
  IF v_sales_product IS NULL THEN
    SELECT id INTO v_sales_product FROM public.gh_sales_products
     WHERE lower(btrim(name)) = lower(btrim(s.product_name))
     ORDER BY is_active DESC LIMIT 1;
  END IF;

  SELECT m.stock_product_id, m.units_per_sale INTO v_stock_product, v_units
    FROM public.gh_sales_stock_map m
   WHERE m.sales_product_id = v_sales_product AND m.is_active;

  -- Pas de correspondance (Autre, forfaits…), quantité nulle, ou produit DV Vinum (Auto Vinum) : rien
  IF v_stock_product IS NULL
     OR COALESCE(s.quantity, 0) <= 0
     OR v_stock_product IN ('3baeb92d-bce0-470e-99c1-518228639237','c99836ce-cc8f-4703-a0d7-cde4ca0d0c45',
                            '971ba8f1-3095-4b43-a71d-cc0636ec9116','9d81ea06-0503-4c0c-8749-ef02e547ab30') THEN
    DELETE FROM public.stock_movements WHERE reference = v_ref;
    RETURN;
  END IF;

  v_qty := s.quantity * v_units;
  SELECT p.gm_id INTO v_gm FROM public.profiles p WHERE p.user_id = v_sess.gm_id LIMIT 1;
  v_notes := left(
    'Vente Pages VR' || CASE WHEN s.is_offered THEN ' (Offert)' ELSE '' END
    || ' - ' || COALESCE(v_sess.game, 'Session')
    || COALESCE(' - ' || NULLIF(btrim(v_sess.group_name), ''), '')
    || ' - ' || to_char(COALESCE(v_sess.session_date, (now() AT TIME ZONE 'Europe/Zurich')::date), 'DD/MM/YYYY')
    || ' - ' || s.product_name, 250);

  INSERT INTO public.stock_movements
    (product_id, movement_type, quantity, unit_price, reference, notes, event_id, gm_id, created_by)
  VALUES
    (v_stock_product, 'sale', -v_qty,
     CASE WHEN s.is_offered THEN 0 ELSE round(COALESCE(s.unit_price, 0) / v_units, 2) END,
     v_ref, v_notes, NULL, v_gm, v_sess.gm_id)
  ON CONFLICT (reference) WHERE reference LIKE 'GHS-%'
  DO UPDATE SET product_id = EXCLUDED.product_id,
                quantity   = EXCLUDED.quantity,
                unit_price = EXCLUDED.unit_price,
                notes      = EXCLUDED.notes,
                gm_id      = EXCLUDED.gm_id;
END;
$$;
REVOKE ALL ON FUNCTION public.gh_sync_session_sale_stock(uuid) FROM public, anon, authenticated;

-- 4) Trigger sur les lignes de vente (INSERT / UPDATE / DELETE)
CREATE OR REPLACE FUNCTION public.gh_session_sales_stock_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    IF TG_OP = 'DELETE' THEN
      DELETE FROM public.stock_movements WHERE reference = 'GHS-' || OLD.id::text;
    ELSE
      IF TG_OP = 'UPDATE' AND OLD.id <> NEW.id THEN
        DELETE FROM public.stock_movements WHERE reference = 'GHS-' || OLD.id::text;
      END IF;
      PERFORM public.gh_sync_session_sale_stock(NEW.id);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ne jamais bloquer l'encaissement Pages à cause du stock
    RAISE WARNING 'gh_session_sales -> stock: % (%)', SQLERRM, SQLSTATE;
  END;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_gh_session_sales_stock ON public.gh_session_sales;
CREATE TRIGGER trg_gh_session_sales_stock
  AFTER INSERT OR UPDATE OR DELETE ON public.gh_session_sales
  FOR EACH ROW EXECUTE FUNCTION public.gh_session_sales_stock_trigger();

-- 5) Annulation / désannulation d'une session : resynchroniser ses lignes
CREATE OR REPLACE FUNCTION public.gh_vr_sessions_cancel_stock_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record;
BEGIN
  IF NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at THEN
    BEGIN
      FOR r IN SELECT id FROM public.gh_session_sales WHERE session_id = NEW.id LOOP
        PERFORM public.gh_sync_session_sale_stock(r.id);
      END LOOP;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'gh_vr_sessions cancel -> stock: % (%)', SQLERRM, SQLSTATE;
    END;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_gh_vr_sessions_cancel_stock ON public.gh_vr_sessions;
CREATE TRIGGER trg_gh_vr_sessions_cancel_stock
  AFTER UPDATE OF cancelled_at ON public.gh_vr_sessions
  FOR EACH ROW EXECUTE FUNCTION public.gh_vr_sessions_cancel_stock_trigger();

-- 2026-11-12 — Fonctions trigger GHS : pas d'exécution directe par les rôles API (les triggers continuent de fonctionner).
-- Rollback : GRANT EXECUTE ON FUNCTION public.gh_session_sales_stock_trigger() TO anon, authenticated; (idem pour gh_vr_sessions_cancel_stock_trigger)
REVOKE ALL ON FUNCTION public.gh_session_sales_stock_trigger() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.gh_vr_sessions_cancel_stock_trigger() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.gh_sync_session_sale_stock(uuid) FROM public, anon, authenticated;
