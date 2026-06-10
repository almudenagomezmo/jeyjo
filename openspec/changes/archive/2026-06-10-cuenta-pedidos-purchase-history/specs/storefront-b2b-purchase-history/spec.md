## ADDED Requirements

### Requirement: Purchase history panel is reusable in personal account

The storefront SHALL allow `PurchaseHistoryPanel` to be configured with `title`, `subtitle`, and `apiBase` so the same UI serves `/cuenta/empresa/pedidos` (B2B intranet API) and `/cuenta/pedidos` (account API).

#### Scenario: Personal account uses account API base

- **WHEN** `/cuenta/pedidos` renders `PurchaseHistoryPanel` with `apiBase="/api/account/purchase-history"`
- **THEN** list and repeat requests target the account API routes
- **AND** the page title is **Mis pedidos**

#### Scenario: B2B empresa keeps intranet API base

- **WHEN** `/cuenta/empresa/pedidos` renders `PurchaseHistoryPanel` with default `apiBase`
- **THEN** list and repeat requests target `/api/intranet/purchase-history`
- **AND** B2B session and `orders` permission guards remain enforced on those routes
