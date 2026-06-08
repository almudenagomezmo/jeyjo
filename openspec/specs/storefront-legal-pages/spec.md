# Storefront legal pages

## Purpose

CMS-backed legal and FAQ pages served at stable storefront routes with SEO metadata (change footer-eva-omnichannel-complete).

## Requirements

### Requirement: SitePages collection stores legal and FAQ content

Payload SHALL provide a `sitePages` collection with slug, title, page type (`legal`, `faq`, `help`), Lexical rich text content, meta description, and published flag. Staff with appropriate roles SHALL create and edit pages without code deploy.

#### Scenario: Staff creates legal page

- **WHEN** staff publishes a `sitePages` document with slug `aviso-legal` and type `legal`
- **THEN** the document is readable via Payload local API for storefront rendering

#### Scenario: Unpublished page not public

- **WHEN** a legal page has `published: false`
- **THEN** storefront legal route returns not found for that slug

### Requirement: Legal pages render at stable storefront routes

The storefront SHALL serve CMS legal pages at `/legal/[slug]` for published documents with `pageType` `legal`, using the global shell layout, semantic typography tokens, and page title from CMS.

#### Scenario: Visitor opens aviso legal

- **WHEN** a published `sitePages` document exists with slug `aviso-legal`
- **THEN** `GET /legal/aviso-legal` returns HTTP 200 with rendered Lexical content and document title in the page heading

#### Scenario: Unknown legal slug

- **WHEN** no published legal page matches the slug
- **THEN** the storefront returns the styled 404 page within the global layout

### Requirement: FAQ page renders aggregated FAQ content

The storefront SHALL provide `/ayuda/faq` rendering the published `sitePages` document with slug `faq` and type `faq`, or the first published FAQ-type page when slug `faq` is absent.

#### Scenario: FAQ page available

- **WHEN** a published FAQ site page exists
- **THEN** `/ayuda/faq` displays the FAQ title and rich text content within the shop layout

#### Scenario: FAQ missing shows graceful message

- **WHEN** no published FAQ page exists
- **THEN** `/ayuda/faq` shows a friendly empty state with link to contact channels from system config

### Requirement: Legal pages include basic SEO metadata

Legal and FAQ routes SHALL set `<title>` and meta description from CMS fields when present, defaulting title pattern `{pageTitle} | Jeyjo`.

#### Scenario: Meta description from CMS

- **WHEN** a legal page defines `metaDescription`
- **THEN** the rendered page includes that value in the description meta tag
