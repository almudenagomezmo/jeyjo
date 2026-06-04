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
