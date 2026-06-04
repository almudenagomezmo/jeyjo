## ADDED Requirements

### Requirement: Separate EVA pending validation queue

The Payload admin SHALL expose a dedicated view "Pedidos IA — pendientes de validación" listing only orders where `origin` is `eva`, `validatedEva` is false, and `jeyjoStatus` is not `cancelled`.

#### Scenario: EVA order appears in IA queue

- **WHEN** an order exists with `origin` eva and `validatedEva` false
- **THEN** it appears in the EVA queue and not in the validated EVA-only filter of the main inbox default

#### Scenario: Validated EVA order leaves IA queue

- **WHEN** staff validates an EVA order
- **THEN** it no longer appears in the EVA pending queue

### Requirement: Staff validates EVA orders before ERP export

Staff SHALL use a "Revisar y Validar" action that sets `validatedEva` to true and sets `jeyjoStatus` to `confirmed` when the order was awaiting confirmation.

#### Scenario: Validate EVA order

- **WHEN** staff clicks Revisar y Validar on EVA-2026-0015 in `pending_confirmation`
- **THEN** `validatedEva` is true
- **AND** `jeyjoStatus` is `confirmed`
- **AND** the order becomes eligible for Avansuite export per export spec

### Requirement: Staff may reject EVA orders

Staff SHALL use a Rechazar action that sets `jeyjoStatus` to `cancelled`, keeps `validatedEva` false, and MAY persist `evaRejectionReason`.

#### Scenario: Reject EVA order

- **WHEN** staff rejects an EVA pending order with a reason
- **THEN** `jeyjoStatus` is `cancelled`
- **AND** the order is removed from the EVA pending queue
- **AND** an audit log entry records the rejection

### Requirement: EVA queue shows full order detail for human review

The EVA queue SHALL allow opening order line snapshots (SKU, quantity, unit price) and customer reference before validate or reject.

#### Scenario: Review lines before validate

- **WHEN** staff opens an EVA order from the queue
- **THEN** line items and customer identity fields are visible for human verification (CA-BACKEND-003)
