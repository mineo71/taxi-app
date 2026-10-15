# Ideal architecture (target)

The architecture the system grows into after the MVP: high load, several cities, several teams. Every part scales and fails independently, and each technology is chosen for its specific job — Go for matching, Kafka for events, a dedicated gateway and real-time service.

It is not built on day one. The [starting architecture](../starting/README.md) implements the same requirements with fewer moving parts, and its modules are extracted into these services step by step when measured triggers are reached (see [path to the ideal architecture](../starting/README.md#path-to-the-ideal-architecture)).

## Diagrams

- [C1 — System Context](c1-system-context.md)
- [C2 — Containers](c2-containers.md)
- [C3 — Components of the order service](c3-order-service.md)
- draw.io: [`diagrams/taxi-c4-model.drawio`](diagrams/taxi-c4-model.drawio)

## Summary

| | |
|---|---|
| Containers | 12 |
| Server-side deployables | 6: API Gateway, real-time service, order, matching, payment, notification services |
| Languages | Dart, TypeScript, Go, SQL, Protocol Buffers |
| Data stores | PostgreSQL, Redis, Kafka |
| Communication | gRPC for synchronous calls, Kafka for events |
