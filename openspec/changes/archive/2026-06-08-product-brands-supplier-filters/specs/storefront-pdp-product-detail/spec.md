## MODIFIED Requirements

### Requirement: PDP shows long description and technical specifications

The PDP SHALL render `longDescription` as sanitized HTML in the description tab and a technical specifications table with at minimum brand (from `brands`, or "—" when unset), supplier (from `suppliers`, or "—" when unset), Jeyjo reference, OEM reference, EAN, pack unit, VAT rate, and primary category name (RF-012). Brand MUST NOT be derived from `supplier.name`.

#### Scenario: Long description from CMS

- **WHEN** a product has `longDescription` content in CMS
- **THEN** the description tab displays that HTML content

#### Scenario: Specifications table shows brand and supplier separately

- **WHEN** a product has brand BIC and supplier Distrisantiago
- **THEN** the specifications tab lists "Marca: BIC" and "Proveedor: Distrisantiago"

#### Scenario: Specifications table shows ERP identifiers

- **WHEN** a product has `skuErp`, `oemRef`, and `ean` populated
- **THEN** the specifications tab lists those values in labeled rows

## ADDED Requirements

### Requirement: PDP header shows brand not supplier

The PDP buy box header SHALL display the product brand when present (`{brand} · REF {sku}`) and SHALL NOT display the supplier name in the header line.

#### Scenario: Header with brand

- **WHEN** a product has brand BIC
- **THEN** the PDP header shows "BIC · REF {sku}"

#### Scenario: Header without brand

- **WHEN** a product has no linked brand
- **THEN** the PDP header shows only the reference line without a brand prefix
