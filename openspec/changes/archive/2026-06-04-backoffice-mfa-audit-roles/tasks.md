## 1. Supabase audit indexes (optional)

- [x] 1.1 Add migration `audit_log_actor_created_at_idx` and `audit_log_entity_type_created_at_idx` under `supabase/migrations/`
- [x] 1.2 Verify: `supabase db reset` applies indexes; explain query on filtered audit uses index in `EXPLAIN`

## 2. Audit log library enhancements

- [x] 2.1 Extend `WriteAuditLogInput` with `sourceIp`, `previousValue`; map to `audit_log.source_ip` in `supabase-server.ts`
- [x] 2.2 Add `writeSecurityAudit()` for `ACCESS_DENIED`, `LOGIN_FAILED`, `MFA_*`, `ROLE_CHANGED`
- [x] 2.3 Add unit test for IP extraction helper from mocked `Headers`
- [x] 2.4 Verify: manual insert via hook logs `source_ip` when `x-forwarded-for` present

## 3. Audit hooks refactor

- [x] 3.1 Refactor `auditLogHooks.ts` to factory with `pickFields` and `before` snapshot on update
- [x] 3.2 Register hooks on `users`, `media`, `pages` in addition to catalog/order collections
- [x] 3.3 Include `p1Price`, `p2Price`, `staffRoles` in product/user pick lists for diffs
- [x] 3.4 Verify CA-BACKEND-005: update product P1 → SQL query shows `previous_value`/`new_value` with prices

## 4. Staff roles model

- [x] 4.1 Add `staffRoles` select (hasMany, saveToJWT) on `Users` collection; restrict field access to superadmin
- [x] 4.2 Create `src/access/staffRoles.ts` with `isStaff`, `hasStaffRole`, `COLLECTION_ACCESS` map
- [x] 4.3 Replace `checkRole(['admin'])` with staff role checks on business collections per design matrix
- [x] 4.4 Hide admin nav groups/collections not allowed for current role
- [x] 4.5 Verify CA-BACKEND-006: catalog-only user GET orders → 403 + `ACCESS_DENIED` audit row

## 5. MFA TOTP (Payload Auth)

- [x] 5.1 Enable Payload `twoFactor` on `users` auth config; document setup in README
- [x] 5.2 Add post-login guard: staff without enrolled TOTP cannot access `/admin` routes
- [x] 5.3 Add superadmin action or endpoint to reset target user MFA secret
- [x] 5.4 Add `beforeValidate` password rules for staff (12+ chars, complexity RNF-011)
- [x] 5.5 Verify CA-AUTH-005: staff without MFA sees enrollment; with TOTP reaches admin

## 6. Security event hooks

- [x] 6.1 Hook `users` afterChange for `staffRoles`/password changes → security audit entries
- [x] 6.2 Log `ACCESS_DENIED` from centralized access helper or collection-level forbidden path
- [x] 6.3 Log `LOGIN_FAILED` on auth failure for staff emails (Payload hook or custom login handler)
- [x] 6.4 Verify: MFA reset creates `MFA_RESET` row; role change creates `ROLE_CHANGED` row

## 7. Audit console UI

- [x] 7.1 Create `GET /api/audit-log` (staff: superadmin | mantenimiento) with filters and pagination
- [x] 7.2 Add admin custom view `AuditLogView` under group Mantenimiento/Seguridad
- [x] 7.3 Implement CSV export (superadmin only, max 10k rows)
- [x] 7.4 Verify: superadmin filters last 7 days; catalog user receives 403 on API

## 8. Users collection hardening

- [x] 8.1 Restrict `access.create` on users to superadmin; disable public self-registration for staff path
- [x] 8.2 Filter admin user list to staff accounts (has `staffRoles`) by default
- [x] 8.3 Update `ensureFirstUserIsAdmin` → assign `superadmin` in `staffRoles` for bootstrap user
- [x] 8.4 Verify: non-superadmin cannot PATCH another user's `staffRoles`

## 9. Seed and documentation

- [x] 9.1 Extend seed with staff users: `catalogo`, `administracion`, `superadmin` (document test TOTP secret for e2e)
- [x] 9.2 Update `apps/cms/README.md`, `.env.example`, `docs/local-development.md` per cms-app-bootstrap spec
- [x] 9.3 Verify: README mentions MFA, roles, audit console; dev docs list required env vars

## 10. Tests and CI

- [x] 10.1 Add e2e or int tests for MFA gate and catalog 403 on orders (Playwright or vitest)
- [x] 10.2 Regenerate `payload-types.ts` after Users field changes
- [x] 10.3 Verify: `pnpm --filter cms typecheck` and `pnpm --filter cms test:int` pass in CI
