## ADDED Requirements

### Requirement: Product DTO matches Jeyjo catalog ERP fields

The `@jeyjo/erp-ports` package SHALL define `ErpProductDto` with fields required to populate Payload product ERP tab: `skuErp`, `mainWholesaleRef`, `oemRef`, `ean`, `shortDescription`, `p1Price`, `p2Price`, `vatRate`, `packUnit`, `isWildcard`, `allowOrderWithoutStock`, optional `erpStock`, and optional `supplierErpCode`.

#### Scenario: DTO maps to Payload ERP fields

- **WHEN** `mapErpProductDtoToPayload` runs in the CMS with a complete DTO
- **THEN** the output object keys align one-to-one with Payload field names in `erpFields.ts`

### Requirement: Supplier DTO matches suppliers collection

The package SHALL define `ErpSupplierDto` with at minimum `erpCode`, `name`, `type`, and `baseImageUrl`.

#### Scenario: Supplier DTO maps to Payload

- **WHEN** a sync service applies an `ErpSupplierDto` with `erpCode` "DIST-01"
- **THEN** the CMS can upsert the `suppliers` collection keyed by `erpCode`

### Requirement: DTOs are serialization-safe

DTO types SHALL use plain JSON-serializable primitives (string, number, boolean, ISO date strings) so they can cross process boundaries and audit logs.

#### Scenario: Audit log can store DTO snapshot

- **WHEN** an ERP sync operation logs `valorNuevo` for a product update
- **THEN** the logged JSON is parseable without class instances or Buffer types
