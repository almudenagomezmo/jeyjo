## ADDED Requirements

### Requirement: Supabase CLI project exists at repository root

The repository SHALL include a `supabase/` directory managed by the Supabase CLI with `config.toml`, versioned SQL migrations under `supabase/migrations/`, and optional `supabase/seed.sql` for local development only.

#### Scenario: Fresh clone applies schema locally

- **WHEN** a developer runs `supabase start` followed by `supabase db reset` on a machine with Docker
- **THEN** PostgreSQL starts with all migrations applied and seed data loaded without manual SQL execution

#### Scenario: Remote project linkage documented

- **WHEN** a developer reads the change documentation or root README section for database setup
- **THEN** they find instructions to link `supabase link --project-ref` and required environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DATABASE_URL`) without secrets committed to git

### Requirement: Migration workflow is documented

The project SHALL document how to create a new migration (`supabase migration new`), apply locally (`db reset` / `db push`), and apply to staging/production via Supabase dashboard or CI.

#### Scenario: New migration is additive

- **WHEN** a developer adds a migration file with a timestamp prefix
- **THEN** existing environments can apply it in order without dropping Payload-managed tables in the same database
