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
