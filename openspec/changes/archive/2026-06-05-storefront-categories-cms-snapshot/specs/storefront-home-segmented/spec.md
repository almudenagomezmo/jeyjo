## MODIFIED Requirements

### Requirement: Featured categories grid from CMS

The home SHALL render a grid of featured categories with name, visual glyph from the category's `homeGlyph` field when present, and link to `/c/{slug}`, using CMS-configured featured categories when present.

#### Scenario: Featured categories from global home

- **WHEN** the CMS home global lists three published category relationships with `homeGlyph` configured
- **THEN** the home displays exactly those three categories in configured order with glyphs matching `homeGlyph`

#### Scenario: Fallback to navigation roots when unset

- **WHEN** the CMS home global has no featured categories configured
- **THEN** the home displays up to six root categories from the storefront navigation tree using each root's `homeGlyph` when available

## ADDED Requirements

### Requirement: Featured category glyph without slug map

The featured categories grid SHALL derive visual glyphs from CMS `homeGlyph` on category documents and SHALL NOT require a hardcoded slug-to-glyph map in storefront source for CMS-backed categories.

#### Scenario: Root without homeGlyph uses default glyph

- **WHEN** a featured or fallback root category has no `homeGlyph` in CMS
- **THEN** the grid renders a neutral default glyph (e.g. box) without failing the page render
