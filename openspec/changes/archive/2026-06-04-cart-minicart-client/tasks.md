## 1. Cart product resolution API

- [x] 1.1 Add `POST /api/catalog/cart-products` accepting `{ slugs: string[] }` returning public CMS snapshots (slug, skuErp, name, ref, packUnit, imageUrl) with visibility rules (verify: wildcard slug returns omitted)
- [x] 1.2 Extract pure `computeCartSummary(lines, products, quotes, mode)` from `lib/cart.ts` and add unit tests for subtotal, shipping preview, and orphan lines (verify: `pnpm --filter storefront test` passes)

## 2. Cart summary hook and pricing integration

- [x] 2.1 Implement `useCartSummary` client hook: fetch cart-products + `/api/pricing/batch`, debounce on qty changes, refetch on `priceMode` change (verify: mock test — two SKUs return correct subtotal)
- [x] 2.2 Move shipping constants to `lib/cart/shipping.ts` aligned to RF-013 v1 thresholds (verify: B2C subtotal 38€ → amountToFreeShipping 1€)
- [x] 2.3 Remove `getProduct` demo dependency from cart summary path; keep demo file for non-cart routes only (verify: grep — `lib/data/products` not imported in `lib/cart.ts`)

## 3. Minicart panel (US-03 CA3)

- [x] 3.1 Refactor `MiniCart` to consume `useCartSummary`; add loading skeleton and orphan-line UI (verify: manual — open minicart shows CMS product names)
- [x] 3.2 Ensure dialog a11y: `role="dialog"`, `aria-modal`, Escape close, body scroll lock (verify: keyboard — Escape closes panel)
- [x] 3.3 Wire `PackQtyStepper` or pack notice in minicart qty controls for US-03 CA2 (verify: packUnit 12 + input 5 → qty 12 + notice)

## 4. Add-to-cart integration (PLP, PDP, quick view)

- [x] 4.1 Confirm `AddToCartButton` opens minicart by default and uses canonical slug as `productId` (verify: add from PDP opens panel with line)
- [x] 4.2 Wire PLP `ProductCard` inline add and `QuickViewDialog` to use `AddToCartButton` or equivalent with `openCart=true` (verify: PLP add does not navigate away)
- [x] 4.3 Update PDP `ProductBuyBox` add flow to satisfy modified spec — minicart opens with updated subtotal (verify: US-03 CA3 manual on PDP)

## 5. Header badge and layout

- [x] 5.1 Verify `Header` badge uses `selectCartCount` + `useHydrated`; cart button opens minicart not `/cart` (verify: badge hidden on SSR HTML, visible after hydrate)
- [x] 5.2 Confirm `MiniCart` mounted once in root `layout.tsx` (verify: minicart works on `/` and `/c/escritura`)

## 6. Full cart page `/cart`

- [x] 6.1 Refactor `app/cart/page.tsx` to use `useCartSummary` instead of sync `buildCartSummary` (verify: line prices match minicart for same cart)
- [x] 6.2 Keep demo coupon UI with explicit "Demo" label; add disabled or stub "Solicitar presupuesto" placeholder (verify: invalid coupon shows error, valid BLOG5 applies discount)
- [x] 6.3 Add shipping preview banner and pack qty rules consistent with minicart (verify: RF-013 banner at 40€ B2C shows free shipping)

## 7. Tests and verification

- [x] 7.1 Unit tests: `computeCartSummary`, shipping thresholds, cart-products route visibility (verify: `pnpm --filter storefront test` passes)
- [x] 7.2 Run `pnpm --filter storefront typecheck` and `build` (verify: no errors)
- [x] 7.3 Manual US-03 CA3: add from PLP quick view, PDP, and card — minicart updates immediately with subtotal
- [x] 7.4 Document `CART_USE_CMS` flag in `apps/storefront/.env.example` if implemented (verify: env example updated)
