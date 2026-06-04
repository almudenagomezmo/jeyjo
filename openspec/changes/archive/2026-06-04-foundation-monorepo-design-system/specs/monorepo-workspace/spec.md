## ADDED Requirements

### Requirement: Repository uses pnpm workspaces

The repository SHALL define a pnpm workspace at the repository root that includes `apps/storefront` and `apps/cms` as workspace packages.

#### Scenario: Install from root

- **WHEN** a developer runs `pnpm install` at the repository root
- **THEN** dependencies for both storefront and cms applications are installed without manual per-app installs

#### Scenario: Run dev scripts via filter

- **WHEN** a developer runs the root script to start the storefront
- **THEN** only the storefront application starts on its configured port (default 3000)

### Requirement: Root orchestration scripts exist

The root `package.json` SHALL expose scripts for `dev`, `build`, `lint`, and `typecheck` that run across workspace packages (or documented per-app equivalents).

#### Scenario: CI uses root scripts

- **WHEN** CI executes `pnpm lint` and `pnpm build` at the repository root
- **THEN** both apps are validated without ad-hoc per-folder commands

### Requirement: Environment examples per app

Each application SHALL ship a `.env.example` listing required variables without secrets.

#### Scenario: New developer onboarding

- **WHEN** a developer copies `.env.example` to `.env.local` in each app
- **THEN** the application can start in development with documented placeholder values
