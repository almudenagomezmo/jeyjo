# Storefront app shell

## Purpose

Define the Next.js storefront application shell with layout, typography, theme toggle, and placeholder home without backend dependencies.

## Requirements

### Requirement: Next.js App Router storefront application

The `apps/storefront` package SHALL be a Next.js 15+ application using the App Router with TypeScript strict mode enabled.

#### Scenario: Development server starts

- **WHEN** `pnpm --filter storefront dev` runs with valid env
- **THEN** the app serves HTTP on port 3000 with the root layout applied

### Requirement: Root layout with fonts and global styles

The root layout SHALL load Manrope and JetBrains Mono (or equivalent from prototype), import `globals.css`, and wrap pages with the storefront shell components.

#### Scenario: Home page loads design system

- **WHEN** a user opens `/`
- **THEN** the page displays with Jeyjo typography, background token, and header/footer shell

### Requirement: Placeholder home without business catalog

The home route SHALL render a minimal placeholder that does not require ERP sync or product catalog APIs. Other routes MAY depend on CMS for navigation while the home route remains renderable if CMS is unavailable.

#### Scenario: No backend required for home

- **WHEN** only the storefront app runs without cms or database
- **THEN** the home page still renders successfully

#### Scenario: Navigation degrades without CMS on home

- **WHEN** the home page loads and CMS categories are unavailable
- **THEN** the header still renders using static navigation fallback data

### Requirement: Not found page

The application SHALL provide a `not-found.tsx` using the same layout and tokens.

#### Scenario: Unknown route

- **WHEN** a user navigates to an unknown path
- **THEN** a styled 404 page is shown within the global layout

### Requirement: Layout shell components present

The storefront SHALL include layout components `TopBar`, `Header`, `Footer`, and `Container` ported from jeyjo-next structure, rendered from the root layout. The header SHALL additionally provide mobile navigation (`MobileNav` or equivalent drawer) and a skip link to the main content landmark.

#### Scenario: Global navigation visible

- **WHEN** any public page loads
- **THEN** TopBar and Header are visible; Footer appears at the bottom of the viewport flow

#### Scenario: Mobile navigation available on small viewports

- **WHEN** a public page loads on a viewport below the `md` breakpoint
- **THEN** the header exposes a menu control that opens the mobile navigation drawer

### Requirement: Theme toggle without catalog dependency

The shell SHALL include a theme toggle (light/dark) that applies `.dark` on `<html>` without requiring authentication or API calls.

#### Scenario: Toggle dark mode

- **WHEN** the user activates dark mode in the header
- **THEN** semantic colors switch via CSS variables on subsequent paint
