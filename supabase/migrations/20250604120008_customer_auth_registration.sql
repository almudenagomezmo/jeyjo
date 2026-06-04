-- Auth registration (RF-004) billing address + login lockout (CA-AUTH-004)

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS billing_address_line1 text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_postal_code text,
  ADD COLUMN IF NOT EXISTS billing_country text NOT NULL DEFAULT 'ES';

ALTER TABLE public.web_profiles
  ADD COLUMN IF NOT EXISTS failed_login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz;
