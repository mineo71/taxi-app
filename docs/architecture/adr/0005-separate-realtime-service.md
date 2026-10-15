# ADR-0005: Separate real-time service on WebSocket

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

The driver position must refresh on the passenger map every 2–5 seconds ([NFR-2](../../requirements/non-functional.md), [FR-10](../../requirements/functional.md)). Regular HTTP requests live for a fraction of a second, while a tracking connection stays open for hours — for the whole trip or the whole time a driver is online.

## Decision

Real-time position and status delivery is moved into a **separate real-time service** (Node.js, WebSocket). The driver app sends its position over WebSocket, the service updates the geo index in Redis and pushes the position to the passenger app.

## Alternatives considered

- **WebSocket in the gateway** — long-lived connections would eat resources needed by short requests, and both would have to scale together.
- **Polling** — with a 2–5 s refresh it creates many redundant requests and drains the battery ([NFR-23](../../requirements/non-functional.md)).
- **Managed service (Firebase, Ably)** — faster start, but vendor lock-in and per-message costs as usage grows.

## Consequences

**Positive:**

- The gateway and the real-time service scale independently: the gateway by request count, the real-time service by open connections.
- A failure of the real-time service does not stop ride ordering.

**Negative:**

- Clients must reconnect after a dropped connection and restore state ([NFR-9](../../requirements/non-functional.md)).
- Multiple instances of the service need a shared fan-out channel between them.
