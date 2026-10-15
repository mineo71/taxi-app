# C3 — Component diagram: Backend API (starting)

The backend API is the only container with business logic, so it is the one opened up at C3. Its modules have the same boundaries as the services of the [ideal architecture](../ideal/c2-containers.md): the trips module is the future order service, the matching module is the future matching service, the payments module is the future payment service.

![C3 — Component diagram: backend API (starting)](diagrams/c3-backend-api.png)

*Source: [`taxi-c4-model-starting.drawio`](diagrams/taxi-c4-model-starting.drawio), page "C3 — Components". Open it at [app.diagrams.net](https://app.diagrams.net) to edit.*

## Components

| Component | Role | Becomes in the ideal architecture |
|---|---|---|
| API layer | NestJS controllers for REST and a Socket.IO gateway for WebSocket. Validates input, checks the access token, applies rate limits. No business logic | API Gateway + real-time service |
| Auth module | Login codes (6 digits, 5 min TTL in Redis), Google / Apple sign-in, access and refresh tokens | Part of the gateway |
| Admin module | Driver moderation, tariff management, analytics queries | Admin endpoints of the services |
| Trips module | Trip state machine, cancellations and fees, price calculation with the shared pricing package ([`packages/shared/pricing.js`](../../../packages/shared/pricing.js)) | Order service |
| Matching module | Nearest drivers via Redis `GEOSEARCH`, ranking, offers with a 15 s timeout | Driver matching service |
| Payments module | Payment provider client, webhook handling, refunds | Payment service |
| Data access | Prisma client and migrations; the only place that knows the database schema | Repositories in each service |
| Maps client | Google Maps calls for distance, duration and ETA, with caching of repeated routes | Maps client of the order service |
| Redis adapter | ioredis and BullMQ: geo index, TTL keys, job queue, pub/sub between instances | Redis client + Kafka publisher |

## Rules inside the monolith

The modules live in one process, so nothing technically stops them from calling each other's internals. These rules keep extraction into services possible later:

1. **A module talks to another module only through its public interface** (an exported NestJS service), never through its database tables.
2. **Each module owns its tables.** The trips module does not write to payment tables directly — it asks the payments module.
3. **Business logic does not know about NestJS, Prisma or Redis.** Logic calls interfaces; the data access, maps client and Redis adapter implement them — the same ports-and-adapters idea as in the [ideal C3](../ideal/c3-order-service.md).

Trip states are the same as in the ideal architecture: see [trip states](../ideal/c3-order-service.md#trip-states).

Previous level: [C2 — Containers](c2-containers.md).
