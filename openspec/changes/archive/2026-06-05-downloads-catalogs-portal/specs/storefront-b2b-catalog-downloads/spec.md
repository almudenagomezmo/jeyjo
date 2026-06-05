# Storefront B2B catalog downloads

## Purpose

B2B intranet downloads repository at `/intranet/descargas` for PDF catalogs and offer magazines with validity filtering (alcance §1.24, US-07 CA2, change #41).

## ADDED Requirements

### Requirement: Intranet descargas page lists valid catalog downloads US-07

The route `/intranet/descargas` SHALL replace its scaffold with a page listing published catalog downloads whose validity window includes the current calendar date in Europe/Madrid, filtered by the signed-in customer's `customer_group`, grouped by `documentType`, showing title, description, validity range, optional cover image, and a download action.

#### Scenario: B2B user sees current catalogs

- **WHEN** a validated B2B user with `customer_group` 2 opens `/intranet/descargas`
- **AND** two published documents are within validity for group 2
- **THEN** both documents appear with download buttons
- **AND** no roadmap scaffold placeholder is shown

#### Scenario: Expired documents are hidden

- **WHEN** a document has `validUntil` yesterday
- **THEN** it does not appear on `/intranet/descargas`
- **AND** it does not appear in the intranet API response

#### Scenario: Future documents are hidden

- **WHEN** a document has `validFrom` tomorrow
- **THEN** it does not appear on `/intranet/descargas`

#### Scenario: Empty state when no valid documents

- **WHEN** no published documents match validity and customer group
- **THEN** the page shows guidance that no catalogs are available at this time
- **AND** includes a link to contact or public catalog as appropriate

### Requirement: Catalog downloads intranet API

The storefront SHALL expose `GET /api/intranet/catalog-downloads` returning valid published documents for the session customer's group, requiring validated B2B session with `orders` permission when applicable (401 guest, 403 non-B2B, non-validated, or forbidden subuser).

#### Scenario: Validated B2B lists downloads

- **WHEN** a validated B2B user with `orders` permission requests the catalog-downloads API
- **THEN** each item includes `id`, `title`, `description`, `documentType`, `validFrom`, `validUntil`, `downloadUrl`, and optional `coverImageUrl`

#### Scenario: Subuser without orders permission denied

- **WHEN** a subuser lacking `orders` permission requests the catalog-downloads API
- **THEN** the response is 403

### Requirement: Download links use absolute media URLs

Each download item SHALL expose `downloadUrl` as an absolute URL to the linked Payload `media` PDF, resolved server-side without exposing CMS credentials to the browser.

#### Scenario: Download URL is absolute

- **WHEN** the API returns a catalog with media filename `catalogo-2026.pdf`
- **THEN** `downloadUrl` is an absolute HTTPS URL reachable after intranet authentication

### Requirement: Document type grouping labels

The UI SHALL group documents under Spanish headings: "Catálogos" for `catalog`, "Revistas de ofertas" for `offer_magazine`, and "Otros documentos" for `other`.

#### Scenario: Mixed types render in sections

- **WHEN** the API returns one `catalog` and one `offer_magazine`
- **THEN** the page shows two sections with the correct Spanish headings

### Requirement: Navigation entry is no longer scaffold

The intranet navigation entry for Descargas SHALL point to the operational `/intranet/descargas` page without `scaffold` metadata.

#### Scenario: Menu item opens live page

- **WHEN** the user clicks Descargas in the B2B menu
- **THEN** the catalog downloads page loads instead of `IntranetScaffoldPage`
