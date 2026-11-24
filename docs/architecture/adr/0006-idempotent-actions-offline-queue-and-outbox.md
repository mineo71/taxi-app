# ADR-0006: Idempotent actions, offline queue in the driver app and transactional outbox

- **Status:** Accepted
- **Date:** 2026-11-24

## Context

Fault tolerance is one of the three top [architecture characteristics](../characteristics.md) (AC-2). No active trip may be lost, and the apps must keep working on a poor connection ([NFR-8](../../requirements/non-functional.md), [NFR-9](../../requirements/non-functional.md), [UP-13](../../requirements/unhappy-paths.md)). In Ukraine, drivers regularly lose the network during power outages.

Three problems had no answer in the architecture:

1. **A driver action taken offline** ("Passenger on board", "Complete trip") was lost if the app could not reach the server.
2. **A retried request** after a timeout could be applied twice: the first attempt may have succeeded and only the response was lost.
3. **A dual write in the trips module.** On completion it saved the trip in PostgreSQL and then enqueued the charge job in Redis. A crash between the two steps lost the charge; enqueuing first and failing the commit charged for a trip that was never completed.

## Decision

Every trip action is delivered **at least once** and applied **exactly once**:

1. **Offline queue in the driver app.** Driver actions are stored in a local SQLite database with the device time, the GPS point and a client-generated idempotency key, and sent in order after reconnection with retries (1, 2, 4 … 30 s). The server state wins a conflict: if the passenger cancelled while the driver was offline, the queued action is rejected and the driver is shown why.
2. **Idempotency keys on the server.** The API layer stores each processed key with its result for 48 h in PostgreSQL, in the same transaction as the business change. A repeated request gets the stored result.
3. **Transactional outbox.** A module writes the business change and the event it triggers (charge, push, receipt) to an `outbox` table in **one transaction**. The background worker reads the outbox every second (`FOR UPDATE SKIP LOCKED`) and executes or enqueues the job. Jobs are idempotent themselves: a charge uses the trip ID as the payment provider's idempotency key.
4. **External calls** have timeouts, retries with backoff and a circuit breaker, with the fallbacks from the [unhappy paths](../../requirements/unhappy-paths.md): cached or straight-line route (UP-22), cash (UP-18), Google / Apple sign-in (UP-25).

## Alternatives considered

- **Enqueue jobs in Redis directly after the commit** — simple, but it is the dual write described above.
- **Distributed transaction across PostgreSQL and Redis** — Redis does not take part in two-phase commit; the complexity is not justified.
- **Kafka with an outbox** — the ideal architecture; too expensive to run for the MVP. The outbox table is the same, only the relay changes.
- **Online-only driver app** — fails NFR-9 and UP-13.

## Consequences

**Positive:**

- No lost or duplicated status changes or charges, verified by [QAS-2](../characteristics.md#qas-2-fault-tolerance-driver-offline-during-a-trip).
- When the trips module is extracted into the order service, the outbox moves with it and is relayed to Kafka instead of Redis.

**Negative:**

- Jobs start up to ≈ 1–2 s after the commit because of outbox polling. Latency-critical paths (offers to drivers) do not go through the outbox.
- The outbox and idempotency tables need clean-up jobs.
- The driver app becomes offline-first: a local database, ordered replay and conflict handling, which adds work to the Flutter app chosen in [ADR-0003](0003-flutter-and-react-clients.md).
- Times recorded on the device can be tampered with, so they are checked against the GPS track and the map route ([UP-17](../../requirements/unhappy-paths.md)).
