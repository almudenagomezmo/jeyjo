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
