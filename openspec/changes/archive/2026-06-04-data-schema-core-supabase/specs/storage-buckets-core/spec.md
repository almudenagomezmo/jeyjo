## ADDED Requirements

### Requirement: Public catalog media bucket exists

Supabase Storage SHALL define a bucket `catalog-media` (or documented equivalent name matching `SUPABASE_BUCKET` in cms) for product images uploaded in backoffice, with public read access for `GET` objects.

#### Scenario: Storefront renders own uploaded image

- **WHEN** a product references `imagen_propia_storage_path` under `catalog-media`
- **THEN** the public URL is reachable without authentication

### Requirement: Private documents bucket exists

Supabase Storage SHALL define a bucket `private-documents` with no public read; access requires signed URLs generated server-side (implementation in change #37).

#### Scenario: Anonymous cannot list private invoices

- **WHEN** the `anon` role attempts to list objects in `private-documents`
- **THEN** access is denied

### Requirement: Storage policies align with RLS mindset

SQL policies on `storage.objects` SHALL scope write access to `authenticated` service paths and prevent cross-tenant object paths (path prefix includes `customer_id` where applicable for future document uploads).

#### Scenario: CMS upload uses configured bucket

- **WHEN** `apps/cms` runs with real Supabase S3 credentials per `apps/cms/docs/supabase.md`
- **THEN** Media collection uploads target `catalog-media` without additional manual bucket creation
