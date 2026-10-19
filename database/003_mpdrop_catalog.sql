-- Staging area only: imported supplier catalog is never published automatically.
CREATE TABLE IF NOT EXISTS supplier_catalog_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL DEFAULT 'MP DROP',
  supplier_sku text NOT NULL,
  product_name text NOT NULL,
  category text NOT NULL DEFAULT '',
  supplier_cost_cents integer NOT NULL CHECK (supplier_cost_cents >= 0),
  stock_quantity integer CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  suggested_price_cents integer CHECK (suggested_price_cents IS NULL OR suggested_price_cents >= 0),
  weight_grams integer CHECK (weight_grams IS NULL OR weight_grams >= 0),
  source_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_name, supplier_sku)
);
CREATE INDEX IF NOT EXISTS idx_supplier_catalog_imports_updated
  ON supplier_catalog_imports (supplier_name, imported_at DESC);
