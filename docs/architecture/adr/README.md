# Architecture decision records (ADR)

An Architecture Decision Record is a short document that captures one significant architecture decision: its context, the decision itself, the alternatives considered and the consequences. The format is described in [ADR-0001](0001-record-architecture-decisions.md); the template is in [template.md](template.md).

| # | Decision | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions as ADRs | Accepted |
| [0002](0002-monorepo.md) | Monorepo for clients, services and documentation | Accepted |
| [0003](0003-flutter-and-react-clients.md) | Flutter for mobile apps, React for the admin panel | Accepted |
| [0004](0004-api-gateway-single-entry-point.md) | API Gateway as the single entry point | Accepted |
| [0005](0005-separate-realtime-service.md) | Separate real-time service on WebSocket | Accepted |
| [0006](0006-services-by-responsibility.md) | Split services by area of responsibility | Accepted |
| [0007](0007-postgresql-as-source-of-truth.md) | PostgreSQL as the main data store | Accepted |
| [0008](0008-redis-geo-index-for-driver-positions.md) | Redis geo index for available driver positions | Accepted |
| [0009](0009-kafka-for-async-events.md) | Kafka for asynchronous events | Accepted |
| [0010](0010-go-for-matching-service.md) | Go for the driver matching service | Accepted |
| [0011](0011-hexagonal-architecture-order-service.md) | Hexagonal architecture for the order service | Accepted |
| [0012](0012-external-payment-provider.md) | Payments through an external PCI DSS provider | Accepted |
| [0013](0013-grpc-for-internal-calls.md) | gRPC for synchronous calls between services | Accepted |

## Rules

- One ADR — one decision.
- An accepted ADR is not edited. If a decision changes, a new ADR is created and the old one gets the status "Superseded by ADR-XXXX".
- Numbering is sequential and numbers are never reused.
