## ADDED Requirements

### Requirement: Brands collection models commercial manufacturer identity

The CMS SHALL expose a Payload `brands` collection with at minimum `name` (required) and optional unique `slug`, grouped under **Catálogo** in the admin navigation.

#### Scenario: Staff creates a brand

- **WHEN** a staff user with catalog access creates a brand with name "BIC"
- **THEN** the brand is persisted and appears in the brands admin list

#### Scenario: Duplicate brand slug rejected

- **WHEN** two brands are saved with the same slug
- **THEN** validation fails with a duplicate slug error

### Requirement: Products reference zero or one brand

The CMS `products` collection SHALL include an optional relationship field `brand` with `relationTo: 'brands'` allowing at most one linked brand per product (0..1 cardinality).

#### Scenario: Product without brand

- **WHEN** a staff user saves a product without selecting a brand
- **THEN** the product persists with `brand` unset

#### Scenario: Product assigned to one brand

- **WHEN** a staff user selects brand "BIC" on a product
- **THEN** the product stores the brand relationship
- **AND** the brand appears in product admin columns or sidebar

### Requirement: Brand collection is staff-only with audit trail

Access to create, read, update, and delete on `brands` SHALL require Payload staff authentication with the same role rules as `suppliers` and `categories`. Create, update, and delete on `brands` SHALL append rows to the audit log.

#### Scenario: Unauthenticated API request denied

- **WHEN** an unauthenticated client calls the Payload REST API to create a brand
- **THEN** the request is rejected with an authorization error

#### Scenario: Brand update audited

- **WHEN** staff updates a brand name
- **THEN** an audit log entry records the change with entity type `brands`
