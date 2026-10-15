# C2 — Container diagram: Taxi ordering system (starting)

Seven containers instead of twelve: three client apps, one backend, one background worker and two data stores. All server-side code is TypeScript. The reasoning for every change is in the [component analysis](README.md#component-analysis).

```mermaid
flowchart TB
  passenger["<b>Passenger</b><br/>[Person]"]
  driver["<b>Driver</b><br/>[Person]"]
  operator["<b>Support operator</b><br/>[Person]"]

  subgraph boundary["Taxi ordering system [Software System]"]
    direction TB
    passengerApp["<b>Passenger app</b><br/>[Container: Flutter]<br/><br/>Ride ordering, map, payment, rating"]
    driverApp["<b>Driver app</b><br/>[Container: Flutter]<br/><br/>Accepting orders, navigation, earnings"]
    adminApp["<b>Admin panel</b><br/>[Container: React, TypeScript]<br/><br/>Driver moderation, tariffs, analytics"]

    backend["<b>Backend API</b><br/>[Container: Node.js, TypeScript, NestJS]<br/><br/>Modular monolith: auth, trips and pricing, matching,<br/>payments, admin. REST API and WebSocket"]
    worker["<b>Background worker</b><br/>[Container: Node.js, TypeScript, BullMQ]<br/><br/>Same codebase as the backend. Sends notifications<br/>and receipts, retries payments"]

    db[("<b>Main database</b><br/>[Container: PostgreSQL]<br/><br/>Users, drivers, trips,<br/>tariffs, payments")]
    redis[("<b>Redis</b><br/>[Container: Redis]<br/><br/>Driver geo index, login codes,<br/>job queue, WebSocket pub/sub")]
  end

  maps["<b>Google Maps API</b><br/>[External Software System]"]
  pay["<b>Payment provider</b><br/>[External Software System]"]
  sms["<b>SMS gateway</b><br/>[External Software System]"]
  push["<b>Firebase Cloud Messaging</b><br/>[External Software System]"]

  passenger -- "Orders a ride" --> passengerApp
  driver -- "Accepts orders" --> driverApp
  operator -- "Manages the system" --> adminApp

  passengerApp -- "Calls API, receives car position<br/>[HTTPS / JSON, WebSocket]" --> backend
  driverApp -- "Calls API, sends location<br/>[HTTPS / JSON, WebSocket]" --> backend
  adminApp -- "Calls API<br/>[HTTPS / JSON]" --> backend

  backend -- "Reads and writes data<br/>[SQL / TCP]" --> db
  backend -- "Driver positions, codes, enqueues jobs<br/>[Redis protocol]" --> redis
  worker -- "Takes jobs from the queue<br/>[Redis protocol]" --> redis
  worker -- "Reads and writes data<br/>[SQL / TCP]" --> db

  backend -- "Requests route and ETA<br/>[HTTPS / REST]" --> maps
  backend -- "Creates payments, receives webhooks<br/>[HTTPS / REST]" --> pay
  worker -- "Sends login codes<br/>[HTTPS / REST]" --> sms
  worker -- "Sends push notifications<br/>[HTTPS / REST]" --> push

  subgraph legend["Legend"]
    direction LR
    lPerson["Person"]
    lContainer["Container of our system"]
    lStore[("Data store")]
    lExternal["External system"]
    lBoundary["Dashed border = system boundary<br/>Arrow = who calls whom, [protocol]"]
  end

  classDef person fill:#08427b,stroke:#052e56,color:#ffffff
  classDef container fill:#1168bd,stroke:#0b4884,color:#ffffff
  classDef store fill:#1168bd,stroke:#0b4884,color:#ffffff
  classDef external fill:#8a8a8a,stroke:#6b6b6b,color:#ffffff
  classDef note fill:#ffffff,stroke:#bbbbbb,color:#333333
  class passenger,driver,operator,lPerson person
  class passengerApp,driverApp,adminApp,backend,worker,lContainer container
  class db,redis,lStore store
  class maps,pay,sms,push,lExternal external
  class lBoundary note
  style boundary fill:none,stroke:#0b4884,stroke-dasharray:6 4
  style legend fill:#fafafa,stroke:#bbbbbb
```

## What is on the diagram

**Client row — unchanged.** Passenger and driver apps in Flutter ([CON-4](../../requirements/constraints.md), [ADR-0003](../adr/0003-flutter-and-react-clients.md)), sharing Flutter packages. Admin panel in React with TypeScript.

**Backend API.** One NestJS application that replaces the gateway, the real-time service and four services of the ideal architecture. Inside it is split into modules with the same boundaries as the ideal services, see [C3](c3-backend-api.md). It runs as two instances behind a managed load balancer, so clients know one address ([ADR-0004](../adr/0004-api-gateway-single-entry-point.md)).

**Background worker.** The same codebase started in worker mode. It processes jobs from the Redis queue: push notifications, SMS codes, receipts, payment retries, clean-up of old location data ([NFR-16](../../requirements/non-functional.md)). Slow external calls never block an API request.

**Two data stores.** PostgreSQL is the source of truth. Redis is the only extra technology on the server side and is used for five jobs: driver geo index, login codes and offer timers with TTL, job queue, WebSocket pub/sub between instances, rate-limit counters.

## Containers

| Container | Technology | Responsibility | Instances | Requirements |
|---|---|---|---|---|
| Passenger app | Flutter | Ordering, map, payment, rating | — | FR-1 … FR-19 |
| Driver app | Flutter | Accepting orders, navigation, earnings | — | FR-20 … FR-28 |
| Admin panel | React, TypeScript | Moderation, tariffs, analytics | — | FR-29 … FR-34 |
| Backend API | Node.js, TypeScript, NestJS, Socket.IO | REST API, WebSocket, all business logic | 2 | FR-1 … FR-38, NFR-1, NFR-3 |
| Background worker | Node.js, TypeScript, BullMQ | Notifications, receipts, payment retries, clean-up jobs | 1 | FR-14, FR-15, FR-18, NFR-16, NFR-17 |
| Main database | PostgreSQL (managed) | Users, drivers, trips, tariffs, payments | Primary + standby | NFR-10 |
| Redis | Redis (managed) | Geo index, TTL keys, job queue, pub/sub, rate limits | Primary + replica | NFR-1, NFR-2, NFR-13 |

## Compared with the ideal C2

| | Ideal | Starting |
|---|---|---|
| Containers | 12 | 7 |
| Server-side deployables | 6 (gateway, real-time, 4 services) | 2 (backend, worker) |
| Server-side languages | TypeScript, Go | TypeScript |
| Data stores | PostgreSQL, Redis, Kafka | PostgreSQL, Redis |
| Communication between services | gRPC + Kafka | In-process calls + Redis job queue |

Previous level: [C1 — System Context](c1-system-context.md). Next level: [C3 — Components](c3-backend-api.md).
