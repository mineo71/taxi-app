# ADR-0010: Go for the driver matching service

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

The driver matching service is the hottest path under load: every order triggers a geo index search, candidate ranking by pickup ETA, rating and acceptance rate ([FR-35](../../requirements/functional.md)), and dispatching offers with a 15-second response window ([FR-22](../../requirements/functional.md)). The targets are p95 ≤ 5 s ([NFR-1](../../requirements/non-functional.md)) and holding a 5× peak ([NFR-5](../../requirements/non-functional.md)).

## Decision

The driver matching service is written in **Go**. The other backend services use Node.js (TypeScript).

## Alternatives considered

- **Node.js, like the other services** — a single stack is simpler, but the single-threaded model is a worse fit for parallel ranking and a large number of concurrent offer timers.
- **Rust** — higher performance, but slower development and a smaller hiring pool.

## Consequences

**Positive:**

- Goroutines naturally model parallel driver offers with timeouts.
- Low memory usage and predictable latency under load.

**Negative:**

- A second backend stack in the team.
- Contracts with other services are defined in gRPC schemas ([ADR-0013](0013-grpc-for-internal-calls.md)) rather than shared TypeScript types.
