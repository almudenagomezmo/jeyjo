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
