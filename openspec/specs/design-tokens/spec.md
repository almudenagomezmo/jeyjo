# Design tokens

## Purpose

Centralize Jeyjo brand and semantic design tokens in the storefront for consistent theming and future rebrands.

## Requirements

### Requirement: Centralized CSS design tokens

The storefront application SHALL define brand and semantic colors, typography, radii, and shadows as CSS custom properties in a single `globals.css` file, aligned with the Jeyjo corporate palette from `especificaciones_inicio/diseño/jeyjo-next`.

#### Scenario: Brand colors available

- **WHEN** a component uses Tailwind utilities such as `bg-primary` or `text-text-brand`
- **THEN** the rendered color maps to the token values (e.g. brand green `#22ce7a` via `--green-400` / `--primary`)

#### Scenario: Future rebrand

- **WHEN** the brand primary color changes
- **THEN** only `globals.css` token definitions need updating for semantic utilities to follow

### Requirement: Dark mode via html class

The system SHALL support light (default) and dark themes by toggling the `.dark` class on the `<html>` element, with semantic tokens redefined under `.dark`.

#### Scenario: Dark mode active

- **WHEN** the `dark` class is present on `<html>`
- **THEN** surfaces use dark semantic values (e.g. `--background: #0e110f`) without per-component overrides

### Requirement: Tailwind v4 theme inline mapping

The storefront SHALL map CSS variables into Tailwind via `@theme inline` so utilities like `bg-surface`, `rounded-md`, and `shadow-md` resolve from tokens.

#### Scenario: Utility uses token

- **WHEN** a page uses `className="bg-surface text-text"`
- **THEN** background and text colors come from `--surface` and `--text` variables, not hardcoded hex in JSX
