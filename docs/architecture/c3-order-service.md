# C3 — Component diagram: Order service

A **component** is a logically grouped block of code inside one container: a package, a module, a set of classes behind a common interface. It does not run on its own; it lives in the same process as the other components of the container.

At the C3 level only **one** container is opened up. The order service was chosen because it holds the core business logic. The other services are mostly thin wrappers around external integrations: the payment service essentially forwards calls to the payment gateway, the notification service to the push provider.

```mermaid
flowchart TB
  gateway["<b>API Gateway</b><br/>[Container: Node.js]<br/><br/>Single entry point for the passenger,<br/>driver and admin apps"]

  subgraph orders["Order service [Container: Node.js]"]
    direction TB
    controller["<b>Order controller</b><br/>[Component: Express, REST]<br/><br/>Accepts requests to create, update<br/>and cancel a trip and validates input"]

    lifecycle["<b>Trip lifecycle manager</b><br/>[Component: TypeScript]<br/><br/>Manages states: created, driver assigned,<br/>in progress, completed"]
    pricing["<b>Price calculator</b><br/>[Component: TypeScript]<br/><br/>Calculates the price from tariff,<br/>distance and waiting time"]
    cancel["<b>Cancellation handler</b><br/>[Component: TypeScript]<br/><br/>Decides whether a cancellation<br/>fee applies"]

    repo["<b>Trip repository</b><br/>[Component: Prisma]<br/><br/>Reads and writes trip data in the database"]
    publisher["<b>Event publisher</b><br/>[Component: Kafka client]<br/><br/>Publishes trip status change events"]
    matchingClient["<b>Matching service client</b><br/>[Component: gRPC client]<br/><br/>Requests a search for an available car"]
    mapsClient["<b>Maps service client</b><br/>[Component: HTTP client]<br/><br/>Gets route distance and duration"]
  end

  db[("<b>Main database</b><br/>[Container: PostgreSQL]")]
  kafka[("<b>Message broker</b><br/>[Container: Kafka]")]
  matching["<b>Driver matching service</b><br/>[Container: Go]"]
  maps["<b>Maps service</b><br/>[External Software System]"]

  gateway -- "Forwards trip requests<br/>[HTTPS / JSON]" --> controller
  controller -- "Passes a state change command<br/>[in-process call]" --> lifecycle
  lifecycle -- "Asks whether a fee applies<br/>[in-process call]" --> cancel
  lifecycle -- "Requests the trip price<br/>[in-process call]" --> pricing
  lifecycle -- "Saves trip state<br/>[in-process call]" --> repo
  lifecycle -- "Publishes a status change event<br/>[in-process call]" --> publisher
  lifecycle -- "Asks to find a driver<br/>[in-process call]" --> matchingClient
  pricing -- "Requests distance and duration<br/>[in-process call]" --> mapsClient

  repo -- "Reads and writes data<br/>[SQL / TCP]" --> db
  publisher -- "Sends events<br/>[Kafka protocol]" --> kafka
  matchingClient -- "Calls driver search<br/>[gRPC]" --> matching
  mapsClient -- "Requests a route<br/>[HTTPS / REST]" --> maps

  classDef component fill:#85bbf0,stroke:#5d82a8,color:#0b2540
  classDef container fill:#1168bd,stroke:#0b4884,color:#ffffff
  classDef external fill:#8a8a8a,stroke:#6b6b6b,color:#ffffff
  class controller,lifecycle,pricing,cancel,repo,publisher,matchingClient,mapsClient component
  class gateway,db,kafka,matching container
  class maps external
  style orders fill:none,stroke:#0b4884,stroke-dasharray:6 4
```

## Components

| Component | Role |
|---|---|
| Order controller | Accepts HTTP requests from the gateway, validates input, passes the command on. Contains no business logic — it only turns a request into a call |
| Trip lifecycle manager | The heart of the service. Implements the trip state machine and prevents impossible transitions. Coordinates the other components |
| Price calculator | Pure calculation: tariff, distance, time, waiting, surge multiplier. Kept separate because pricing rules change most often |
| Cancellation handler | Decides whether to charge a fee based on timing and whether the driver has already set off |
| Trip repository | The only place that knows about the database. Everything else works with domain objects and never sees SQL |
| Event publisher | Adapter to the broker: turns a business event into a Kafka message |
| Matching service client | Adapter to the driver matching service over gRPC |
| Maps service client | Adapter to the external maps API over HTTP |

## Layers

The components fall into three layers, which is visible from their position on the diagram:

1. **Entry point** — the controller.
2. **Pure logic** that knows nothing about the outside world — the lifecycle manager, price calculator, cancellation handler.
3. **Adapters** to everything external — the repository, event publisher, clients.

Dependencies only point downwards. The logic does not depend on the database or protocols; the adapters adapt to the logic instead. This is hexagonal architecture (ports and adapters), see [ADR-0011](adr/0011-hexagonal-architecture-order-service.md).

## Trip states

The lifecycle manager allows only these transitions:

```mermaid
stateDiagram-v2
  state "Created" as Created
  state "Searching for driver" as Searching
  state "Driver assigned" as Assigned
  state "Driver arrived" as Arrived
  state "In progress" as InProgress
  state "Completed" as Completed
  state "Cancelled" as Cancelled

  [*] --> Created
  Created --> Searching: passenger confirmed the order
  Searching --> Assigned: driver accepted the offer
  Searching --> Cancelled: passenger cancelled or no driver found
  Assigned --> Arrived: driver arrived
  Assigned --> Cancelled: cancellation, fee may apply
  Arrived --> InProgress: driver started the trip
  Arrived --> Cancelled: cancellation with fee
  InProgress --> Completed: driver completed the trip
  Completed --> [*]
  Cancelled --> [*]
```

## External service failure

If the matching service or the maps API is unavailable, the adapter returns an error, the lifecycle manager puts the trip on hold or cancels it, and the passenger is notified. Adapters are separated precisely for this kind of isolation.

Why external service clients are components rather than containers: they are code inside the same process, not a separately running program. The container is the driver matching service itself.

Previous level: [C2 — Containers](c2-containers.md).
