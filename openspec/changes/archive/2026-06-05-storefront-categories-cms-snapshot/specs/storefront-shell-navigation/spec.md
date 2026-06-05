## MODIFIED Requirements

### Requirement: Navigation tree loaded from CMS with static fallback

The storefront SHALL build the global navigation tree from published Payload `categories` (parent relationship, sort order, slug, `homeGlyph` on root nodes) on the server, and SHALL fall back to the versioned category snapshot defined in `storefront-category-snapshot` when live CMS is unreachable or returns no categories. The storefront SHALL NOT use the legacy bundled static `CATEGORIES` TypeScript taxonomy as a runtime fallback.

#### Scenario: CMS categories populate mega menu

- **WHEN** Payload returns at least one root category with slug `escritura`
- **THEN** the header navigation renders that category with links to `/c/escritura` and child links using child slugs

#### Scenario: CMS unavailable uses snapshot fallback

- **WHEN** the live categories fetch fails or returns an empty list and the snapshot file contains categories
- **THEN** the navigation renders using snapshot data without breaking the page shell

#### Scenario: Root glyph from CMS homeGlyph

- **WHEN** a root category document includes `homeGlyph` `pen`
- **THEN** the mega menu displays the pen glyph for that root category without a hardcoded slug-to-glyph map

### Requirement: Three-level hierarchy in global navigation

The navigation tree SHALL support up to three levels (category, subcategory, family). Levels beyond depth three SHALL be omitted from the public navigation panel. Family nodes SHALL link to dedicated PLP routes `/c/{rootSlug}/{subSlug}/{familySlug}`.

#### Scenario: Grandchild shown in mega menu panel

- **WHEN** a category has a child with its own children in CMS
- **THEN** the mega menu displays the grandchild labels as links to `/c/{root}/{sub}/{family}`

#### Scenario: Family PLP route resolves

- **WHEN** a user opens `/c/escritura/boligrafos/gel` and that family exists in the navigation tree
- **THEN** the page renders a PLP filtered by the family slug and breadcrumbs Home → Escritura → Bolígrafos → Gel

### Requirement: Breadcrumbs on catalog and product routes

Catalog and product pages under `(shop)` SHALL render breadcrumbs reflecting the navigation tree and current path segments, including three-segment family paths.

#### Scenario: Subcategory page shows trail

- **WHEN** a user opens `/c/escritura/boligrafos` and both slugs exist in the navigation tree
- **THEN** breadcrumbs show Home, parent category, and current subcategory labels with correct hrefs

#### Scenario: Family page shows three-level trail

- **WHEN** a user opens `/c/escritura/boligrafos/gel` and all three slugs exist in the navigation tree
- **THEN** breadcrumbs show Home, root category, subcategory, and family with hrefs on all but the current leaf

## REMOVED Requirements

### Requirement: CMS unavailable uses static fallback

**Reason:** Replaced by versioned snapshot fallback per `storefront-category-snapshot`; static TypeScript taxonomy duplicated PIM and caused drift.

**Migration:** Run `pnpm sync:categories` after CMS seed or taxonomy changes; commit `category-tree.snapshot.json`. Remove reliance on `lib/data/categories.ts` for runtime navigation.
