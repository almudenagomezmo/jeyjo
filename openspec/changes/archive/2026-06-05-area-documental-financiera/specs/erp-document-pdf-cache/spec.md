## ADDED Requirements

### Requirement: PDF objects stored under customer prefix

When a document PDF is fetched from ERP for portal download, the system SHALL store it in Supabase bucket `private-documents` at path `{customer_id}/{documentType}/{documentId}.pdf` using the service role. Objects SHALL not be publicly readable.

#### Scenario: First download uploads to private-documents

- **WHEN** customer C1 downloads invoice INV-001 for the first time
- **THEN** an object exists at `private-documents/C1/invoice/INV-001.pdf`
- **AND** anonymous list on that bucket is denied

#### Scenario: Repeat download reuses cached object

- **WHEN** the same customer requests the same invoice PDF again within cache TTL
- **THEN** the system serves from storage without calling ERP again unless `forceRefresh` is set by staff tooling (out of scope)

### Requirement: Signed URLs for browser download

The storefront SHALL generate time-limited signed URLs (maximum 300 seconds) for authorized B2B users to download cached PDFs. Direct permanent public URLs SHALL NOT be exposed.

#### Scenario: Authorized user receives signed URL

- **WHEN** a B2B user with `finance: true` calls `GET /api/intranet/documents/invoices/{id}/pdf`
- **THEN** the response includes a signed URL or streams PDF bytes over HTTPS
- **AND** the URL expires within five minutes if signed

#### Scenario: Signed URL not issued without finance permission

- **WHEN** a subuser with `finance: false` requests the same endpoint
- **THEN** the response status is 403

### Requirement: Cache invalidation on ERP document revision

When ERP returns a newer `documentVersion` or `updatedAt` than stored metadata, the cache layer SHALL replace the object at the same path before issuing a new signed URL.

#### Scenario: Revised invoice replaces stale PDF

- **WHEN** ERP reports invoice INV-001 updated after the cached `storedAt`
- **THEN** the next download overwrites the storage object with fresh bytes
