## MODIFIED Requirements

### Requirement: PDF bytes are cached in private-documents on first download

When `webNativeMode` is true, PDF bytes for customer documents SHALL originate from staff uploads stored in Supabase Storage `private-documents/{customer_id}/` at document create/update time. The cache resolver SHALL serve uploaded bytes via signed URLs without fetching from `ErpDocumentsReader`.

#### Scenario: Uploaded PDF served on download

- **WHEN** staff uploaded a PDF for document id D1 and an authorized B2B user downloads the PDF
- **THEN** the response body matches the uploaded file bytes

#### Scenario: No ERP fetch in web-native mode

- **WHEN** `webNativeMode` is true and PDF download is requested
- **THEN** `ErpDocumentsReader.getDocumentPdf` is not invoked

#### Scenario: Missing upload returns not found

- **WHEN** a document record exists but Storage object is missing
- **THEN** download returns 404
