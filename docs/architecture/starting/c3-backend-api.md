# C3 — Component diagram: Backend API (starting)

The backend API is the only container with business logic, so it is the one opened up at C3. Its modules have the same boundaries as the services of the [ideal architecture](../ideal/c2-containers.md): the trips module is the future order service, the matching module is the future matching service, the payments module is the future payment service.

```mermaid
flowchart TB
  clients["<b>Passenger app, driver app, admin panel</b><br/>[Containers: Flutter, React]"]

  subgraph backend["Backend API [Container: Node.js, TypeScript, NestJS]"]
    direction TB
    api["<b>API layer</b><br/>[Component: NestJS controllers, Socket.IO gateway]<br/><br/>REST endpoints and WebSocket. Validates input,<br/>checks the token and rate limits"]

    auth["<b>Auth module</b><br/>[Component: TypeScript]<br/><br/>Login codes, Google / Apple sign-in,<br/>access tokens"]
    admin["<b>Admin module</b><br/>[Component: TypeScript]<br/><br/>Moderation, tariffs, analytics"]
    trips["<b>Trips module</b><br/>[Component: TypeScript]<br/><br/>Trip state machine, pricing<br/>from the shared package, cancellations"]
    matching["<b>Matching module</b><br/>[Component: TypeScript]<br/><br/>Finds the nearest drivers,<br/>sends offers with a 15 s timeout"]
    payments["<b>Payments module</b><br/>[Component: TypeScript]<br/><br/>Charges via the provider,<br/>webhooks, refunds"]

    data["<b>Data access</b><br/>[Component: Prisma]<br/><br/>The only code that knows SQL"]
    mapsClient["<b>Maps client</b><br/>[Component: HTTP client]<br/><br/>Distance, duration, ETA"]
    redisAdapter["<b>Redis adapter</b><br/>[Component: ioredis, BullMQ]<br/><br/>Geo search, TTL keys,<br/>job queue, pub/sub"]
  end

  db[("<b>Main database</b><br/>[Container: PostgreSQL]")]
  redis[("<b>Redis</b><br/>[Container: Redis]")]
  maps["<b>Google Maps API</b><br/>[External Software System]"]
  pay["<b>Payment provider</b><br/>[External Software System]"]

  clients -- "API calls, positions, trip updates<br/>[HTTPS / JSON, WebSocket]" --> api

  api -- "Login requests" --> auth
  api -- "Admin requests" --> admin
  api -- "Trip requests" --> trips
  api -- "Driver positions, offer answers" --> matching
  api -- "Payment webhooks" --> payments

  trips -- "Pushes trip status to apps" --> api
  trips -- "Asks to find a driver" --> matching
  trips -- "Charges on completion" --> payments
  trips -- "Gets distance and ETA" --> mapsClient

  auth -- "Users and sessions" --> data
  admin -- "Tariffs, drivers, reports" --> data
  trips -- "Saves trip state" --> data
  payments -- "Saves payments" --> data
  auth -- "Stores login codes with TTL" --> redisAdapter
  matching -- "Geo search, offer timers" --> redisAdapter
  trips -- "Enqueues notification jobs" --> redisAdapter

  data -- "[SQL / TCP]" --> db
  redisAdapter -- "[Redis protocol]" --> redis
  mapsClient -- "[HTTPS / REST]" --> maps
  payments -- "Creates payments<br/>[HTTPS / REST]" --> pay

  subgraph legend["Legend"]
    direction LR
    lComponent["Component inside<br/>the backend API"]
    lContainer["Other container<br/>of our system"]
    lStore[("Data store")]
    lExternal["External system"]
    lBoundary["Dashed border = container boundary<br/>Unlabelled protocol = in-process call"]
  end

  classDef component fill:#85bbf0,stroke:#5d82a8,color:#0b2540
  classDef container fill:#1168bd,stroke:#0b4884,color:#ffffff
  classDef external fill:#8a8a8a,stroke:#6b6b6b,color:#ffffff
  classDef note fill:#ffffff,stroke:#bbbbbb,color:#333333
  class api,auth,admin,trips,matching,payments,data,mapsClient,redisAdapter,lComponent component
  class clients,db,redis,lContainer,lStore container
  class maps,pay,lExternal external
  class lBoundary note
  style backend fill:none,stroke:#0b4884,stroke-dasharray:6 4
  style legend fill:#fafafa,stroke:#bbbbbb
```

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
