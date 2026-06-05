# storefront-b2b-notification-center

## Purpose

B2B portal notification bell, panel, and intranet APIs (US-21 CA2, change #28).

## Requirements

### Requirement: Portal top bar shows notification bell US-21 CA2

The B2B portal top bar SHALL include a notification bell control with a badge showing the count of unread notifications for the signed-in web profile.

#### Scenario: Unread count visible

- **WHEN** the profile has three unread notifications
- **THEN** the bell displays badge `3`

#### Scenario: No badge when all read

- **WHEN** all notifications have `read_at` set
- **THEN** no numeric badge is shown on the bell

### Requirement: Notification panel lists recent items

Activating the bell SHALL open a panel listing the most recent notifications (default 20) with title, relative time, read state, and a deep link from `payload.href` when present.

#### Scenario: Open panel shows unread first

- **WHEN** the user opens the notification panel
- **THEN** unread items appear before read items
- **AND** each item links to its target intranet route when activated

### Requirement: User can mark notifications read

The storefront SHALL expose `PATCH /api/intranet/notifications` accepting notification ids or `markAll: true` to set `read_at` for the session profile only.

#### Scenario: Mark single notification read

- **WHEN** the user marks one notification as read
- **THEN** `read_at` is set for that id
- **AND** the unread badge count decreases by one

#### Scenario: Mark all read

- **WHEN** the user chooses mark all
- **THEN** all unread notifications for that profile have `read_at` set

### Requirement: Notifications update via Realtime with polling fallback

The bell component SHALL subscribe to Supabase Realtime on channel `notifications:{profileId}` and refetch on insert; if Realtime is unavailable, it SHALL poll at most every 60 seconds while the document is visible.

#### Scenario: New notification updates badge without reload

- **WHEN** a new notification row is inserted for the active profile
- **THEN** the unread badge increments without full page reload

### Requirement: Notification APIs require validated B2B session

`GET /api/intranet/notifications` and `PATCH /api/intranet/notifications` SHALL return 401 for unauthenticated requests and 403 for non-validated B2B users.

#### Scenario: Guest cannot list notifications

- **WHEN** an anonymous user calls the notifications API
- **THEN** the response status is 401
