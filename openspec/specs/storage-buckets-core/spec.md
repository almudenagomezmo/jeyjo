# Storage buckets (core)

## Purpose

Supabase Storage buckets for public catalog media and private customer documents.

## Requirements

### Requirement: Public catalog media bucket exists

Supabase Storage SHALL define a bucket `catalog-media` (or documented equivalent name matching `SUPABASE_BUCKET` in cms) for product images uploaded in backoffice, with public read access for `GET` objects.

#### Scenario: Storefront renders own uploaded image

- **WHEN** a product references `imagen_propia_storage_path` under `catalog-media`
- **THEN** the public URL is reachable without authentication

### Requirement: Private documents bucket exists

Supabase Storage SHALL define a bucket `private-documents` with no public read; customer document PDFs are stored under `{customer_id}/**` and served via server-side signed URLs or authenticated streaming (change #37).

#### Scenario: Anonymous cannot list private invoices

- **WHEN** the `anon` role attempts to list objects in `private-documents`
- **THEN** access is denied

### Requirement: Storage policies align with RLS mindset

SQL policies on `storage.objects` SHALL scope write access to `authenticated` service paths and prevent cross-tenant object paths (path prefix includes `customer_id` where applicable for future document uploads).

#### Scenario: CMS upload uses configured bucket

- **WHEN** `apps/cms` runs with real Supabase S3 credentials per `apps/cms/docs/supabase.md`
- **THEN** Media collection uploads target `catalog-media` without additional manual bucket creation

### Requirement: Signed URL generation for customer document downloads

The platform SHALL implement server-side signed URL generation for objects in bucket `private-documents` scoped to `{customer_id}/**`, fulfilling the deferred implementation noted in change #2 (**storage-buckets-core**).

#### Scenario: Service role creates signed URL

- **WHEN** the document download service requests a signed URL for an existing object under the authenticated customer's prefix
- **THEN** Supabase returns a URL valid for at most 300 seconds
- **AND** the object remains inaccessible to `anon` without the signature

#### Scenario: Cross-customer path rejected

- **WHEN** a download is requested for a storage path whose `customer_id` prefix does not match the session customer
- **THEN** signed URL generation is not performed
- **AND** the API returns 404 or 403
