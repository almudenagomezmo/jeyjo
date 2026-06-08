## 1. Navigation and constants

- [x] 1.1 Update `lib/intranet/navigation.ts` hrefs to `/cuenta/empresa/*`; remove stock from empresa nav; dashboard href `/cuenta`
- [x] 1.2 Update `lib/b2b/permissions.ts` path prefixes and `sectionForIntranetPath`
- [x] 1.3 Update `lib/intranet/breadcrumbs.ts`, `nav-active.ts`, `portal-mode.ts`
- [x] 1.4 Update `lib/b2b/intranet-section-guard.ts` forbidden redirect to `/cuenta`

## 2. Routes and layouts

- [x] 2.1 Move `app/(b2b)/intranet/**` pages to `app/(account)/cuenta/empresa/**` (except stock, dashboard)
- [x] 2.2 Create `cuenta/empresa/layout.tsx` and `cuenta/empresa/preferencias/page.tsx`
- [x] 2.3 Extend `AccountSidebar` with Personal + Empresa sections
- [x] 2.4 Merge B2B dashboard cards into `cuenta/page.tsx`
- [x] 2.5 Remove legacy `(b2b)/intranet` route files

## 3. Auth, middleware, shell

- [x] 3.1 Update `lib/auth/redirect.ts` and `middleware.ts` (login dest, intranet 308 redirects, portal mode, empresa guard)
- [x] 3.2 Update `NavigationShell.tsx` accountHref and portal mode detection
- [x] 3.3 Update all `guardIntranetPage` call sites with new paths

## 4. Components and tests

- [x] 4.1 Update component hardcoded `/intranet` hrefs (dashboard, panels, forms)
- [x] 4.2 Update storefront tests referencing `/intranet` paths
- [x] 4.3 Run storefront typecheck/tests
