-- Abandoned cart snapshots for marketing recovery (RF-027, US-23)

CREATE TABLE public.abandoned_cart_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  web_profile_id uuid NOT NULL UNIQUE REFERENCES public.web_profiles (id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'abandoned')),
  first_email_sent_at timestamptz,
  second_email_sent_at timestamptz,
  recovery_coupon_id text,
  converted_order_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX abandoned_cart_snapshots_status_activity_idx
  ON public.abandoned_cart_snapshots (status, last_activity_at DESC);

CREATE INDEX abandoned_cart_snapshots_customer_idx
  ON public.abandoned_cart_snapshots (customer_id);

CREATE TRIGGER abandoned_cart_snapshots_set_updated_at
  BEFORE UPDATE ON public.abandoned_cart_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.abandoned_cart_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY abandoned_cart_snapshots_select_own
  ON public.abandoned_cart_snapshots
  FOR SELECT
  TO authenticated
  USING (web_profile_id = auth.uid());
