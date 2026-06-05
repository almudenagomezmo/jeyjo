## ADDED Requirements

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
