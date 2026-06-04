## 1. Supabase schema and environment

- [x] 1.1 Add migration for `customers` billing address columns and `web_profiles.failed_login_count` / `locked_until` (verify: `supabase db reset` or migrate applies cleanly)
- [x] 1.2 Document `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in `apps/storefront/.env.example` (verify: README mentions Auth setup)
- [x] 1.3 Add `@supabase/ssr` and `@supabase/supabase-js` to storefront; create `lib/supabase/server.ts`, `client.ts`, `middleware.ts` helpers (verify: `pnpm --filter storefront typecheck`)

## 2. Auth middleware and session context

- [x] 2.1 Add `middleware.ts` with session refresh and matchers for `/cuenta`, `/intranet`, `/login`, `/registro` (verify: unauthenticated `/cuenta` redirects to `/login?next=`)
- [x] 2.2 Implement `getCustomerContext()` server helper joining `web_profiles` + `customers` (verify: unit test returns null for anon)
- [x] 2.3 Add redirects `/mi-cuenta` → `/cuenta` in middleware or route (verify: `curl -I /mi-cuenta` → 308 to `/cuenta`)

## 3. Registration and login API routes

- [x] 3.1 `POST /api/auth/register` — zod validation, signUp, service-role insert `customers` + `web_profiles` (verify: new row `validated_at` NULL, `role=pending`)
- [x] 3.2 `POST /api/auth/login` — credentials, lockout counter, audit_log on success (verify: 6th bad password returns lock message — CA-AUTH-004)
- [x] 3.3 `POST /api/auth/logout` — clear session (verify: subsequent `/cuenta` redirects login)
- [x] 3.4 Update `last_login_at` on successful login (verify: column set in DB)

## 4. Auth UI pages

- [x] 4.1 Build `/login` and `/registro` pages with existing `Input`/`Button`/`Card` tokens only (verify: no new hex in components grep)
- [x] 4.2 Registration form: company toggle requires `tax_id`; address fields required (verify: RF-004 fields present in POST body)
- [x] 4.3 Show Supabase email confirmation messaging when enabled (verify: staging config documented)

## 5. Customer account area (B2C)

- [x] 5.1 Replace `/cuenta` placeholder with sidebar layout + dashboard (verify: CA-AUTH-001 — login shows commercial name in header)
- [x] 5.2 Pending validation banner when `validated_at` IS NULL (verify: copy visible after fresh registration)
- [x] 5.3 Profile read-only section and logout control (verify: logout clears session)
- [x] 5.4 Placeholder subroutes: pedidos, direcciones (verify: links render “Próximamente”)

## 6. B2B intranet shell and guards

- [x] 6.1 Add `(b2b)` or segment `/intranet` layout with US-07 menu skeleton (verify: B2B seed login lands on `/intranet`)
- [x] 6.2 Intranet header shows `commercial_name` + `tax_id` (verify: CA-AUTH-002 header fields)
- [x] 6.3 Block B2C from `/intranet/*` — redirect `/cuenta?error=forbidden` (verify: CA-AUTH-003 manual)
- [x] 6.4 MFA recommendation banner when `mfa_enabled=false` for `b2b_superadmin` (verify: CA-AUTH-005 client scenario — no TOTP gate)

## 7. Header and pricing session integration

- [x] 7.1 Update `Header` account control: anonymous → `/login`, B2C/pending → `/cuenta`, validated B2B → `/intranet` (verify: spec storefront-shell-navigation scenarios)
- [x] 7.2 Wire `/api/pricing/resolve` and batch to `getCustomerContext()` — P2 only for validated B2B (verify: pending user gets P1 on REF-002)
- [x] 7.3 `PriceModeToggle`: session overrides manual toggle for validated B2B; anon keeps cookie toggle (verify: RF-011 header label scenarios)

## 8. CMS customer validation queue

- [x] 8.1 Staff-only pending customers list (Supabase query via server hook) in Payload admin or dedicated page (verify: new registration appears in list)
- [x] 8.2 `POST` validate endpoint with `{ customerGroup }` — sets `validated_at`, `role`, audit_log (verify: after validate, B2B login reaches intranet)
- [x] 8.3 Deny storefront JWT on validate endpoint (verify: 401/403 from customer session)

## 9. Seed, tests, and acceptance

- [x] 9.1 Update `supabase/seed.sql` comments; document Studio steps for test users CA-AUTH-001/002 (verify: README staging auth section)
- [x] 9.2 Unit tests: lockout logic, `getCustomerContext`, registration zod (verify: `pnpm --filter storefront test`)
- [x] 9.3 Run `pnpm --filter storefront typecheck` and `build`; `pnpm --filter cms typecheck` if CMS touched (verify: CI clean)
- [ ] 9.4 Manual staging: CA-AUTH-001, CA-AUTH-002, CA-AUTH-003, CA-AUTH-004 checklists from `06-criterios-aceptacion-jeyjo.md`
