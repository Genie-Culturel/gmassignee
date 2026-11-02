-- Add sales and payment tracking to sessions
-- Products catalog (admin-editable) and sales items per session

-- Payment method enum
CREATE TYPE payment_method AS ENUM ('twint', 'especes', 'carte', 'facture');

-- Sales products catalog (admin-editable)
CREATE TABLE sales_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  category TEXT, -- 'boisson', 'option', 'autre'
  description TEXT,
  min_quantity INTEGER, -- e.g. SVELTE min 4 pers
  max_quantity INTEGER, -- e.g. DODU max 12 pers
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales items for each session
CREATE TABLE session_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vr_sessions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES sales_products(id) ON DELETE SET NULL, -- nullable for custom items
  product_name TEXT NOT NULL, -- stored name (in case product is deleted)
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  payment_method payment_method NOT NULL,
  is_invoiced BOOLEAN NOT NULL DEFAULT FALSE, -- true if 'facture' (not collected on-site)
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add sales summary fields to vr_sessions
ALTER TABLE vr_sessions
  ADD COLUMN total_collected DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN total_to_invoice DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN sales_comment TEXT;

-- Indexes
CREATE INDEX idx_sales_products_is_active ON sales_products(is_active);
CREATE INDEX idx_session_sales_session_id ON session_sales(session_id);
CREATE INDEX idx_session_sales_payment_method ON session_sales(payment_method);

-- RLS Policies

-- Sales products: everyone reads active, admins manage
ALTER TABLE sales_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active products"
  ON sales_products FOR SELECT
  USING (is_active = TRUE);
CREATE POLICY "Admins can manage sales products"
  ON sales_products FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Session sales: owned by session's GM
ALTER TABLE session_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GMs can manage sales for their sessions"
  ON session_sales FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vr_sessions
      WHERE vr_sessions.id = session_sales.session_id
      AND vr_sessions.gm_id = auth.uid()
    )
  );
CREATE POLICY "Admins can read all session sales"
  ON session_sales FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger for updated_at
CREATE TRIGGER update_sales_products_updated_at
  BEFORE UPDATE ON sales_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_sales_updated_at
  BEFORE UPDATE ON session_sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed sales products from docs
INSERT INTO sales_products (name, unit_price, category, description, min_quantity, max_quantity, order_index) VALUES
-- Boissons (prix estimés, à ajuster)
('Coca-Cola', 4.00, 'boisson', 'Boisson fraîche', NULL, NULL, 1),
('Eau minérale', 3.00, 'boisson', 'Eau plate ou gazeuse', NULL, NULL, 2),
('Jus de fruits', 4.50, 'boisson', 'Différents parfums', NULL, NULL, 3),
('Café', 3.50, 'boisson', 'Café chaud', NULL, NULL, 4),

-- Options VR Center
('Planchettes', 20.00, 'option', 'Viande valaisanne, fromage, cornichons, oignons, pain de seigle - CHF 20.-/pers', NULL, NULL, 10),
('SVELTE', 55.00, 'option', '6 vins et mini-jeux « éveil des sens » avec encaveur, planchette taille repas - Environ 1h - Min. 4 pers.', 4, NULL, 11),
('DODU', 89.00, 'option', 'Comme SVELTE avec café et raclette à gogo - Min. 4, max. 12 pers.', 4, 12, 12),
('Pack Birthday', 15.00, 'option', '1h de célébration après le jeu, boisson sans alcool offerte, ballons, enceinte, diffusion photos/vidéos, gâteau apporté - CHF 15.-/pers (enfants 9-13 ans)', NULL, NULL, 13),
('EVJF Escape & Pole', 79.00, 'option', 'Planchette, initiation pole dance Air Pole, champagne - Min. 6 pers., environ 1h, session 9h30 ou 14h30', 6, NULL, 14),

-- Autre
('Autre', 0.00, 'autre', 'Produit ou service personnalisé (modifier le prix)', NULL, NULL, 99);

COMMENT ON TABLE sales_products IS 'Catalog of products and options available for sale during VR sessions';
COMMENT ON TABLE session_sales IS 'Sales items recorded per session with payment tracking';
COMMENT ON COLUMN session_sales.is_invoiced IS 'TRUE for "Facture entreprise" (to be invoiced, not collected on-site)';
