## ADDED Requirements

### Requirement: Registration and approval emails are distinct

The storefront registration flow and CMS validation flow SHALL use separate transactional emails. Supabase Auth SHALL send email address confirmation at registration. The CMS SHALL send account approval only after staff validation. Registration success messaging SHALL inform the user to confirm email first and that Jeyjo will validate the profile afterward.

#### Scenario: Registration message mentions two steps

- **WHEN** a visitor completes registration successfully with email confirmation required
- **THEN** the success response or UI states that the user must confirm email via Supabase
- **AND** states that Jeyjo will validate the account before full segment access

#### Scenario: Approval email is not sent at registration

- **WHEN** a visitor completes registration
- **THEN** no CMS account-approval email is sent
- **AND** only Supabase Auth confirmation email is triggered (or Mailpit equivalent in development)

#### Scenario: Approval email sent only after staff validation

- **WHEN** staff validates a pending customer in CMS
- **THEN** the CMS sends the account-approval email
- **AND** Supabase Auth does not send a second confirmation email for that action
