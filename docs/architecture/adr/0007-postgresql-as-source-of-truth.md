# ADR-0007: PostgreSQL as the main data store

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

Users, drivers, trips, tariffs and payments are related data where transactions and integrity matter: a trip must not be paid twice, and a tariff must not disappear in the middle of a trip. Backups must meet an RPO of 15 minutes and an RTO of 1 hour ([NFR-10](../../requirements/non-functional.md)). Data is stored in Ukraine or the EU ([CON-8](../../requirements/constraints.md)).

## Decision

**PostgreSQL** is the source of truth for users, trips, tariffs and payments. Code accesses it through repositories (Prisma) in each service.

## Alternatives considered

- **MongoDB** — a flexible schema gives no benefit for clearly structured data, and relationships between entities have weaker guarantees.
- **MySQL** — a viable option, but PostgreSQL has PostGIS for geo queries in analytics and better JSON column support.

## Consequences

**Positive:**

- ACID transactions for trips and payments.
- Continuous transaction log archiving gives an RPO of minutes.
- Read replicas offload analytics ([FR-34](../../requirements/functional.md)).

**Negative:**

- Frequently changing data (driver positions) is not written here — it has a separate store ([ADR-0008](0008-redis-geo-index-for-driver-positions.md)).
