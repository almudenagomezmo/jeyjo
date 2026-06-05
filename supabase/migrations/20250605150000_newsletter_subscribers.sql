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
