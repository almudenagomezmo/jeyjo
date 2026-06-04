## MODIFIED Requirements

### Requirement: Optional order observations

The checkout delivery step SHALL include an optional observations field up to 500 characters stored on the order. When the user has pending non-catalog quick order requests in session storage, the checkout UI SHALL prefill or append a structured block to observations (prefix `Referencias no catalogadas:`) so Jeyjo staff receive them on the order document. The combined text MUST NOT exceed 500 characters; if it would exceed, the UI SHALL warn and require the user to shorten manual observations or remove pending requests.

#### Scenario: Observations persisted

- **WHEN** the user enters observations text and places the order
- **THEN** the Payload order document stores the same text

#### Scenario: Non-catalog requests merged at checkout

- **WHEN** the user has two pending non-catalog requests from quick order
- **AND** opens checkout delivery step
- **THEN** the observations field includes both references in the structured block
- **AND** the user can edit before place order

#### Scenario: Place order clears consumed non-catalog requests

- **WHEN** place order succeeds with merged non-catalog text in observations
- **THEN** pending non-catalog requests are removed from session storage
