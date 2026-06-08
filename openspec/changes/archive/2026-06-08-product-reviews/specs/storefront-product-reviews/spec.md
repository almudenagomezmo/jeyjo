# Storefront product reviews

## Purpose

Authenticated storefront flows for submitting, editing, and reading moderated product reviews on the PDP (RF-012, US-03).

## ADDED Requirements

### Requirement: Only logged-in customers may submit reviews

The storefront SHALL require a valid Supabase session for creating or editing a product review. Unauthenticated users SHALL NOT call review mutation endpoints successfully.

#### Scenario: Anonymous POST rejected

- **WHEN** an unauthenticated user POSTs to the product reviews API
- **THEN** the response is HTTP 401

#### Scenario: Authenticated POST accepted when eligible

- **WHEN** a logged-in customer with verified purchase and display name POSTs a valid review
- **THEN** the review is created with `pending` status

### Requirement: Verified purchase required to review

Before accepting a review create or edit, the storefront SHALL verify the customer has purchased the product SKU within the same history window as purchase-history: web orders with `jeyjoStatus` in `confirmed`, `preparing`, `shipped`, or `delivered`, merged with ERP purchase-history lines when `erp_code` is available, bounded by `PURCHASE_HISTORY_YEARS` (default 5).

#### Scenario: Customer with web order may review

- **WHEN** the customer has a confirmed web order line snapshot containing the product SKU
- **THEN** review submission is allowed

#### Scenario: Customer without purchase blocked

- **WHEN** the customer has no matching purchase line for the SKU
- **THEN** review submission returns HTTP 403 with a message that only buyers may review

#### Scenario: ERP history counts when web order absent

- **WHEN** the customer has no web order for the SKU but ERP purchase-history lists the SKU for their `erp_code`
- **THEN** review submission is allowed

### Requirement: Personal display name required

The storefront SHALL require `web_profiles.display_name` to be non-empty before review submission. The submitted review SHALL snapshot `authorDisplayName` from `displayName`, not `commercialName`.

#### Scenario: Missing display name blocks form

- **WHEN** a logged-in purchaser has null or empty `display_name`
- **THEN** the PDP review form shows a message to complete the profile
- **AND** POST returns HTTP 422

#### Scenario: Display name snapshotted on submit

- **WHEN** a customer with `display_name` "Ana García" submits a review
- **THEN** the persisted `authorDisplayName` is "Ana García"

### Requirement: Review input validation

The storefront SHALL accept `rating` as integer 1–5 and `comment` as plain text between 10 and 2000 characters after trimming. HTML tags in comments SHALL be stripped or rejected.

#### Scenario: Invalid rating rejected

- **WHEN** POST sends `rating` 0 or 6
- **THEN** the response is HTTP 422

#### Scenario: Short comment rejected

- **WHEN** POST sends a comment shorter than 10 characters after trim
- **THEN** the response is HTTP 422

### Requirement: Author may edit own review with re-moderation

A logged-in customer SHALL update only their own review for a product via PATCH. The update SHALL change `rating` and/or `comment`, set `status` to `pending`, and refresh `authorDisplayName` from current `display_name`. Verified purchase SHALL be re-checked on edit.

#### Scenario: Edit approved review returns to pending

- **WHEN** the author PATCHes an approved review with new comment text
- **THEN** the review `status` becomes `pending`
- **AND** the review no longer appears in the public approved list until staff re-approves

#### Scenario: Author cannot edit another customer review

- **WHEN** customer A PATCHes a review owned by customer B
- **THEN** the response is HTTP 403 or 404

### Requirement: Public read returns approved reviews only

`GET` review list endpoints SHALL return only `approved` reviews for the product, ordered by `createdAt` descending, with pagination. Author-only endpoints MAY return the caller's review in any status.

#### Scenario: Public list excludes pending

- **WHEN** a product has one `pending` and one `approved` review
- **THEN** the public list contains only the approved review

#### Scenario: Author sees own pending review

- **WHEN** the author calls the mine endpoint for a product they reviewed with `pending` status
- **THEN** their review is returned with current status

### Requirement: Review API uses server-side CMS access only

Review data loading and Payload mutations SHALL occur server-side using `STOREFRONT_PAYLOAD_API_KEY` and MUST NOT expose CMS credentials to the browser.

#### Scenario: Client bundle has no CMS secret

- **WHEN** inspecting the storefront client bundle for review routes
- **THEN** no Payload secret or service role key is present
