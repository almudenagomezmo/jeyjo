-- Wholesale stock sync run metadata (change #8)

CREATE TABLE public.stock_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  products_updated integer NOT NULL DEFAULT 0,
  distrisantiago_status text NOT NULL DEFAULT 'pending',
  arnoia_status text NOT NULL DEFAULT 'pending',
  error_summary text
);

CREATE INDEX stock_sync_runs_started_at_idx
  ON public.stock_sync_runs (started_at DESC);

ALTER TABLE public.stock_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_sync_runs_service_role_all ON public.stock_sync_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
