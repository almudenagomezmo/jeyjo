## ADDED Requirements

### Requirement: Customer shipping addresses table

The database SHALL expose `public.customer_addresses` with: `id` (uuid PK), `customer_id` (FK to `customers` ON DELETE CASCADE), `label` (text), `recipient_name` (text), `address_line1` (text NOT NULL), `address_line2` (text nullable), `city` (text NOT NULL), `postal_code` (text NOT NULL), `country` (char(2) default `ES`), `phone` (text nullable), `is_default` (boolean default false), `created_at`, `updated_at`.

#### Scenario: Address belongs to one customer

- **WHEN** a row is inserted into `customer_addresses`
- **THEN** `customer_id` references an existing `customers.id`

#### Scenario: RLS restricts to owner

- **WHEN** an authenticated `web_profiles` user queries addresses
- **THEN** only rows with matching `customer_id` are visible or mutable

#### Scenario: Default uniqueness per customer

- **WHEN** a user sets an address as default
- **THEN** at most one row per `customer_id` has `is_default` true at any time
