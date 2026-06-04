-- Pricing engine tables (RF-007): special prices and group offers

CREATE TABLE public.special_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  product_sku text NOT NULL,
  net_price numeric(12, 6) NOT NULL CHECK (net_price >= 0),
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX special_prices_customer_sku_idx
  ON public.special_prices (customer_id, product_sku);

CREATE INDEX special_prices_validity_idx
  ON public.special_prices (customer_id, product_sku, valid_from, valid_to);

CREATE TABLE public.group_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_erp text NOT NULL,
  offer_net_price numeric(12, 6) NOT NULL CHECK (offer_net_price >= 0),
  customer_group smallint CHECK (customer_group IS NULL OR customer_group BETWEEN 1 AND 4),
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_to date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX group_offers_sku_active_idx
  ON public.group_offers (sku_erp)
  WHERE active = true;

CREATE TRIGGER special_prices_set_updated_at
  BEFORE UPDATE ON public.special_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.special_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY special_prices_service_role_all ON public.special_prices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY group_offers_service_role_all ON public.group_offers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY group_offers_authenticated_select ON public.group_offers
  FOR SELECT
  TO authenticated, anon
  USING (active = true);
