# C2 — Container diagram: Taxi ordering system (starting)

Seven containers instead of twelve: three client apps, one backend, one background worker and two data stores. All server-side code is TypeScript. The reasoning for every change is in the [component analysis](README.md#component-analysis).

![C2 — Container diagram (starting)](diagrams/c2-containers.png)

*Source: [`taxi-c4-model-starting.drawio`](diagrams/taxi-c4-model-starting.drawio), page "C2 — Containers". Open it at [app.diagrams.net](https://app.diagrams.net) to edit.*

## What is on the diagram

**Client row — unchanged.** Passenger and driver apps in Flutter ([CON-4](../../requirements/constraints.md), [ADR-0003](../adr/0003-flutter-and-react-clients.md)), sharing Flutter packages. Admin panel in React with TypeScript.

**Backend API.** One NestJS application that replaces the gateway, the real-time service and four services of the ideal architecture. Inside it is split into modules with the same boundaries as the ideal services, see [C3](c3-backend-api.md). It runs as two instances behind a managed load balancer, so clients know one address ([ADR-0004](../adr/0004-api-gateway-single-entry-point.md)).

**Driver app offline queue.** Actions the driver takes without a network are stored in a local SQLite database and replayed in order with idempotency keys after reconnection ([ADR-0006](../adr/0006-idempotent-actions-offline-queue-and-outbox.md)). SQLite runs inside the app process, so it is part of the driver app container, not a separate one.

**Background worker.** The same codebase started in worker mode, two instances. It relays the outbox — events written by the backend in the same transaction as the business change — and processes jobs from the Redis queue: push notifications, SMS codes, receipts, payment charges and retries, batched trip tracks, clean-up of old location data ([NFR-16](../../requirements/non-functional.md)). Slow external calls never block an API request.

**Two data stores.** PostgreSQL is the source of truth, including the outbox and idempotency keys. Redis is the only extra technology on the server side and is used for six jobs: driver geo index and live positions ([ADR-0007](../adr/0007-driver-positions-in-redis-only.md)), login codes and offer timers with TTL, job queue, WebSocket pub/sub between instances, rate-limit counters, route cache.

How the containers are placed in two availability zones is shown on the [deployment diagram](deployment.md).

## Containers

| Container | Technology | Responsibility | Instances | Requirements |
|---|---|---|---|---|
| Passenger app | Flutter | Ordering, map, payment, rating | — | FR-1 … FR-19 |
| Driver app | Flutter, SQLite | Accepting orders, navigation, earnings, offline action queue | — | FR-20 … FR-28, NFR-9 |
| Admin panel | React, TypeScript | Moderation, tariffs, analytics | — | FR-29 … FR-34 |
| Backend API | Node.js, TypeScript, NestJS, Socket.IO | REST API, WebSocket, all business logic, idempotency keys | 2, one per zone | FR-1 … FR-38, NFR-1, NFR-3, NFR-8 |
| Background worker | Node.js, TypeScript, BullMQ | Outbox relay, notifications, receipts, payment charges and retries, clean-up jobs | 2, one per zone | FR-14, FR-15, FR-18, NFR-8, NFR-16, NFR-17 |
| Main database | PostgreSQL (managed) | Users, drivers, trips, tariffs, payments, outbox, idempotency keys | Primary + synchronous standby | NFR-8, NFR-10 |
| Redis | Redis (managed) | Geo index, live positions, TTL keys, job queue, pub/sub, rate limits, route cache | Primary + replica | NFR-1, NFR-2, NFR-13 |

## Compared with the ideal C2

| | Ideal | Starting |
|---|---|---|
| Containers | 12 | 7 |
| Server-side deployables | 6 (gateway, real-time, 4 services) | 2 (backend, worker) |
| Server-side languages | TypeScript, Go | TypeScript |
| Data stores | PostgreSQL, Redis, Kafka | PostgreSQL, Redis |
| Communication between services | gRPC + Kafka | In-process calls + Redis job queue |

Previous level: [C1 — System Context](c1-system-context.md). Next level: [C3 — Components](c3-backend-api.md).
