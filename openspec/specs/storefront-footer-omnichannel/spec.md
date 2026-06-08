# Storefront footer omnichannel

## Purpose

Complete public footer per alcance §1.12: omnichannel contact, physical stores, social links, EU funding badge, payment methods, and conditional blog link (change footer-eva-omnichannel-complete).

## Requirements

### Requirement: Footer renders omnichannel contact block alcance §1.12

The public storefront footer SHALL display a dedicated omnichannel contact section with support phone (`tel:` link when present), support email (`mailto:` link when present), WhatsApp link when configured, and business hours text, using the same resolved contact precedence as the EVA widget fallback (SKAI settings then `systemSettings`), per **US-22** CA3.

#### Scenario: Visitor sees phone and WhatsApp in footer

- **WHEN** `systemSettings.supportPhone` and `systemSettings.whatsapp` are populated
- **THEN** the footer omnichannel block shows clickable phone and WhatsApp links
- **AND** business hours text is visible below or beside the channels

#### Scenario: Business hours prefer SKAI configuration

- **WHEN** `skaiSettings.businessHours` is non-empty and system contact phone is set
- **THEN** the footer displays the SKAI business hours string
- **AND** the phone number matches the resolved public support phone

#### Scenario: Partial contact configuration

- **WHEN** only support email is configured and phone/WhatsApp are empty
- **THEN** the footer shows email without broken `tel:` or WhatsApp links

### Requirement: Footer displays physical store locations

The footer SHALL render both configured physical stores (Alfaro and Rincón de Soto) with name and address from `GET /api/system/config` contact stores block.

#### Scenario: Both stores configured

- **WHEN** Alfaro and Rincón name and address fields are populated in system settings
- **THEN** the footer "Nuestras tiendas" section lists both locations with readable address text

#### Scenario: One store missing address

- **WHEN** Alfaro has name only and Rincón has full address
- **THEN** Alfaro shows name without address line
- **AND** Rincón shows name and address

### Requirement: Footer shows configurable social media links

The footer SHALL render icon links for social networks configured in `footerSettings` (Facebook, Instagram, LinkedIn, YouTube). Networks without URL SHALL NOT render placeholder icons.

#### Scenario: Instagram URL configured

- **WHEN** staff sets `footerSettings.socialInstagram`
- **THEN** the footer shows an Instagram icon linking to that URL with `rel="noopener noreferrer"` and accessible label

#### Scenario: No social URLs configured

- **WHEN** all social URL fields are empty
- **THEN** the social row is omitted without layout gap artifacts

### Requirement: Footer shows EU funding badge when configured

When `footerSettings.euFundingEnabled` is true and an image is uploaded, the footer SHALL display the EU funding badge with required alt text and optional external link.

#### Scenario: EU badge enabled with image

- **WHEN** staff enables EU funding and uploads badge media with alt text
- **THEN** the footer renders the badge above or within the bottom bar
- **AND** clicking the badge opens the configured URL in a new tab when `euFundingUrl` is set

#### Scenario: EU badge disabled

- **WHEN** `euFundingEnabled` is false
- **THEN** no EU funding badge is rendered

### Requirement: Footer bottom bar shows copyright and payment methods

The footer bottom bar SHALL display copyright with legal entity name and CIF, payment method indicators (Visa, MasterCard, Bizum, PayPal, Apple Pay, Google Pay) with accessible labels, and compact legal links to aviso legal, privacidad, and cookies routes.

#### Scenario: Bottom bar on public page

- **WHEN** any public storefront page with footer loads
- **THEN** the bottom bar shows current year copyright
- **AND** payment method icons or text with screen-reader labels
- **AND** links to `/legal/aviso-legal`, `/legal/privacidad`, and `/legal/cookies`

### Requirement: Blog link is conditional on footer settings

The footer SHALL include a blog link in the help column only when `footerSettings.blogEnabled` is true, pointing to `/blog`.

#### Scenario: Blog disabled

- **WHEN** `footerSettings.blogEnabled` is false
- **THEN** no blog link appears in the footer

#### Scenario: Blog enabled

- **WHEN** staff sets `footerSettings.blogEnabled` to true
- **THEN** the footer help column includes a link labeled per `footerSettings.blogLabel` defaulting to "Blog" with href `/blog`
