-- ERP catalog Excel imports bucket + sync run source (change #29)

ALTER TABLE public.erp_sync_runs
  ADD COLUMN IF NOT EXISTS source text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'erp-imports',
    'erp-imports',
    false,
    15728640,
    ARRAY[
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  name = EXCLUDED.name,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY erp_imports_service_role_all ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'erp-imports')
  WITH CHECK (bucket_id = 'erp-imports');
