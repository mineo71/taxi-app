# Architecture decision records (ADR)

An Architecture Decision Record is a short document that captures one significant architecture decision: its context, the decision itself, the alternatives considered and the consequences. The format is described in [ADR-0001](0001-record-architecture-decisions.md); the template is in [template.md](template.md).

| # | Decision | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions as ADRs | Accepted |
| [0002](0002-monorepo.md) | Monorepo for clients, services and documentation | Accepted |
| [0003](0003-flutter-and-react-clients.md) | Flutter for mobile apps, React for the admin panel | Accepted |
| [0004](0004-api-gateway-single-entry-point.md) | API Gateway as the single entry point | Accepted |

## Rules

- One ADR — one decision.
- An accepted ADR is not edited. If a decision changes, a new ADR is created and the old one gets the status "Superseded by ADR-XXXX".
- Numbering is sequential and numbers are never reused.
