# Row level security

## Purpose

Multi-tenant data isolation (RNF-009) via PostgreSQL RLS for customer-scoped tables and Supabase Auth.

## Requirements

### Requirement: RLS enabled on all tenant-scoped tables

Row Level Security SHALL be enabled on `public.customers`, `public.web_profiles`, `public.search_events` (where rows are tenant-scoped via payload), and any future table holding per-customer data created in this change.

#### Scenario: Anonymous cannot read customer rows

- **WHEN** the `anon` role executes `SELECT` on `customers` without a matching policy
- **THEN** zero rows are returned

### Requirement: Helper function resolves current customer

The database SHALL provide a stable SQL function `public.current_customer_id()` that returns the `customer_id` for `auth.uid()` via `web_profiles`, or NULL if unauthenticated.

#### Scenario: Authenticated B2B user reads own customer

- **WHEN** role `authenticated` selects from `customers` where `id = current_customer_id()`
- **THEN** only the row for that user's company is visible (RNF-009)

### Requirement: Service role bypass is explicit

Background jobs (Payload hooks, workers) SHALL use the Supabase `service_role` key only on the server. RLS policies for `authenticated` MUST NOT grant cross-tenant access. Policies for `service_role` MAY allow full access where documented.

#### Scenario: Storefront JWT cannot read another customer

- **WHEN** user A's JWT attempts `SELECT` on customer B's id
- **THEN** the query returns no rows

### Requirement: Web profiles self-access

Policies on `web_profiles` SHALL allow `authenticated` users to `SELECT` and `UPDATE` only their own row (`id = auth.uid()`). Inserts for new registrations MAY use a dedicated RPC or service path in change #16.

#### Scenario: Subuser cannot update another profile

- **WHEN** user A attempts `UPDATE web_profiles SET permissions = '{}'` where `id <> auth.uid()`
- **THEN** the update affects zero rows
