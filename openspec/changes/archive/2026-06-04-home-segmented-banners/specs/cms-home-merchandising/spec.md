## ADDED Requirements

### Requirement: Payload global home for storefront merchandising

Payload CMS SHALL expose a `home` global configuration document editable by staff with area `personalizacion`, containing promotional banners, featured categories, and curated product lists for storefront carousels.

#### Scenario: Staff opens home global in admin

- **WHEN** a staff user with personalizacion access opens Globals → Home in the Payload admin
- **THEN** they can edit banners, featured categories, and carousel product lists

#### Scenario: Staff without personalizacion cannot edit

- **WHEN** a staff user without personalizacion access attempts to update the home global
- **THEN** the update is denied by access control

### Requirement: Promotional banner fields with schedule

Each promotional banner entry in the home global SHALL include: linked media (image), destination URL, optional alt text, segment (`b2c`, `b2b`, or `both`), required `startAt` and `endAt` datetimes, and numeric `sortOrder`.

#### Scenario: Banner saved with valid dates

- **WHEN** staff saves a banner with `startAt` before `endAt`
- **THEN** the document persists successfully

#### Scenario: Invalid date range rejected

- **WHEN** staff sets `endAt` before `startAt`
- **THEN** validation fails with a clear error message

### Requirement: Featured categories relationship

The home global SHALL allow an ordered list of relationships to published `categories` entries (maximum six) used by the storefront featured category grid.

#### Scenario: Featured category references published category

- **WHEN** staff links a published category to featured categories
- **THEN** the relationship is stored with sort order preserved

### Requirement: Curated carousel product lists per segment

The home global SHALL provide separate ordered product relationship arrays for: top sales B2C, top sales B2B, and eco/sustainability highlight (maximum twelve products each), relating only to `products` collection entries.

#### Scenario: Curate B2B top sales list

- **WHEN** staff adds five published products to the top sales B2B carousel field
- **THEN** those five relationships are available to the storefront home API at depth sufficient to resolve SKU and slug

#### Scenario: Draft product in carousel not exposed publicly

- **WHEN** staff links a draft product to a carousel field
- **THEN** the storefront public home fetch excludes that product from rendered carousels

### Requirement: Home global readable via authenticated API

The home global SHALL be readable through Payload REST (`/api/globals/home`) for server-side storefront access using service credentials, not exposed to anonymous browsers without authentication.

#### Scenario: Storefront server fetch with secret

- **WHEN** the storefront server requests the home global with valid CMS credentials
- **THEN** the response includes banners, featured categories, and carousel product IDs

### Requirement: Optional seed data for local QA

The CMS seed routine SHALL optionally populate the home global with sample banners (including one expired and one active) and sample carousel products for local development verification.

#### Scenario: Seed creates sample home global

- **WHEN** `pnpm --filter cms seed` runs in development
- **THEN** the home global contains at least one active banner and one curated product per carousel type when stub products exist
