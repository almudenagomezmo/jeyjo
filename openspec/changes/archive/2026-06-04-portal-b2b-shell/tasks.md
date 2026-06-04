## 1. Portal shell mode in navigation

- [x] 1.1 Extend `middleware.ts` to set internal portal marker header for `/intranet/:path*` requests (verify: header present in server logs or test helper)
- [x] 1.2 Update `NavigationShell` to read portal mode and render `PortalTopBar` instead of `Header`, hide `TopBar` and `Footer` on intranet routes (verify: `/intranet` HTML has no mega-menu markup)
- [x] 1.3 Implement `PortalTopBar` with logo, “Tienda” link to `/`, read-only “Precios sin IVA” label, company name, logout (verify: only design tokens from `globals.css`, no new hex)
- [x] 1.4 Wire logout in `PortalTopBar` to `POST /api/auth/logout` (verify: session cleared, `/intranet` redirects to login)

## 2. Intranet navigation config and components

- [x] 2.1 Create `lib/intranet/navigation.ts` with US-07 nav tree, Contabilidad children, scaffold metadata and `roadmapRef` (verify: nine primary sections + five Contabilidad subsections)
- [x] 2.2 Add `IntranetNav` client component with active pathname styling (verify: `/intranet/pedidos` highlights “Histórico de pedidos” only)
- [x] 2.3 Add `IntranetSubNav` for Contabilidad subsection active state (verify: `/intranet/contabilidad/vencimientos` highlights Vencimientos)
- [x] 2.4 Add `IntranetBreadcrumb` + `buildIntranetBreadcrumbs` helper (verify: Contabilidad → Vencimientos trail renders three crumbs)
- [x] 2.5 Add `PortalSectionScaffold` empty state component (verify: shows title, description, roadmap badge, no API calls)

## 3. Intranet layout refactor

- [x] 3.1 Refactor `(b2b)/intranet/layout.tsx` to use shared nav components, keep guards and MFA banner (verify: unauthenticated `/intranet` still redirects to login)
- [x] 3.2 Replace dashboard `page.tsx` with `IntranetDashboard` — company summary + quick-access cards (verify: US-07 CA5 name/CIF visible; cards link to each section)
- [x] 3.3 Remove `[...section]/page.tsx` catch-all route (verify: `glob` no longer matches catch-all under intranet)

## 4. Explicit section routes

- [x] 4.1 Add `/intranet/mi-cuenta/page.tsx` scaffold (roadmap #26 reference in copy) (verify: sidebar “Mi cuenta” navigates here, not `/cuenta`)
- [x] 4.2 Add `/intranet/pedidos`, `/intranet/pedido-rapido`, `/intranet/precios`, `/intranet/rma`, `/intranet/stock`, `/intranet/descargas`, `/intranet/contacto` scaffolds with correct titles (verify: each URL returns 200 with section-specific copy)
- [x] 4.3 Add `contabilidad/layout.tsx` with subnav; `page.tsx` redirect to `/intranet/contabilidad/facturas` (verify: `/intranet/contabilidad` → 307/308 to facturas)
- [x] 4.4 Add Contabilidad scaffolds: `facturas`, `albaranes`, `vencimientos`, `cifra-347`, `presupuestos` deferring to change #37 (verify: no PDF download buttons or invoice rows)

## 5. Pricing and guards regression

- [x] 5.1 Ensure portal top bar price label uses B2B session mode from `getCustomerContext()` (verify: validated B2B sees “Precios sin IVA”, no toggle)
- [x] 5.2 Confirm B2C and pending users still blocked from `/intranet/*` — redirect `/cuenta?error=forbidden` (verify: CA-AUTH-003 manual or existing test)
- [x] 5.3 Confirm validated B2B login still lands on `/intranet` (verify: CA-AUTH-002 / US-07 CA1)

## 6. Tests and acceptance

- [x] 6.1 Unit tests: `buildIntranetBreadcrumbs`, nav active matching helper, navigation config completeness (verify: `pnpm --filter storefront test`)
- [x] 6.2 Add or extend navigation shell test for portal mode header swap (verify: test passes in CI)
- [x] 6.3 Run `pnpm --filter storefront typecheck` and `build` (verify: no type errors)
- [ ] 6.4 Manual checklist US-07 CA2: all menu labels present and navigable; CA4 B2C blocked; CA5 header fields on dashboard (verify: notes in PR or staging sign-off)
