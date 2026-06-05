## 1. Database and types

- [x] 1.1 Add migration `web_profiles.display_name`, `is_active`, subuser index, RLS superadmin SELECT policy, and `create_b2b_subuser` RPC (verify: `pnpm supabase db reset` or apply migration locally)
- [x] 1.2 Regenerate `packages/database-types` from Supabase schema (verify: types include `display_name`, `is_active`)

## 2. Permissions core module

- [x] 2.1 Create `apps/storefront/src/lib/b2b/permissions.ts` with `B2bPermissions` type, defaults, `resolveEffectivePermissions`, `canAccessSection`, `filterIntranetNav`, route→section map (verify: unit tests pass)
- [x] 2.2 Extend `CustomerContext` and `getCustomerContext()` to load `displayName`, `permissions`, `isActive`, `parentCustomerId` (verify: existing auth tests still pass)
- [x] 2.3 Add `requireB2bSuperadmin()` and extend `requireB2bApiSession({ section? })` in `b2b-api-guard.ts` (verify: 403 without section permission)

## 3. CMS order status

- [x] 3.1 Add `pending_company_approval` to Orders collection enum and `status-transitions.ts` (verify: `order-status-transitions.int.spec.ts` updated)
- [x] 3.2 Add optional `submittedByUserId` / `submittedByEmail` fields on Orders (verify: Payload types regenerate)
- [x] 3.3 Allow storefront transitions `pending_company_approval` → `pending_confirmation` | `cancelled` for approval API (verify: transition test)

## 4. Subuser APIs

- [x] 4.1 Implement `GET/POST /api/intranet/subusers` with superadmin guard and Supabase Admin user creation (verify: POST creates login-capable subuser)
- [x] 4.2 Implement `PATCH /api/intranet/subusers/:id` for permissions, `is_active`, optional password reset (verify: deactivate blocks next login)
- [x] 4.3 Add audit log entries on subuser create/update/deactivate (verify: row in `audit_log`)

## 5. Order approval APIs

- [x] 5.1 Implement `GET /api/intranet/order-approvals` scoped to company `customerRef` (verify: only `pending_company_approval` returned)
- [x] 5.2 Implement approve/reject endpoints updating Payload order status (verify: approve → `pending_confirmation`, reject → `cancelled`)

## 6. Enforcement on existing intranet features

- [x] 6.1 Add section guards to intranet layout or segment wrappers for Contabilidad, pedidos, pedido-rapido, precios, mi-cuenta (verify: RF-003 — subuser `finance:false` redirected from `/intranet/contabilidad/facturas`)
- [x] 6.2 Update `INTRANET_PRIMARY_NAV` usage to filter via `filterIntranetNav`; remove mi-cuenta scaffold meta (verify: subuser without orders hides pedidos links)
- [x] 6.3 Pass `section: 'orders'` to existing APIs: purchase-history, quick-order, custom-tariffs (verify: 403 for subuser `orders:false`)

## 7. Checkout and login

- [x] 7.1 Branch `place-order` for subuser `ordersRequireApproval` → `pending_company_approval` + `submittedByUserId` (verify: subuser flag creates correct status)
- [x] 7.2 Block checkout place-order when subuser lacks `orders` permission (verify: 403)
- [x] 7.3 Reject login/session for `is_active=false` in login route and session refresh (verify: deactivated subuser cannot access `/intranet`)

## 8. UI mi-cuenta and dashboard

- [x] 8.1 Replace `/intranet/mi-cuenta` scaffold with superadmin subuser management UI (list, create/edit modal, permission toggles) (verify: US-12 CA1–CA2 manual)
- [x] 8.2 Add superadmin pending-approval panel or dashboard badge linking to queue (verify: badge shows count when orders pending)
- [x] 8.3 Subuser with `account` permission sees readonly company data without user management tab (verify: no create button for subuser)

## 9. Tests

- [x] 9.1 Unit tests: permissions resolution, nav filter, route mapping (verify: `pnpm --filter storefront test permissions`)
- [x] 9.2 API tests: subusers CRUD, order approvals, guarded intranet APIs (verify: test suite green)
- [x] 9.3 Integration test RF-003: subuser without finance cannot access facturas URL or API (verify: redirect + 403)

## 10. Documentation and rollout

- [x] 10.1 Seed or document demo subuser under B2B demo company in `supabase/README.md` (verify: local login flow documented)
- [x] 10.2 Optional env `B2B_PERMISSIONS_ENABLED` bypass for rollback (verify: when false, guards skipped in dev only if implemented)
