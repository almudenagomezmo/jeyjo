-- RNF-009: multi-tenant isolation via RLS

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT customer_id FROM public.web_profiles WHERE id = auth.uid()
$$;

-- customers: authenticated users see only their company
CREATE POLICY customers_select_own ON public.customers
  FOR SELECT
  TO authenticated
  USING (id = public.current_customer_id());

CREATE POLICY customers_service_role_all ON public.customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- web_profiles: self only
CREATE POLICY web_profiles_select_own ON public.web_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY web_profiles_update_own ON public.web_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY web_profiles_service_role_all ON public.web_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- search_events: server/worker only (no authenticated policies)
CREATE POLICY search_events_service_role_all ON public.search_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- audit_log: append-only for service_role; no authenticated write policies
CREATE POLICY audit_log_insert_service ON public.audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY audit_log_select_service ON public.audit_log
  FOR SELECT
  TO service_role
  USING (true);

REVOKE UPDATE, DELETE ON public.audit_log FROM authenticated, anon;
