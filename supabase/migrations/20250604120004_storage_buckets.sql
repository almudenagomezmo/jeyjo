-- Storage buckets: public catalog media + private documents

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('catalog-media', 'catalog-media', true, null, null),
  ('private-documents', 'private-documents', false, null, null)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  name = EXCLUDED.name;

CREATE POLICY catalog_media_public_read ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'catalog-media');

CREATE POLICY catalog_media_service_role_all ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'catalog-media')
  WITH CHECK (bucket_id = 'catalog-media');

CREATE POLICY private_documents_service_role_all ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'private-documents')
  WITH CHECK (bucket_id = 'private-documents');
