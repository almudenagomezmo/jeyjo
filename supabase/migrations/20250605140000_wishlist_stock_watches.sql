-- Wishlist stock watches and notification extensions (wishlist-stock-alerts, alcance §1.21)

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'stock_available';

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS wishlist_channel public.notification_channel NOT NULL DEFAULT 'email';

CREATE TABLE public.stock_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  web_profile_id uuid NOT NULL REFERENCES public.web_profiles (id) ON DELETE CASCADE,
  sku text NOT NULL,
  product_title text,
  last_indicator text,
  last_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stock_watches_profile_sku_unique UNIQUE (web_profile_id, sku)
);

CREATE INDEX stock_watches_sku_idx ON public.stock_watches (sku);

ALTER TABLE public.stock_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_watches_select_own ON public.stock_watches
  FOR SELECT
  TO authenticated
  USING (web_profile_id = auth.uid());

CREATE POLICY stock_watches_insert_own ON public.stock_watches
  FOR INSERT
  TO authenticated
  WITH CHECK (web_profile_id = auth.uid());

CREATE POLICY stock_watches_delete_own ON public.stock_watches
  FOR DELETE
  TO authenticated
  USING (web_profile_id = auth.uid());

CREATE POLICY stock_watches_service_role_all ON public.stock_watches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
