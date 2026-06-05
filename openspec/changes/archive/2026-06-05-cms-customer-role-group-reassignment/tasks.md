## 1. Access guard

- [x] 1.1 Add `canManageCustomers()` in `apps/cms/src/access/customerValidation.ts`; make `canValidateCustomers` delegate to it
- [x] 1.2 Export shared staff+MFA guard helper for validate and reclassify routes (verify: both endpoints reject without MFA)

## 2. Reclassify service

- [x] 2.1 Create `apps/cms/src/lib/customers/reclassify-customer.ts` with group/role validation rules from design.md
- [x] 2.2 Reject pending customers (409), invalid group/role (400), B2C downgrade with active subusers (409)
- [x] 2.3 Persist `customers.customer_group` and `web_profiles.role` updates; leave `validated_at` unchanged
- [x] 2.4 Write `audit_log` entry `CUSTOMER_RECLASSIFIED` with previous/new group and per-profile roles

## 3. API route

- [x] 3.1 Add `PATCH apps/cms/src/app/(app)/next/customers/[id]/reclassify/route.ts` with `canManageCustomers` + MFA guard
- [x] 3.2 Accept body `{ customerGroup, profileRoles: [{ profileId, role }] }`; return updated summary JSON
- [x] 3.3 Integration test or int spec: storefront JWT → 403; valid staff+MFA → 200; pending customer → 409

## 4. Admin UI

- [x] 4.1 Extend `fetch-customer-detail.ts` with `canReclassify: boolean` (validated + staff context)
- [x] 4.2 Add **Reclasificar** button and modal in `CustomersAdminView/Client.tsx` (group selector + role per profile row)
- [x] 4.3 Show impact copy in modal (intranet / precios / contabilidad según grupo destino)
- [x] 4.4 Wire modal submit to `PATCH /next/customers/:id/reclassify`; refresh detail and list on success
- [x] 4.5 Styles in `index.scss` for reclassify modal (reuse validate modal patterns)

## 5. Verification

- [ ] 5.1 Manual: validar cliente B2C por error → reclasificar a grupo 2 + `b2b_superadmin` → login storefront redirige a `/intranet`
- [ ] 5.2 Manual: reclasificar con subusuarios activos a grupo 1 → 409 con mensaje claro
- [x] 5.3 `openspec validate cms-customer-role-group-reassignment` sin errores
- [x] 5.4 `pnpm --filter cms typecheck` y tests CMS relacionados pasan
