## MODIFIED Requirements

When staff successfully validates a customer, the CMS SHALL send a transactional email via Payload email transport (Mailpit in development, Resend SMTP in production) to the customer email. The email SHALL state that Jeyjo has approved the account, include assigned customer group and tax id when present, and link to `/cuenta` for all customer groups. B2B templates SHALL vary copy by group (empresa, colegio/instituto, concurso público).

#### Scenario: B2B approval email links to cuenta

- **WHEN** staff validates a customer with `customer_group` 2, 3, or 4
- **THEN** the approval email contains a link to `/cuenta`
- **AND** does not link to `/intranet`
