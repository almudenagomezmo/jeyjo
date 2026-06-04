-- ERP catalog read sync run metadata (change #7)

CREATE TABLE public.erp_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adapter text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  products_updated integer NOT NULL DEFAULT 0,
  suppliers_updated integer NOT NULL DEFAULT 0,
  pricing_rows_upserted integer NOT NULL DEFAULT 0,
  error_summary text
);

CREATE INDEX erp_sync_runs_started_at_idx
  ON public.erp_sync_runs (started_at DESC);

ALTER TABLE public.erp_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY erp_sync_runs_service_role_all ON public.erp_sync_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
