-- =============================================================================
-- Jeyjo: esquema núcleo completo para Supabase SQL Editor
-- Proyecto: tqgrsofvlkyumagrqbqa
-- Generado: 2026-06-05
--
-- INSTRUCCIONES:
-- 1. Supabase Dashboard → SQL Editor → New query
-- 2. Pega y ejecuta este archivo completo (Run)
--    Si hay timeout, ejecuta sección por sección (busca "-- MIGRATION:")
-- 3. Comprueba:
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public' AND table_name IN ('customers','web_profiles');
--
-- Migraciones incluidas (19):
--   - 20250604120000_extensions_enums.sql
--   - 20250604120001_core_tenant_tables.sql
--   - 20250604120002_search_events_audit_log.sql
--   - 20250604120003_audit_log_filter_indexes.sql
--   - 20250604120004_storage_buckets.sql
--   - 20250604120005_pricing_tables.sql
--   - 20250604120006_erp_sync_runs.sql
--   - 20250604120007_stock_sync_runs.sql
--   - 20250604120008_customer_auth_registration.sql
--   - 20250604120009_customer_addresses.sql
--   - 20250604120031_row_level_security.sql
--   - 20250604130000_payment_notifications.sql
--   - 20250604140000_b2b_notifications.sql
--   - 20250604140001_b2b_subusers_permissions.sql
--   - 20250605120000_erp_imports_storage_and_sync_source.sql
--   - 20250605120001_storefront_analytics_sessions.sql
--   - 20250605130000_abandoned_cart_snapshots.sql
--   - 20250605140000_wishlist_stock_watches.sql
--   - 20250605150000_newsletter_subscribers.sql
-- =============================================================================



-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604120000_extensions_enums.sql
-- -----------------------------------------------------------------------------

-- Jeyjo core schema: extensions and enums
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.web_profile_role AS ENUM (
  'b2c',
  'b2b_superadmin',
  'b2b_subuser',
  'pending'
);

CREATE TYPE public.search_event_status AS ENUM (
  'pending',
  'processing',
  'done',
  'error'
);


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604120001_core_tenant_tables.sql
-- -----------------------------------------------------------------------------

-- Customers (CLIENTE) and web profiles (USUARIO_WEB / Supabase Auth link)

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_code text,
  commercial_name text NOT NULL,
  legal_name text,
  tax_id text,
  email text NOT NULL,
  phone text,
  customer_group smallint NOT NULL DEFAULT 1 CHECK (customer_group BETWEEN 1 AND 4),
  billing_series text,
  general_discount numeric(12, 6) NOT NULL DEFAULT 0 CHECK (general_discount >= 0),
  default_payment_method text,
  is_company boolean NOT NULL DEFAULT false,
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX customers_tax_id_validated_unique
  ON public.customers (tax_id)
  WHERE validated_at IS NOT NULL AND tax_id IS NOT NULL;

CREATE INDEX customers_email_idx ON public.customers (email);

CREATE TABLE public.web_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.web_profile_role NOT NULL DEFAULT 'pending',
  mfa_enabled boolean NOT NULL DEFAULT false,
  parent_customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX web_profiles_customer_id_idx ON public.web_profiles (customer_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER web_profiles_set_updated_at
  BEFORE UPDATE ON public.web_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604120002_search_events_audit_log.sql
-- -----------------------------------------------------------------------------

-- Async search indexing queue (RF-009) and immutable audit log

CREATE TABLE public.search_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('upsert', 'delete')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.search_event_status NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX search_events_status_created_at_idx
  ON public.search_events (status, created_at);

CREATE INDEX search_events_entity_idx
  ON public.search_events (entity_type, entity_id);

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  source_ip inet
);

CREATE INDEX audit_log_created_at_idx ON public.audit_log (created_at DESC);


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604120003_audit_log_filter_indexes.sql
-- -----------------------------------------------------------------------------

-- Filter indexes for audit console queries (RF-029)

CREATE INDEX IF NOT EXISTS audit_log_actor_created_at_idx
  ON public.audit_log (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_entity_type_created_at_idx
  ON public.audit_log (entity_type, created_at DESC);


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604120004_storage_buckets.sql
-- -----------------------------------------------------------------------------

-- Storage buckets: public catalog media + private documents

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('catalog-media', 'catalog-media', true, null, null),
  ('private-documents', 'private-documents', false, null, null)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  name = EXCLUDED.name;

CREATE POLICY catalog_media_public_read ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'catalog-media');

CREATE POLICY catalog_media_service_role_all ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'catalog-media')
  WITH CHECK (bucket_id = 'catalog-media');

CREATE POLICY private_documents_service_role_all ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'private-documents')
  WITH CHECK (bucket_id = 'private-documents');


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604120005_pricing_tables.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604120006_erp_sync_runs.sql
-- -----------------------------------------------------------------------------

-- ERP catalog read sync run metadata (change #7)

CREATE TABLE public.erp_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adapter text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  products_updated integer NOT NULL DEFAULT 0,
  suppliers_updated integer NOT NULL DEFAULT 0,
  pricing_rows_upserted integer NOT NULL DEFAULT 0,
  error_summary text
);

CREATE INDEX erp_sync_runs_started_at_idx
  ON public.erp_sync_runs (started_at DESC);

ALTER TABLE public.erp_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY erp_sync_runs_service_role_all ON public.erp_sync_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604120007_stock_sync_runs.sql
-- -----------------------------------------------------------------------------

-- Wholesale stock sync run metadata (change #8)

CREATE TABLE public.stock_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  products_updated integer NOT NULL DEFAULT 0,
  distrisantiago_status text NOT NULL DEFAULT 'pending',
  arnoia_status text NOT NULL DEFAULT 'pending',
  error_summary text
);

CREATE INDEX stock_sync_runs_started_at_idx
  ON public.stock_sync_runs (started_at DESC);

ALTER TABLE public.stock_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_sync_runs_service_role_all ON public.stock_sync_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604120008_customer_auth_registration.sql
-- -----------------------------------------------------------------------------

-- Auth registration (RF-004) billing address + login lockout (CA-AUTH-004)

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS billing_address_line1 text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_postal_code text,
  ADD COLUMN IF NOT EXISTS billing_country text NOT NULL DEFAULT 'ES';

ALTER TABLE public.web_profiles
  ADD COLUMN IF NOT EXISTS failed_login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz;


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604120009_customer_addresses.sql
-- -----------------------------------------------------------------------------

-- Customer shipping addresses (checkout US-04)

CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  label text,
  recipient_name text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  postal_code text NOT NULL,
  country char(2) NOT NULL DEFAULT 'ES',
  phone text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_addresses_customer_id_idx ON public.customer_addresses (customer_id);

CREATE TRIGGER customer_addresses_set_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- At most one default per customer
CREATE OR REPLACE FUNCTION public.customer_addresses_enforce_single_default()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.customer_addresses
    SET is_default = false
    WHERE customer_id = NEW.customer_id
      AND id IS DISTINCT FROM NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER customer_addresses_single_default
  AFTER INSERT OR UPDATE OF is_default ON public.customer_addresses
  FOR EACH ROW
  WHEN (NEW.is_default)
  EXECUTE FUNCTION public.customer_addresses_enforce_single_default();

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_addresses_select_own ON public.customer_addresses
  FOR SELECT
  TO authenticated
  USING (customer_id = public.current_customer_id());

CREATE POLICY customer_addresses_insert_own ON public.customer_addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = public.current_customer_id());

CREATE POLICY customer_addresses_update_own ON public.customer_addresses
  FOR UPDATE
  TO authenticated
  USING (customer_id = public.current_customer_id())
  WITH CHECK (customer_id = public.current_customer_id());

CREATE POLICY customer_addresses_delete_own ON public.customer_addresses
  FOR DELETE
  TO authenticated
  USING (customer_id = public.current_customer_id());

CREATE POLICY customer_addresses_service_role_all ON public.customer_addresses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604120031_row_level_security.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604130000_payment_notifications.sql
-- -----------------------------------------------------------------------------

-- Redsys payment notification idempotency and audit (payments-redsys-wallets)

CREATE TABLE public.payment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference text NOT NULL,
  signature text NOT NULL,
  gateway text NOT NULL DEFAULT 'redsys',
  response_code text,
  raw_parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payment_notifications_signature_unique_idx
  ON public.payment_notifications (signature);

CREATE INDEX payment_notifications_order_reference_idx
  ON public.payment_notifications (order_reference);


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604140000_b2b_notifications.sql
-- -----------------------------------------------------------------------------

-- B2B proactive notifications (notifications-center-email, RF-022)

CREATE TYPE public.notification_channel AS ENUM ('email', 'portal', 'off');

CREATE TYPE public.notification_type AS ENUM (
  'invoice_new',
  'order_status',
  'quote_status',
  'quote_expiring'
);

CREATE TABLE public.notification_preferences (
  web_profile_id uuid PRIMARY KEY REFERENCES public.web_profiles (id) ON DELETE CASCADE,
  invoice_channel public.notification_channel NOT NULL DEFAULT 'email',
  order_channel public.notification_channel NOT NULL DEFAULT 'email',
  quote_channel public.notification_channel NOT NULL DEFAULT 'email',
  email_disabled_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER notification_preferences_set_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  web_profile_id uuid NOT NULL REFERENCES public.web_profiles (id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  email_sent_at timestamptz,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_profile_idempotency_unique UNIQUE (web_profile_id, idempotency_key)
);

CREATE INDEX notifications_profile_unread_idx
  ON public.notifications (web_profile_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX notifications_profile_created_idx
  ON public.notifications (web_profile_id, created_at DESC);

CREATE TABLE public.erp_invoice_sync_state (
  customer_id uuid PRIMARY KEY REFERENCES public.customers (id) ON DELETE CASCADE,
  known_invoice_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_synced_at timestamptz NOT NULL DEFAULT now()
);

-- Default preferences for new B2B profiles
CREATE OR REPLACE FUNCTION public.ensure_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('b2b_superadmin', 'b2b_subuser') THEN
    INSERT INTO public.notification_preferences (web_profile_id)
    VALUES (NEW.id)
    ON CONFLICT (web_profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER web_profiles_ensure_notification_preferences
  AFTER INSERT ON public.web_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_notification_preferences();

INSERT INTO public.notification_preferences (web_profile_id)
SELECT id
FROM public.web_profiles
WHERE role IN ('b2b_superadmin', 'b2b_subuser')
ON CONFLICT (web_profile_id) DO NOTHING;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_invoice_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT
  TO authenticated
  USING (web_profile_id = auth.uid());

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (web_profile_id = auth.uid())
  WITH CHECK (web_profile_id = auth.uid());

CREATE POLICY notifications_service_role_all ON public.notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY notification_preferences_select_own ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (web_profile_id = auth.uid());

CREATE POLICY notification_preferences_update_own ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (web_profile_id = auth.uid())
  WITH CHECK (web_profile_id = auth.uid());

CREATE POLICY notification_preferences_service_role_all ON public.notification_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY erp_invoice_sync_state_service_role_all ON public.erp_invoice_sync_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250604140001_b2b_subusers_permissions.sql
-- -----------------------------------------------------------------------------

-- B2B subusers: display_name, is_active, RLS, privilege escalation guard, create RPC (RF-003, US-12)

ALTER TABLE public.web_profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS web_profiles_company_subusers_idx
  ON public.web_profiles (customer_id)
  WHERE role = 'b2b_subuser';

CREATE OR REPLACE FUNCTION public.is_b2b_superadmin_of_company(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.web_profiles me
    WHERE me.id = auth.uid()
      AND me.role = 'b2b_superadmin'
      AND me.customer_id = p_company_id
      AND me.is_active = true
  );
$$;

CREATE POLICY web_profiles_select_company_subusers ON public.web_profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'b2b_subuser'
    AND customer_id = public.current_customer_id()
    AND public.is_b2b_superadmin_of_company(customer_id)
  );

CREATE OR REPLACE FUNCTION public.web_profiles_prevent_self_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND (
    NEW.role IS DISTINCT FROM OLD.role
    OR NEW.permissions IS DISTINCT FROM OLD.permissions
    OR NEW.is_active IS DISTINCT FROM OLD.is_active
    OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
    OR NEW.parent_customer_id IS DISTINCT FROM OLD.parent_customer_id
    OR NEW.display_name IS DISTINCT FROM OLD.display_name
  ) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS web_profiles_prevent_privilege_escalation ON public.web_profiles;

CREATE TRIGGER web_profiles_prevent_privilege_escalation
  BEFORE UPDATE ON public.web_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.web_profiles_prevent_self_privilege_escalation();

CREATE OR REPLACE FUNCTION public.create_b2b_subuser(
  p_user_id uuid,
  p_customer_id uuid,
  p_email text,
  p_display_name text,
  p_permissions jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'create_b2b_subuser requires service_role';
  END IF;

  INSERT INTO public.web_profiles (
    id,
    customer_id,
    email,
    role,
    display_name,
    permissions,
    parent_customer_id,
    is_active
  ) VALUES (
    p_user_id,
    p_customer_id,
    lower(trim(p_email)),
    'b2b_subuser',
    nullif(trim(p_display_name), ''),
    coalesce(p_permissions, '{}'::jsonb),
    p_customer_id,
    true
  );

  RETURN p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_b2b_subuser(uuid, uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_b2b_subuser(uuid, uuid, text, text, jsonb) TO service_role;


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250605120000_erp_imports_storage_and_sync_source.sql
-- -----------------------------------------------------------------------------

-- ERP catalog Excel imports bucket + sync run source (change #29)

ALTER TABLE public.erp_sync_runs
  ADD COLUMN IF NOT EXISTS source text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'erp-imports',
    'erp-imports',
    false,
    15728640,
    ARRAY[
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  name = EXCLUDED.name,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY erp_imports_service_role_all ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'erp-imports')
  WITH CHECK (bucket_id = 'erp-imports');


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250605120001_storefront_analytics_sessions.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250605130000_abandoned_cart_snapshots.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250605140000_wishlist_stock_watches.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- MIGRATION: 20250605150000_newsletter_subscribers.sql
-- -----------------------------------------------------------------------------

-- Newsletter subscription (newsletter-subscription, alcance §1.14)

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_normalized text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  confirm_token text NOT NULL,
  unsubscribe_token text NOT NULL,
  consent_at timestamptz NOT NULL,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text NOT NULL DEFAULT 'footer'
    CHECK (source IN ('footer', 'account')),
  web_profile_id uuid REFERENCES public.web_profiles (id) ON DELETE SET NULL,
  esp_contact_id text,
  esp_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscribers_email_normalized_unique UNIQUE (email_normalized)
);

CREATE INDEX newsletter_subscribers_status_created_idx
  ON public.newsletter_subscribers (status, created_at DESC);

CREATE TABLE public.newsletter_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key text NOT NULL,
  hit_count integer NOT NULL DEFAULT 1,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_rate_limits_bucket_unique UNIQUE (bucket_key)
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY newsletter_subscribers_service_role_all ON public.newsletter_subscribers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY newsletter_rate_limits_service_role_all ON public.newsletter_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- FIN — Registro en historial de migraciones (opcional, para alinear con CLI)
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version text PRIMARY KEY,
  statements text[],
  name text
);

INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
VALUES
  ('20250604120000', '{}'::text[], '20250604120000_extensions_enums.sql'),
  ('20250604120001', '{}'::text[], '20250604120001_core_tenant_tables.sql'),
  ('20250604120002', '{}'::text[], '20250604120002_search_events_audit_log.sql'),
  ('20250604120003', '{}'::text[], '20250604120003_audit_log_filter_indexes.sql'),
  ('20250604120004', '{}'::text[], '20250604120004_storage_buckets.sql'),
  ('20250604120005', '{}'::text[], '20250604120005_pricing_tables.sql'),
  ('20250604120006', '{}'::text[], '20250604120006_erp_sync_runs.sql'),
  ('20250604120007', '{}'::text[], '20250604120007_stock_sync_runs.sql'),
  ('20250604120008', '{}'::text[], '20250604120008_customer_auth_registration.sql'),
  ('20250604120009', '{}'::text[], '20250604120009_customer_addresses.sql'),
  ('20250604120031', '{}'::text[], '20250604120031_row_level_security.sql'),
  ('20250604130000', '{}'::text[], '20250604130000_payment_notifications.sql'),
  ('20250604140000', '{}'::text[], '20250604140000_b2b_notifications.sql'),
  ('20250604140001', '{}'::text[], '20250604140001_b2b_subusers_permissions.sql'),
  ('20250605120000', '{}'::text[], '20250605120000_erp_imports_storage_and_sync_source.sql'),
  ('20250605120001', '{}'::text[], '20250605120001_storefront_analytics_sessions.sql'),
  ('20250605130000', '{}'::text[], '20250605130000_abandoned_cart_snapshots.sql'),
  ('20250605140000', '{}'::text[], '20250605140000_wishlist_stock_watches.sql'),
  ('20250605150000', '{}'::text[], '20250605150000_newsletter_subscribers.sql')
ON CONFLICT (version) DO NOTHING;
