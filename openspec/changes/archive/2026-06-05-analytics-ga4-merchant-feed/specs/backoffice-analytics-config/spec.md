## ADDED Requirements

### Requirement: Staff can view analytics and merchant feed settings

The CMS SHALL provide a Payload global `analyticsSettings` accessible to staff with role `mantenimiento` or `superadmin` showing GA4 measurement ID reference, merchant feed enablement, public feed URL, and last generation timestamp, per **RF-028**.

#### Scenario: Maintenance role opens analytics settings

- **WHEN** a user with role `mantenimiento` opens the analytics settings global in admin
- **THEN** they see GA4 measurement ID (documentation field), merchant feed toggle, computed public feed URL, and `lastFeedGeneratedAt`

#### Scenario: Catalog role cannot edit analytics settings

- **WHEN** a user with only role `catalogo` attempts to access analytics settings
- **THEN** access is denied per staff roles RF-030

### Requirement: Analytics settings document runtime env precedence

The analytics settings UI SHALL document that Vercel environment variables (`NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_GA4_ENABLED`, `MERCHANT_FEED_ENABLED`) are the runtime source of truth and global fields are operational reference unless explicitly wired.

#### Scenario: Developer reads settings help text

- **WHEN** staff view the analytics settings global
- **THEN** inline help explains env vars override and links to `.env.example` entries

### Requirement: Feed health summary is visible to staff

The analytics settings or linked admin panel SHALL show counts of products included vs omitted from the last feed generation (missing image, missing price).

#### Scenario: Last feed omitted products

- **WHEN** the last cron run omitted 12 products for missing images
- **THEN** staff see omitted count 12 with reason breakdown on the analytics settings view
