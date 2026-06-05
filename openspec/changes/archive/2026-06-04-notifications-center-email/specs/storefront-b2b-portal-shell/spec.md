# storefront-b2b-portal-shell

## MODIFIED Requirements

### Requirement: Portal top bar includes shop return and logout

The portal top bar SHALL include a link to the public catalog home, a read-only B2B price mode indicator, a notification bell with unread badge (see `storefront-b2b-notification-center`), and a logout control that clears the session.

#### Scenario: Logout from portal

- **WHEN** a user activates logout in the portal top bar
- **THEN** the session is cleared
- **AND** subsequent `/intranet` requests redirect to login

#### Scenario: Notification bell visible on intranet

- **WHEN** a validated B2B user loads any `/intranet/*` route
- **THEN** the portal top bar includes the notification bell control

## ADDED Requirements

### Requirement: Mi cuenta is no longer a scaffold

The route `/intranet/mi-cuenta` SHALL render notification preferences and account summary instead of an `IntranetScaffoldPage` placeholder.

#### Scenario: Mi cuenta shows preferences form

- **WHEN** a user opens `/intranet/mi-cuenta`
- **THEN** notification preference controls are visible
- **AND** the "Próximamente" scaffold badge is not shown
