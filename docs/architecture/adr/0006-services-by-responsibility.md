# ADR-0006: Split services by area of responsibility

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

The backend has several parts with different load profiles and requirements: driver matching is the hottest path, payments are subject to separate security requirements ([NFR-12](../../requirements/non-functional.md)), notifications work with several delivery channels.

## Decision

The backend is split into four services by area of responsibility, not by database entities:

| Service | Area of responsibility |
|---|---|
| Order service | Runs a trip from creation to completion |
| Driver matching service | Finds the nearest available car |
| Payment service | Payments, receipts, refunds — isolated because of security requirements |
| Notification service | All delivery channels (push, SMS) in one place |

The test: each service has its own reason to change and its own load profile. If there is no such reason, the service is unnecessary.

## Alternatives considered

- **Monolith** — simpler to start with, but driver matching and payments cannot be scaled and secured separately.
- **One service per entity** (users, drivers, trips, tariffs…) — small services constantly calling each other synchronously, with one business operation spread across several services.

## Consequences

**Positive:**

- Each service scales with its own load.
- Payment data is isolated in one service, which simplifies audits.

**Negative:**

- A distributed system: monitoring and tracing across services are required ([NFR-25](../../requirements/non-functional.md)).
- Consistency between services is achieved through events, not transactions ([ADR-0009](0009-kafka-for-async-events.md)).
