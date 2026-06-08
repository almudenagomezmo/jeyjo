## ADDED Requirements

### Requirement: PLP product cards offer compare control US-06 CA1

Each product card on faceted PLP routes (`/c/*` category, subcategory, and family listings) and on `/search` with an active query SHALL expose a visible compare control (checkbox or labeled button "Comparar") that toggles the product SKU in the client compare store.

#### Scenario: Compare control visible on category PLP

- **WHEN** a user views a product card on `/c/escritura`
- **THEN** the card shows a compare control labeled or implied as "Comparar"

#### Scenario: Compare control on search PLP

- **WHEN** a user views a product card on `/search?q=boligrafo`
- **THEN** the card shows the same compare control as category PLP cards

#### Scenario: Compare control reflects selection state

- **WHEN** a user selects compare on a product card
- **THEN** the control shows selected state (`aria-checked` or `aria-pressed` true)
- **AND** a compare action bar appears or updates with the selection count

#### Scenario: Compare bar offers navigation to comparison page

- **WHEN** at least two products are selected for comparison
- **THEN** the compare action bar provides a control to open `/comparar` with the selected SKUs in the query string
