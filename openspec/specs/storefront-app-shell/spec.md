# Storefront app shell

## Purpose

Define the Next.js storefront application shell with layout, typography, theme toggle, and segmented home with CMS merchandising and graceful degradation.

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

The home route SHALL render the segmented merchandising home described in `storefront-home-segmented`, requiring CMS home global and public product data for full content. When CMS merchandising or catalog data is unavailable, the home SHALL still render a reduced experience (hero, segment cards, shell navigation) without returning HTTP 500.

#### Scenario: Full home with CMS available

- **WHEN** the storefront runs with CMS reachable and home global configured
- **THEN** the home page displays banners, featured categories, and product carousels per §1.6

#### Scenario: Reduced home without CMS merchandising

- **WHEN** the home page loads and the CMS home global is unavailable
- **THEN** the home still renders hero and segment cards successfully
- **AND** the header still renders navigation from the category snapshot when live CMS categories are unavailable

#### Scenario: Navigation degrades without CMS on home

- **WHEN** the home page loads and live CMS categories are unavailable
- **THEN** the header still renders using the versioned category snapshot when present
- **AND** does not fall back to the legacy static `CATEGORIES` TypeScript array

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

### Requirement: Footer includes operational newsletter block alcance §1.12

In addition to catalog and static link columns, the storefront `Footer` SHALL render an operational newsletter subscription block as defined in `storefront-newsletter-subscribe`, integrated into the footer grid without breaking responsive layout on viewports from mobile through desktop.

#### Scenario: Newsletter block in footer grid

- **WHEN** the footer renders on a desktop viewport
- **THEN** the newsletter block appears alongside existing footer columns
- **AND** uses semantic tokens (`bg-ink`, `text-neutral-200`) consistent with the current footer

#### Scenario: Newsletter block stacks on mobile

- **WHEN** the footer renders below the `md` breakpoint
- **THEN** the newsletter block remains readable and submittable without horizontal overflow
