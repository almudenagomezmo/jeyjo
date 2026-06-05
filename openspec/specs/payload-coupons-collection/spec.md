# Payload coupons collection

## Purpose

Payload `coupons` collection for marketing discount codes managed by staff (US-18, RF-027, change #31).

## Requirements

### Requirement: Coupons collection stores discount rules US-18 CA1

The CMS SHALL expose a Payload `coupons` collection editable by marketing staff with fields: `code` (unique text), `discountType` (`percent` | `fixed`), `discountValue` (number), `minimumOrderAmount` (number, default 0), `validFrom` (date), `validUntil` (date), `maxUses` (number nullable), `usesCount` (number read-only, default 0), `active` (boolean), `source` (`manual` | `recovery`), and optional `recoveryCartId`.

#### Scenario: Staff creates BLOG5 coupon

- **WHEN** a superadmin creates a coupon with code `BLOG5`, type `percent`, value `5`, minimum `0`, and valid dates spanning today
- **THEN** the coupon is persisted with `active` true and `usesCount` 0

#### Scenario: Duplicate code rejected

- **WHEN** staff attempts to create a second coupon with code `BLOG5`
- **THEN** validation fails with a unique code error

### Requirement: Coupon codes are normalized to uppercase

The system SHALL trim and uppercase coupon codes on save and lookup.

#### Scenario: Lowercase input stored uppercase

- **WHEN** staff enters code `blog5`
- **THEN** the stored `code` is `BLOG5`

### Requirement: Expired coupons deactivate automatically US-18 CA4

When `validUntil` is before the current date, the coupon MUST be treated as inactive without manual intervention.

#### Scenario: Past validUntil marks inactive

- **WHEN** a coupon has `validUntil` yesterday
- **THEN** `active` is false on read
- **AND** storefront validation returns invalid

#### Scenario: Daily expiry job deactivates stale coupons

- **WHEN** the daily coupon expiry cron runs
- **THEN** all coupons with `validUntil < today` and `active` true are set to `active` false

### Requirement: Staff access control for coupons

Only staff roles with marketing or superadmin access SHALL create, update, or delete coupons; other staff MAY have read-only access per `staffRoles`.

#### Scenario: Marketing role can create

- **WHEN** a user with marketing role submits a valid coupon
- **THEN** the coupon is created

#### Scenario: Unauthorized role cannot delete

- **WHEN** a user without marketing or superadmin role attempts to delete a coupon
- **THEN** the operation is denied
