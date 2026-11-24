# ADR-0005: Two availability zones with automatic failover

- **Status:** Accepted
- **Date:** 2026-11-24

## Context

Availability is one of the three top [architecture characteristics](../characteristics.md) (AC-1). Ordering must be available ≥ 99.9% per month, which allows at most 43 min of downtime ([NFR-7](../../requirements/non-functional.md)). The most likely infrastructure failure is the loss of one instance or one availability zone ([UP-23](../../requirements/unhappy-paths.md), [UP-24](../../requirements/unhappy-paths.md)); restoring a database from backup alone takes longer than the whole monthly budget.

Data must stay in Ukraine or the EU ([CON-8](../../requirements/constraints.md)) and infrastructure must cost no more than $2,000 per month ([CON-1](../../requirements/constraints.md)).

The starting architecture previously described the instances only as a text sketch, and the background worker ran as a single instance — a single point of failure for card charges, receipts and notifications.

## Decision

Production runs in **one EU region across two availability zones**:

- A **managed load balancer** spanning both zones is the only public entry point. It terminates TLS and checks instance health every 10 s. This is how the single entry point of [ADR-0004](0004-api-gateway-single-entry-point.md) is implemented in the starting architecture: the gateway logic is middleware inside the backend.
- **Backend API: 2 instances**, one per zone, stateless; scales out to 4 at CPU > 70%.
- **Background worker: 2 instances**, one per zone. Jobs are taken with locking, so both workers can run at the same time without processing a job twice.
- **PostgreSQL:** managed, primary + **synchronous standby** in the other zone, automatic failover, point-in-time recovery.
- **Redis:** managed, primary + replica in the other zone, automatic failover, append-only file persistence.
- **Clients** retry with backoff and an idempotency key ([ADR-0006](0006-idempotent-actions-offline-queue-and-outbox.md)) and reconnect WebSocket automatically.
- A **synthetic check** places a test order every minute from two regions.
- **Backups** are copied to a second EU region; no environment runs there.

See the [deployment diagram](../starting/deployment.md).

## Alternatives considered

- **Single zone, restore from backup** — about $150–280 per month cheaper, but a zone outage means hours of downtime and breaks NFR-7.
- **Two regions, active-passive** — survives a region outage, but roughly doubles infrastructure cost and the operational work; region-wide outages are much rarer than zone outages.
- **Self-hosted PostgreSQL with Patroni** — same failover, but the small team ([CON-3](../../requirements/constraints.md)) would have to operate it.

## Consequences

**Positive:**

- The loss of an instance or a zone interrupts ordering for ≤ 3 min with no lost data ([QAS-1](../characteristics.md#qas-1-availability-loss-of-an-availability-zone)).
- Releases are rolled out one instance at a time without downtime.

**Negative:**

- ≈ $150–280 per month more than a single zone (database standby, Redis replica, second worker).
- Synchronous replication adds a few milliseconds to every database write.
- A failover drops open WebSocket connections; clients must reconnect and resynchronise ([UP-23](../../requirements/unhappy-paths.md)).
- A whole-region outage is not covered: recovery from backups takes hours (see [characteristics](../characteristics.md#left-out-and-the-consequence), AC-7).
