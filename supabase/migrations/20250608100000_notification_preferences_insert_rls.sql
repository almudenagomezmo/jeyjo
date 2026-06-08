-- Fix: authenticated users could SELECT/UPDATE own notification_preferences but not INSERT.
-- Profiles validated/reclassified after creation never got a row (trigger only ran on INSERT).

CREATE POLICY notification_preferences_insert_own ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (web_profile_id = auth.uid());

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

DROP TRIGGER IF EXISTS web_profiles_ensure_notification_preferences_update ON public.web_profiles;

CREATE TRIGGER web_profiles_ensure_notification_preferences_update
  AFTER UPDATE OF role ON public.web_profiles
  FOR EACH ROW
  WHEN (NEW.role IN ('b2b_superadmin', 'b2b_subuser'))
  EXECUTE FUNCTION public.ensure_notification_preferences();

INSERT INTO public.notification_preferences (web_profile_id)
SELECT id
FROM public.web_profiles
WHERE role IN ('b2b_superadmin', 'b2b_subuser')
ON CONFLICT (web_profile_id) DO NOTHING;
