## ADDED Requirements

### Requirement: PDP displays real review aggregates in header

The PDP SHALL show star rating and review count in the product header when the CMS product has `reviewCount` greater than zero, using `ratingAverage` for star fill and the count for the "(N valoraciones)" label. When `reviewCount` is zero, the rating row SHALL NOT be rendered.

#### Scenario: Product with approved reviews shows stars

- **WHEN** a product has `reviewCount` 3 and `ratingAverage` 4.3
- **THEN** the PDP header shows stars reflecting 4.3 and text "(3 valoraciones)"

#### Scenario: Product without reviews hides rating row

- **WHEN** a product has `reviewCount` 0
- **THEN** the PDP header does not show the star rating block

### Requirement: PDP valoraciones tab lists approved reviews

The PDP SHALL include a "Valoraciones" tab in `ProductTabs` listing approved reviews for the product with author display name, star rating, relative date, and comment text, paginated server-side.

#### Scenario: Valoraciones tab shows approved list

- **WHEN** a product has two approved reviews and one pending review
- **THEN** the Valoraciones tab lists only the two approved reviews

#### Scenario: Empty state when no approved reviews

- **WHEN** a product has no approved reviews
- **THEN** the Valoraciones tab shows an empty-state message

### Requirement: PDP review form for eligible logged-in purchasers

The Valoraciones tab SHALL render a review form for logged-in customers who have verified purchase of the product SKU and a non-empty `display_name`. The form SHALL collect star rating and comment and submit via the storefront reviews API. After submit, the UI SHALL inform the user the review awaits staff approval.

#### Scenario: Eligible customer sees form

- **WHEN** a logged-in customer with verified purchase and display name views the Valoraciones tab
- **AND** they have no existing review
- **THEN** the star and comment form is visible

#### Scenario: Pending review shows awaiting message

- **WHEN** the customer has a `pending` review for the product
- **THEN** the UI shows that the review awaits approval
- **AND** the customer may edit and resubmit

#### Scenario: Unauthenticated user sees login CTA

- **WHEN** an anonymous user opens the Valoraciones tab
- **THEN** a login call-to-action is shown instead of the form
- **AND** the approved public list remains visible if any exist

### Requirement: PDP maps review aggregates from CMS product

The PDP loader SHALL map `reviewCount` and `ratingAverage` from the CMS product document into `PdpProductView` as `reviews` and `rating` respectively, replacing hardcoded null placeholders.

#### Scenario: Mapper populates rating fields

- **WHEN** `mapPdpDocToView` processes a product with `reviewCount` 5 and `ratingAverage` 4.6
- **THEN** `PdpProductView.reviews` is 5 and `PdpProductView.rating` is 4.6
