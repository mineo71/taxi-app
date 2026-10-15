# Starting architecture (MVP)

The architecture we launch with. It implements the same requirements as the [ideal architecture](../ideal/README.md) but is sized for the MVP: 4–6 months, ≈ 1,600 person-hours, $60,000 for development and up to $2,000 per month for infrastructure ([constraints](../../requirements/constraints.md)).

Principles:

1. **One backend language — TypeScript.** The backend, background worker, admin panel and shared packages are all TypeScript. The only other client language is Dart, because the mobile apps must be Flutter ([CON-4](../../requirements/constraints.md)).
2. **Modular monolith instead of microservices.** One backend codebase split into modules that mirror the ideal services. Modules call each other in-process, not over the network.
3. **Specific technology only where it is really needed.** Every technology outside TypeScript must be justified by a requirement.
4. **Managed services instead of self-hosted infrastructure.** PostgreSQL and Redis are rented as managed services, so the team does not operate databases.

## Diagrams

- [C1 — System Context](c1-system-context.md)
- [C2 — Containers](c2-containers.md)
- [C3 — Components of the backend API](c3-backend-api.md)
- draw.io: [`diagrams/taxi-c4-model-starting.drawio`](diagrams/taxi-c4-model-starting.drawio)

## Languages

| | Ideal architecture | Starting architecture |
|---|---|---|
| Mobile apps | Dart (Flutter) | Dart (Flutter) — required by CON-4 |
| Admin panel | TypeScript (React) | TypeScript (React) |
| Backend | TypeScript (Node.js) + Go | TypeScript (Node.js) |
| Service contracts | Protocol Buffers (gRPC) | TypeScript types in a shared package |
| Data | SQL, Redis, Kafka | SQL (via Prisma), Redis |
| **Languages to know** | **Dart, TypeScript, Go, SQL, Protobuf** | **Dart, TypeScript, SQL** |

If CON-4 is ever lifted, the mobile apps could move to React Native and the whole system would be TypeScript. With the current team this would cost retraining time that the MVP schedule does not have.

## Component analysis

Every container of the ideal architecture and what happens to it at the start:

| Ideal container | Ideal technology | Starting architecture | Why |
|---|---|---|---|
| Passenger app | Flutter | **Kept** — Flutter | CON-4; background GPS and native maps work well in Flutter |
| Driver app | Flutter | **Kept** — Flutter, shares packages with the passenger app | Same as above; one Flutter workspace, two builds |
| Admin panel | React | **Kept** — React (TypeScript) | Same language as the backend; mature table and dashboard libraries |
| API Gateway | Node.js | **Merged** into the backend: auth guard, rate limiting and routing as middleware behind a managed load balancer | One deployable less. Clients still know a single address (`api.<domain>`), so a dedicated gateway can be added later without app updates ([ADR-0004](../adr/0004-api-gateway-single-entry-point.md)) |
| Real-time service | Node.js, WebSocket | **Merged** into the backend as a WebSocket gateway (Socket.IO) | 1,500 average / 7,500 peak connections ([NFR design load](../../requirements/non-functional.md)) fit into two Node.js instances |
| Order service | Node.js | **Module** of the backend — trips module | Core logic stays isolated as a module |
| Driver matching service | Go | **Module** of the backend — matching module, in TypeScript | 10–50 orders per minute do not need Go. The heavy part — nearest-driver search — is done by Redis |
| Payment service | Node.js | **Module** of the backend — payments module | Card data never reaches us anyway (provider tokens, NFR-12), so a separate service gives little extra isolation |
| Notification service | Node.js | **Background worker** — same codebase, separate process | Sending push and SMS must not slow down API requests |
| PostgreSQL | PostgreSQL | **Kept** — managed PostgreSQL | Needs a real relational database (see below) |
| Redis | Redis | **Kept** — managed Redis, used for more jobs | Needs Redis (see below) |
| Kafka | Kafka | **Removed** — replaced by a job queue in Redis (BullMQ) | A Kafka cluster is expensive to run and operate; at 10 orders per minute a Redis queue with retries is enough |
| gRPC between services | Protobuf | **Removed** — in-process calls between modules | There is no network between modules |

Result: **12 containers → 7**, **5 languages → 3**, **3 data stores → 2**.

## What still needs specific technology

| Technology | Why plain TypeScript code is not enough | Requirements |
|---|---|---|
| **PostgreSQL** | Trips and payments need transactions and integrity (a trip must not be paid twice). Managed PostgreSQL gives point-in-time recovery for RPO ≤ 15 min | NFR-10, FR-37, FR-15 |
| **Redis** | One tool covers five jobs: (1) geo index of available drivers — nearest-driver search in milliseconds with ≈ 330–1,700 position updates per second; (2) one-time login codes and offer timers with automatic expiry (TTL); (3) job queue with retries for notifications, receipts and payment retries; (4) pub/sub that delivers WebSocket events between the two backend instances; (5) rate-limit counters. Without Redis each of these would need a separate solution | NFR-1, NFR-2, NFR-13, FR-1, FR-22, FR-14 |
| **Flutter** | Team constraint; background location and native maps on both platforms | CON-4, NFR-22, NFR-23 |
| **Google Maps API** | Routes, ETA and address autocomplete are not something to build ourselves | CON-5, FR-4, FR-10 |
| **Payment provider** | PCI DSS — card data must stay with a certified provider | CON-6, NFR-12 |

## How it meets the constraints

| Constraint | How the starting architecture fits |
|---|---|
| CON-1 Budget | Fewer components to build and test; infrastructure estimate below is well under $2,000 per month |
| CON-2 Timeline (4–6 months) | One backend codebase, no inter-service contracts, one deployment pipeline |
| CON-3 Team (≈ 1,600 h) | Backend developers work in one language and one repository; no Go or Kafka expertise needed |
| CON-4 Flutter | Mobile apps stay in Flutter |
| CON-5 Google Maps | Called from the backend through one maps client |
| CON-6 One payment provider | Called only from the payments module |
| CON-8 Data in Ukraine / EU | Managed PostgreSQL and Redis in one EU region |
| CON-10 Android 8+ | Unaffected by the backend choice; covered by Flutter |

## Deployment

```
Mobile apps, admin panel
        │  HTTPS / WebSocket — one address: api.<domain>
        ▼
Managed load balancer (TLS)
        │
        ├── Backend API — 2 instances in different availability zones
        └── Background worker — 1 instance
                │
                ├── Managed PostgreSQL — primary + standby, point-in-time recovery
                └── Managed Redis — primary + replica, persistence enabled
```

Two backend instances in different zones and managed databases with a standby cover the 99.9% availability target ([NFR-7](../../requirements/non-functional.md)).

### Infrastructure cost estimate

Rough monthly estimate for one EU region (Google Maps and SMS are counted separately in the [budget](../../project/budget.md)):

| Item | USD per month |
|---|---|
| Backend API, 2 instances (2 vCPU, 4 GB) | 80 – 150 |
| Background worker, 1 instance | 40 – 70 |
| Managed PostgreSQL with standby | 150 – 300 |
| Managed Redis with replica | 60 – 120 |
| Load balancer, file storage (driver documents), backups | 50 – 100 |
| Logging and monitoring | 0 – 100 |
| **Total** | **≈ 380 – 840** |

## Trade-offs

- **One deployable:** a bug in one module can take down the whole backend. Mitigated by two instances, staged rollout ([NFR-26](../../requirements/non-functional.md)) and fast rollback.
- **Shared database load:** a heavy analytics query from the admin panel can slow down trips. Mitigated by limiting admin queries and adding a read replica when needed.
- **No event replay:** a Redis job queue does not keep a history of events the way Kafka does. Trip state lives in PostgreSQL, so nothing is lost, but past events cannot be re-processed.

## Path to the ideal architecture

Module boundaries match the ideal services, so moving to the ideal architecture means extracting a module, not rewriting it. Each step is taken only when a measured trigger is reached:

| Trigger | Step |
|---|---|
| More than ≈ 20,000 concurrent WebSocket connections, or WebSocket load affects API latency (NFR-3) | Extract the WebSocket gateway into a separate real-time service |
| Matching p95 approaches 5 s (NFR-1) or load exceeds ≈ 500 orders per minute | Extract the matching module into a separate service; rewrite in Go if it becomes CPU-bound |
| Three or more independent consumers of trip events, or a need to replay events | Replace the Redis job queue with Kafka |
| Several teams work on the backend, or the number of client types grows | Split modules into services and introduce a dedicated API Gateway |
