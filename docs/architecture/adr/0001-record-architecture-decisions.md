# ADR-0001: Record architecture decisions as ADRs

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

The system consists of several apps, services and data stores. The reasons for choosing a particular technology or service boundary are quickly forgotten. New team members see the result but not which options were considered and why they were rejected.

## Decision

Every significant architecture decision is recorded as a separate Markdown file in `docs/architecture/adr/` using the [template](template.md): context, decision, alternatives, consequences.

## Alternatives considered

- **Wiki or Confluence** — documentation drifts away from the code and goes stale without anyone noticing in review.
- **Not recording decisions** — discussions repeat, and decisions get revisited without understanding the original reasons.

## Consequences

**Positive:**

- The decision history lives next to the code and is reviewed together with the changes.
- The question "why is it like this" can be answered with a link.

**Negative:**

- Requires discipline: a decision without an ADR is not considered accepted.
