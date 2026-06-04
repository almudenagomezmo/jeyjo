-- Filter indexes for audit console queries (RF-029)

CREATE INDEX IF NOT EXISTS audit_log_actor_created_at_idx
  ON public.audit_log (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_entity_type_created_at_idx
  ON public.audit_log (entity_type, created_at DESC);
