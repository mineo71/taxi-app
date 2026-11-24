# ADR-0007: Driver positions only in Redis, pushed to passengers over WebSocket

- **Status:** Accepted
- **Date:** 2026-11-24

## Context

Performance is one of the three top [architecture characteristics](../characteristics.md) (AC-3). The offer must reach the first candidate within p95 ≤ 5 s ([NFR-1](../../requirements/non-functional.md)), the car position must reach the passenger within p95 ≤ 1 s ([NFR-2](../../requirements/non-functional.md)), and the API must answer within p95 ≤ 300 ms ([NFR-3](../../requirements/non-functional.md)).

Every online driver sends a position every 3 s: ≈ 330 updates per second on average and ≈ 1,700 at peak. This is by far the largest write stream in the system, and it would compete with trips and payments for the same PostgreSQL instance. The C3 diagram sent positions into the matching module without saying where they were stored.

## Decision

- A separate **location module** in the backend receives driver positions over WebSocket.
- Each position goes **only to Redis**: `GEOADD` into the geo index of available drivers, and a publish to the trip channel when the driver is on a trip. The API layer of any backend instance pushes it to the passenger over WebSocket; Redis pub/sub connects the two instances.
- Nearest-driver search in the matching module is `GEOSEARCH` in Redis.
- **Nothing is written to PostgreSQL on this path.** Track points of active trips are appended to a Redis stream and saved to PostgreSQL in batches by the background worker every 30 s and at trip completion.
- Repeated routes from Google Maps are cached in Redis.

## Alternatives considered

- **PostgreSQL with PostGIS** — geo queries are possible, but 1,700 writes per second plus index maintenance load the same database that holds trips and payments, putting NFR-3 at risk.
- **Passenger app polls for the position** — up to 500 extra requests per second, more battery and traffic, and a delay of up to the polling interval.
- **Separate real-time service** — the ideal architecture; at 7,500 peak connections it is not needed yet (see the [path to the ideal architecture](../starting/README.md#path-to-the-ideal-architecture)).

## Consequences

**Positive:**

- Nearest-driver search in milliseconds ([QAS-3](../characteristics.md#qas-3-performance-driver-matching-at-peak-load)); PostgreSQL load does not grow with the number of drivers online.
- The location module has the same boundary as the future real-time service, so it can be extracted without a rewrite.

**Negative:**

- Positions are volatile: after a Redis failover drivers may briefly disappear from the map until their next update ([UP-24](../../requirements/unhappy-paths.md)).
- Up to ≈ 1 s of track points can be lost in a Redis failure; the price then falls back to the map route ([UP-17](../../requirements/unhappy-paths.md)).
- The retention rules from [NFR-16](../../requirements/non-functional.md) must be applied in two places: Redis and the batched track in PostgreSQL.
