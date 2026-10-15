# ADR-0008: Redis geo index for available driver positions

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

The position of every online driver changes every 2–5 seconds ([NFR-2](../../requirements/non-functional.md)) — about 330 updates per second on average and 1,700 at peak. Matching must take up to 5 seconds in 95% of cases ([NFR-1](../../requirements/non-functional.md)), and every search is a query like "find the nearest available drivers within N km". Search needs only the current position, not the history.

## Decision

Current positions of available drivers are stored in **Redis** with a geo index (`GEOADD` / `GEOSEARCH`). The real-time service updates positions, the matching service searches for the nearest drivers.

## Alternatives considered

- **PostgreSQL + PostGIS** — thousands of updates per second in a relational database make no sense: every write is a transaction, a log entry and an index update on disk.
- **In-memory in the matching service** — lost on restart and does not work with multiple instances.

## Consequences

**Positive:**

- Nearest-driver search in milliseconds.
- The main database is not loaded with frequent updates.

**Negative:**

- Redis is not the source of truth: if data is lost, positions are rebuilt from the next driver updates within a few seconds.
- Retention of tracks for analytics and safety is handled separately ([NFR-16](../../requirements/non-functional.md)).
