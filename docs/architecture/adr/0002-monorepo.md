# ADR-0002: Monorepo for clients, services and documentation

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

The system consists of three client apps, a gateway, a real-time service, four internal services and shared contracts between them (tariffs, event formats, gRPC schemas). The team is small ([CON-3](../../requirements/constraints.md)), and a single feature often touches several parts at once — for example, a new trip status changes the order service, both mobile apps and the admin panel. [NFR-24](../../requirements/non-functional.md) requires modularity and CI/CD.

## Decision

All code and documentation live in one repository:

- `apps/` — client apps;
- `services/` — backend services;
- `packages/` — shared code and contracts;
- `docs/` — requirements, architecture, ADRs.

## Alternatives considered

- **One repository per service** — too much overhead for a small team: syncing contract versions, multiple pipelines, and changes for one feature scattered across several pull requests.

## Consequences

**Positive:**

- One feature — one pull request, atomic contract changes.
- Shared tariffs and event formats live in `packages/` and are not duplicated.
- Documentation changes together with the code.

**Negative:**

- CI must run checks only for the changed parts, otherwise builds slow down.
- Directory ownership rules (CODEOWNERS) will be needed as the team grows.
