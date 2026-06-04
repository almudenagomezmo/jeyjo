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
