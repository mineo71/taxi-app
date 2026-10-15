# ADR-0011: Hexagonal architecture for the order service

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

The order service holds the core business logic of the system: the trip lifecycle, price calculation and cancellation rules. This logic must be covered by automated tests (≥ 80%, [NFR-24](../../requirements/non-functional.md)) and must not depend on which database, broker or maps provider is used. Pricing rules change most often.

## Decision

The order service follows **hexagonal architecture** (ports and adapters) with three layers:

1. **Entry point** — the order controller: turns an HTTP request into a call, contains no business logic.
2. **Logic** — the trip lifecycle manager (state machine), price calculator, cancellation handler. Knows nothing about the outside world.
3. **Adapters** — trip repository, event publisher, matching and maps clients.

Dependencies only point downwards; the logic defines interfaces and the adapters implement them. For example, the lifecycle manager calls `publishTripCompleted(trip)`, and all Kafka-specific work lives in the event publisher.

Details are on the [C3 diagram](../c3-order-service.md).

## Alternatives considered

- **Controller talks to the repository directly** — state transition logic gets spread across the controller and cannot be tested in isolation.
- **Classic three-layer architecture** (controller → service → repository) — the logic depends on the data layer, so replacing the database or broker touches business code.

## Consequences

**Positive:**

- Trip completion logic can be tested without Kafka or a database — adapters are replaced with stubs.
- Moving from Kafka to another broker changes one component.
- Retries, timeouts and buffering are concentrated in the adapters instead of being spread across business logic.
- If an external service is unavailable, the adapter returns an error and the lifecycle manager decides what to do with the trip.

**Negative:**

- More interfaces and classes than in a simple CRUD service.
