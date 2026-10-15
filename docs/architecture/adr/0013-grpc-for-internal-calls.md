# ADR-0013: gRPC for synchronous calls between services

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

Some interactions between services need an immediate response: the gateway creates a trip in the order service, the order service requests a driver from the matching service and initiates payment. Services are written in different languages (Node.js and Go, [ADR-0010](0010-go-for-matching-service.md)). Latency must fit into 300 ms per request ([NFR-3](../../requirements/non-functional.md)).

## Decision

Synchronous calls inside the system use **gRPC** with Protocol Buffers schemas in a shared monorepo package. The external API for clients is HTTPS/JSON through the gateway. Asynchronous notifications are Kafka events ([ADR-0009](0009-kafka-for-async-events.md)).

## Alternatives considered

- **REST/JSON internally** — no strict contract between Node.js and Go, larger messages.
- **Kafka events only** — unsuitable for requests that need an immediate answer (for example, driver search).

## Consequences

**Positive:**

- Strict contract: client and server code is generated from the schemas for both languages.
- Compact binary format and HTTP/2 reduce latency.

**Negative:**

- Schemas need versioning and backward compatibility.
- Debugging is harder than with JSON and requires dedicated tools.
