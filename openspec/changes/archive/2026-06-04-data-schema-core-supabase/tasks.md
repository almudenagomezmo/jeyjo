## 1. Supabase CLI bootstrap

- [x] 1.1 Run `supabase init` at repo root; commit `supabase/config.toml` and `.gitignore` entries for local temp files only
- [x] 1.2 Add root scripts `db:reset`, `db:types` (and document `supabase link` for remote) in root `package.json`
- [x] 1.3 Extend README with database setup: Docker, `supabase start`, env vars (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, service role for server only)

## 2. SQL migrations — schema

- [x] 2.1 Migration `0001`: extensions (`pgcrypto`) and enums (`web_profile_role`, `search_event_status`)
- [x] 2.2 Migration `0002`: tables `customers`, `web_profiles` with FKs, unique partial index on `customers(tax_id)` where `validated_at IS NOT NULL`
- [x] 2.3 Migration `0003`: tables `search_events`, `audit_log` with indexes per design (status+created_at, entity_type+entity_id)
- [x] 2.4 Migration `0004`: enable RLS, function `current_customer_id()`, policies for `customers`, `web_profiles`, deny `authenticated` on `audit_log` mutations
- [x] 2.5 Migration `0005`: storage buckets `catalog-media` (public read) and `private-documents` (no public read) + `storage.objects` policies

## 3. Seed and local verification

- [x] 3.1 Add `supabase/seed.sql` with sample customers and web_profiles (fixed UUIDs documented for local Auth)
- [x] 3.2 Run `supabase db reset` and confirm all migrations apply cleanly
- [x] 3.3 Verify `pnpm dev:cms` starts and Payload connects without schema errors on the same database
- [x] 3.4 Manual RLS check: two test users cannot `SELECT` each other's `customers` row (document steps in `supabase/README.md`)

## 4. TypeScript types package

- [x] 4.1 Create `packages/database-types` workspace package
- [x] 4.2 Add script to generate `database.types.ts` from local Supabase (`supabase gen types typescript --local`)
- [x] 4.3 Wire `apps/storefront` (and optional cms server utils) to import types from the package

## 5. Documentation and CMS alignment

- [x] 5.1 Update `apps/cms/docs/supabase.md` with bucket names and coexistence note (Payload + Jeyjo tables)
- [x] 5.2 Add `supabase/README.md` with migration workflow, RLS testing, and link to RNF-009 / RD-001
- [x] 5.3 Update `apps/cms/.env.example` and storefront `.env.example` with Supabase client variables (no secrets)

## 6. CI (optional but recommended)

- [x] 6.1 Add CI job step to validate SQL migrations apply on ephemeral Postgres (or `supabase db lint` if available)
- [x] 6.2 Ensure generated types are committed or CI fails if `db:types` output drifts from migrations
