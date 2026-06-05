-- Storefront session heartbeats for dashboard KPIs (change #30 dashboard-kpis-alerts)

CREATE TABLE public.storefront_sessions (
  session_id uuid PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  user_agent_hash text
);

CREATE INDEX storefront_sessions_last_seen_at_idx
  ON public.storefront_sessions (last_seen_at DESC);

CREATE INDEX storefront_sessions_first_seen_at_idx
  ON public.storefront_sessions (first_seen_at DESC);

CREATE TABLE public.storefront_cart_activity (
  session_id uuid PRIMARY KEY REFERENCES public.storefront_sessions (session_id) ON DELETE CASCADE,
  line_count integer NOT NULL DEFAULT 0,
  total_qty integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX storefront_cart_activity_updated_at_idx
  ON public.storefront_cart_activity (updated_at DESC);

ALTER TABLE public.storefront_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_cart_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY storefront_sessions_service_role_all ON public.storefront_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY storefront_cart_activity_service_role_all ON public.storefront_cart_activity
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional maintenance (v1): DELETE FROM storefront_sessions WHERE last_seen_at < now() - interval '90 days';
