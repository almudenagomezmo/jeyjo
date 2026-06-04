# Core tenant tables

## Purpose

PostgreSQL tables for B2C/B2B customers and web user profiles linked to Supabase Auth, coexisting with Payload CMS in the same database.

## Requirements

### Requirement: Customers table stores B2C/B2B account master data

The database SHALL expose a `public.customers` table aligned with the architecture model CLIENTE, including at minimum: `id` (uuid PK), `erp_code` (nullable until sync), `commercial_name`, `legal_name`, `tax_id` (CIF/NIF), `email`, `phone`, `customer_group` (integer 01–04), `billing_series`, `general_discount` (numeric), `default_payment_method`, `is_company`, `validated_at` (nullable), `created_at`, `updated_at`.

#### Scenario: Pending registration before validation

- **WHEN** a new customer registers via storefront (future change #16)
- **THEN** a row is inserted with `customer_group = 1` (B2C default) and `validated_at` IS NULL until backoffice validation

#### Scenario: Unique validated tax identifier

- **WHEN** two rows attempt the same `tax_id` with `validated_at` NOT NULL
- **THEN** the second insert fails with a unique constraint violation (RD-005)

### Requirement: Web profiles link Supabase Auth to customers

The database SHALL expose a `public.web_profiles` table with: `id` (uuid PK, equals `auth.users.id`), `customer_id` (FK to `customers`), `email`, `role` (enum: `b2c`, `b2b_superadmin`, `b2b_subuser`, `pending`), `mfa_enabled`, `parent_customer_id` (nullable, for subusers), `permissions` (jsonb), `last_login_at`, `created_at`, `updated_at`.

#### Scenario: Authenticated user resolves tenant

- **WHEN** a logged-in storefront user queries their profile
- **THEN** exactly one `web_profiles` row exists for their `auth.uid()` and references the correct `customer_id`

#### Scenario: B2B subuser references parent company

- **WHEN** a subuser profile is created under a B2B company
- **THEN** `parent_customer_id` points to the empresa's `customers.id` and `permissions` json encodes section flags (RF-003, enforced in app layer later)

### Requirement: Payload tables coexist without collision

Migrations in this change SHALL NOT create tables whose names conflict with Payload's default collection table naming for existing cms collections (`users`, `pages`, `categories`, `media`). Domain tables use explicit names (`customers`, `web_profiles`).

#### Scenario: CMS boots after migrations

- **WHEN** `apps/cms` starts with `DATABASE_URL` pointing to the same Supabase database after core migrations
- **THEN** Payload migrations or schema push for template collections succeed without renaming core tenant tables
