# ADR-0012: Payments through an external PCI DSS provider

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

Passengers pay by card, Apple Pay, Google Pay or corporate account ([FR-15](../../requirements/functional.md)). Handling card data requires PCI DSS compliance ([NFR-12](../../requirements/non-functional.md)), which is out of reach for the MVP in both budget and time. Every payment must be fiscalised ([NFR-17](../../requirements/non-functional.md)). Constraint: a single payment provider ([CON-6](../../requirements/constraints.md)).

## Decision

- Card details are entered into the form of a **certified payment provider**; the system receives and stores only a card token.
- All interaction with the provider is concentrated in the **payment service**, isolated from the rest of the system.
- Payment results are confirmed by provider webhooks; webhook handling is idempotent.

## Alternatives considered

- **Processing cards in-house** — full PCI DSS certification, not acceptable for the MVP.
- **Several providers at once** — contradicts CON-6 and complicates payment reconciliation.

## Consequences

**Positive:**

- Full card data never enters the system — the audit scope is minimal.
- Apple Pay and Google Pay are supported by the provider out of the box.

**Negative:**

- Provider fee of 1.5–2.5% of payment volume ([budget](../../project/budget.md)).
- Dependency on provider availability: if it fails, the passenger is offered cash payment.
