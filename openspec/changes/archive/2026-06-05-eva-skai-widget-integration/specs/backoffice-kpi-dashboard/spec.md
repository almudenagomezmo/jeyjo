## MODIFIED Requirements

### Requirement: EVA monitoring panel is visible on dashboard

The dashboard SHALL include an "Monitorización EVA" panel showing active conversation count and a short list of unresolved items requiring human attention, per **US-19** CA2. When `SKAI_ADAPTER=live` and SKAI health is OK, conversation metrics SHALL come from the SKAI adapter; pending EVA orders SHALL always be merged into unresolved items.

#### Scenario: EVA panel shows pending validation orders

- **WHEN** orders exist with `origin` eva and `validatedEva` false
- **THEN** at least one unresolved item appears in the EVA panel referencing those orders

#### Scenario: EVA panel shows live conversations when SKAI is configured

- **WHEN** `SKAI_ADAPTER=live`, SKAI health is OK, and SKAI reports 3 active conversations
- **THEN** the panel displays `activeConversations: 3` from SKAI metrics
- **AND** no preview-mode label is shown

#### Scenario: EVA panel labels preview mode in stub adapter

- **WHEN** `SKAI_ADAPTER=stub` or SKAI health is not OK
- **THEN** the panel displays a visible preview label, uses `activeConversations: 0` or last cached value, and does not error
