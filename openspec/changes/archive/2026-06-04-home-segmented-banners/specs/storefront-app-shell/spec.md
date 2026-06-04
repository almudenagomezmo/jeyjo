## MODIFIED Requirements

### Requirement: Placeholder home without business catalog

The home route SHALL render the segmented merchandising home described in `storefront-home-segmented`, requiring CMS home global and public product data for full content. When CMS merchandising or catalog data is unavailable, the home SHALL still render a reduced experience (hero, segment cards, shell navigation) without returning HTTP 500.

#### Scenario: Full home with CMS available

- **WHEN** the storefront runs with CMS reachable and home global configured
- **THEN** the home page displays banners, featured categories, and product carousels per §1.6

#### Scenario: Reduced home without CMS merchandising

- **WHEN** the home page loads and the CMS home global is unavailable
- **THEN** the home still renders hero and segment cards successfully
- **AND** the header still renders using static navigation fallback data when categories are unavailable

#### Scenario: Navigation degrades without CMS on home

- **WHEN** the home page loads and CMS categories are unavailable
- **THEN** the header still renders using static navigation fallback data
