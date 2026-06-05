-- Repair tables dropped by Payload schema push (search indexer / audit log)

CREATE TABLE IF NOT EXISTS public.search_events (
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

CREATE INDEX IF NOT EXISTS search_events_status_created_at_idx
  ON public.search_events (status, created_at);

CREATE INDEX IF NOT EXISTS search_events_entity_idx
  ON public.search_events (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS public.audit_log (
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

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_actor_created_at_idx
  ON public.audit_log (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_entity_type_created_at_idx
  ON public.audit_log (entity_type, created_at DESC);

ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'search_events' AND policyname = 'search_events_service_role_all'
  ) THEN
    CREATE POLICY search_events_service_role_all ON public.search_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_log' AND policyname = 'audit_log_insert_service'
  ) THEN
    CREATE POLICY audit_log_insert_service ON public.audit_log
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_log' AND policyname = 'audit_log_select_service'
  ) THEN
    CREATE POLICY audit_log_select_service ON public.audit_log
      FOR SELECT
      TO service_role
      USING (true);
  END IF;
END $$;

REVOKE UPDATE, DELETE ON public.audit_log FROM authenticated, anon;
