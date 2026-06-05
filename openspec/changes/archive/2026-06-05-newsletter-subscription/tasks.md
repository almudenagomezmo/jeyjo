## 1. Supabase schema

- [x] 1.1 Add migration `newsletter_subscribers` with unique `email_normalized`, status check, tokens, optional `web_profile_id`, ESP fields, and index on `(status, created_at)` (verify: `supabase db reset` applies)
- [x] 1.2 Add optional `newsletter_rate_limits` table or equivalent rate-limit store with 1h TTL (verify: sixth attempt within hour is blocked)
- [x] 1.3 Regenerate database types if project uses codegen (verify: `newsletter_subscribers` in shared types)

## 2. CMS newsletter core

- [x] 2.1 Create `NewsletterSettings` global under Marketing group with enabled, copy fields, privacy URL, brevo list override (verify: global visible in Payload admin)
- [x] 2.2 Define `NewsletterEspPort`, `BrevoEspAdapter`, and `NoopEspAdapter` in `apps/cms/src/lib/newsletter/esp/` (verify: unit test noop logs, Brevo mock receives upsert)
- [x] 2.3 Implement `sendNewsletterConfirmationEmail` React Email template using Payload/Resend transport (verify: Mailpit shows message in dev)
- [x] 2.4 Add internal endpoint `POST /api/internal/newsletter/sync` secured by `NEWSLETTER_INTERNAL_SECRET` for confirm/unsubscribe ESP sync (verify: curl with secret triggers upsert/remove)
- [x] 2.5 Implement staff admin list endpoint/view with filters, CSV export, resend confirmation, and manual resync (verify: staff sees pending/confirmed rows)

## 3. Storefront subscribe API

- [x] 3.1 Implement `POST /api/newsletter/subscribe` with validation, consent check, normalization, upsert pending, rate limit, generic responses (verify: curl creates pending row)
- [x] 3.2 Implement `GET /api/newsletter/settings` reading Payload global for footer copy and enabled flag (verify: disabled returns enabled false)
- [x] 3.3 Wire subscribe API to trigger confirmation email via CMS call or shared lib (verify: subscribe sends Mailpit email)
- [x] 3.4 Associate `web_profile_id` when session exists without auto-consent (verify: authenticated subscribe stores profile id)

## 4. Confirm and unsubscribe pages

- [x] 4.1 Implement `/newsletter/confirm` server route validating token, 7-day expiry, transition to `confirmed`, ESP sync (verify: valid token sets confirmed_at)
- [x] 4.2 Implement `/newsletter/unsubscribe` route with idempotent `unsubscribed` transition and ESP remove (verify: second visit still succeeds)
- [x] 4.3 Add success/error pages within global layout using design tokens (verify: invalid token shows generic error)

## 5. Footer UI

- [x] 5.1 Create `NewsletterSignup` client component with email, consent checkbox, privacy link, loading/success/error states (verify: submit without consent blocked client-side)
- [x] 5.2 Integrate newsletter block into `Footer.tsx` grid responsive layout (verify: form visible on mobile and desktop)
- [x] 5.3 Pre-fill email for logged-in users from session (verify: cuenta email appears, consent unchecked)
- [x] 5.4 Hide or disable form when global `enabled` is false (verify: maintenance message shown)

## 6. Verification and docs

- [x] 6.1 Unit tests: state machine, token expiry, rate limit, idempotent unsubscribe, ESP noop (verify: `pnpm --filter cms test` passes)
- [x] 6.2 Storefront tests: subscribe validation, confirm route, footer consent (verify: `pnpm --filter storefront test` passes)
- [x] 6.3 Integration: footer subscribe → Mailpit → confirm → mock Brevo contact created (verify: end-to-end in staging)
- [x] 6.4 Manual checklist: alcance §1.14 subscribe + staff list + CSV export + unsubscribe link in email
- [x] 6.5 Document env vars in `apps/cms/.env.example` and `apps/storefront/.env.example` (`BREVO_API_KEY`, `BREVO_NEWSLETTER_LIST_ID`, `NEWSLETTER_INTERNAL_SECRET`, `STOREFRONT_URL`)
