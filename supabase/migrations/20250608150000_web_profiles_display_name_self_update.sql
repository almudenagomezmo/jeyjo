-- Allow users to update their own display_name; fix service_role detection for admin updates.

CREATE OR REPLACE FUNCTION public.web_profiles_prevent_self_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text;
BEGIN
  jwt_role := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    nullif(current_setting('request.jwt.claim.role', true), ''),
    ''
  );

  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND (
    NEW.role IS DISTINCT FROM OLD.role
    OR NEW.permissions IS DISTINCT FROM OLD.permissions
    OR NEW.is_active IS DISTINCT FROM OLD.is_active
    OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
    OR NEW.parent_customer_id IS DISTINCT FROM OLD.parent_customer_id
    OR (
      NEW.display_name IS DISTINCT FROM OLD.display_name
      AND auth.uid() IS DISTINCT FROM OLD.id
    )
  ) THEN
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$;
