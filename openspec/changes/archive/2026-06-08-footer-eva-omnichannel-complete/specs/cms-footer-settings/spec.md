## ADDED Requirements

### Requirement: FooterSettings global stores public footer configuration

Payload SHALL expose a global `footerSettings` under the system configuration admin group with staff-editable fields for social network URLs, EU funding badge (enabled flag, media upload, alt text, optional URL), blog link toggle and label, and section visibility toggles for stores and social row.

#### Scenario: Superadmin edits social URLs

- **WHEN** superadmin updates Instagram URL in `footerSettings`
- **THEN** the next `GET /api/system/config` response includes the new URL in the `footer.social` block

#### Scenario: EU funding requires alt text

- **WHEN** staff uploads an EU badge image without alt text
- **THEN** Payload validation prevents save until alt text is provided

### Requirement: System config API exposes footer block

`GET /api/system/config` SHALL include a `footer` object with social URLs, EU funding metadata (enabled, image URL, alt, link), blog settings, resolved `businessHours` string, and section toggles, without exposing internal Payload IDs or secrets.

#### Scenario: Public config fetch includes footer

- **WHEN** storefront calls `GET /api/system/config`
- **THEN** the JSON body contains `footer` alongside existing shipping and contact fields

#### Scenario: Business hours resolution in API

- **WHEN** `skaiSettings.businessHours` is set and footer config is requested
- **THEN** `footer.businessHours` equals the SKAI value
- **WHEN** SKAI hours are empty
- **THEN** `footer.businessHours` falls back to the documented default string

### Requirement: Footer settings accessible from system config hub

The Payload admin system config hub SHALL link to `footerSettings` editing alongside existing system, payment, and SKAI configuration cards.

#### Scenario: Staff opens footer configuration

- **WHEN** staff navigates to `/admin/system-config`
- **THEN** a card or link for "Pie de página / Footer" opens the `footerSettings` global

### Requirement: Footer settings changes are audited

Updates to `footerSettings` SHALL generate `audit_log` entries via Payload hooks with entity type `footerSettings`, per RF-029.

#### Scenario: Social URL change audited

- **WHEN** superadmin changes a social URL
- **THEN** `audit_log` records prior and new values for that field
