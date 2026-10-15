# C2 — Container diagram: Taxi ordering system (ideal)

The system is broken down into separate apps and services, each with its own technology: mobile clients, a gateway, a real-time service, four internal services and three data stores.

A **container** in C4 is not Docker — it is a separately running unit that executes code or stores data. The test is simple: if it can be stopped and restarted independently of everything else, it is a separate container. A mobile app on a phone is a container too. A library or module inside a process is not.

```mermaid
flowchart TB
  passenger["<b>Passenger</b><br/>[Person]"]
  driver["<b>Driver</b><br/>[Person]"]
  operator["<b>Support operator</b><br/>[Person]"]

  subgraph boundary["Taxi ordering system [Software System]"]
    direction TB
    passengerApp["<b>Passenger app</b><br/>[Container: Flutter]<br/><br/>Ride ordering, map, payment, rating"]
    driverApp["<b>Driver app</b><br/>[Container: Flutter]<br/><br/>Accepting orders, navigation, earnings"]
    adminApp["<b>Admin panel</b><br/>[Container: React]<br/><br/>Driver moderation, tariffs, analytics"]

    gateway["<b>API Gateway</b><br/>[Container: Node.js]<br/><br/>Single entry point: authentication,<br/>authorization, request routing"]
    realtime["<b>Real-time service</b><br/>[Container: Node.js, WebSocket]<br/><br/>Streams the car position to the passenger map"]

    orders["<b>Order service</b><br/>[Container: Node.js]<br/><br/>Trip lifecycle<br/>and price calculation"]
    matching["<b>Driver matching service</b><br/>[Container: Go]<br/><br/>Finds the nearest available car"]
    payment["<b>Payment service</b><br/>[Container: Node.js]<br/><br/>Charges, receipts, refunds"]
    notify["<b>Notification service</b><br/>[Container: Node.js]<br/><br/>Push notifications<br/>and verification codes"]

    db[("<b>Main database</b><br/>[Container: PostgreSQL]<br/><br/>Users, trips, tariffs")]
    redis[("<b>Cache and geo index</b><br/>[Container: Redis]<br/><br/>Positions of available drivers")]
    kafka[("<b>Message broker</b><br/>[Container: Kafka]<br/><br/>Events between services")]
  end

  maps["<b>Maps service</b><br/>[External Software System]"]
  smsPush["<b>Push and SMS providers</b><br/>[External Software System]"]
  gatewayPay["<b>Payment gateway</b><br/>[External Software System]"]

  passenger -- "Orders a ride<br/>[HTTPS / JSON]" --> passengerApp
  driver -- "Accepts orders<br/>[HTTPS / JSON]" --> driverApp
  operator -- "Manages the system<br/>[HTTPS / JSON]" --> adminApp

  passengerApp -- "Makes API calls<br/>[HTTPS / JSON]" --> gateway
  driverApp -- "Makes API calls<br/>[HTTPS / JSON]" --> gateway
  adminApp -- "Makes API calls<br/>[HTTPS / JSON]" --> gateway
  driverApp -- "Sends location<br/>[WebSocket]" --> realtime
  realtime -- "Streams car position<br/>[WebSocket]" --> passengerApp

  gateway -- "Creates and manages trips<br/>[gRPC]" --> orders
  gateway -- "Sends login codes<br/>[gRPC]" --> notify
  orders -- "Requests a driver<br/>[gRPC]" --> matching
  orders -- "Initiates payment<br/>[gRPC]" --> payment

  orders -- "Reads and writes data<br/>[SQL / TCP]" --> db
  orders -- "Publishes trip events<br/>[Kafka protocol]" --> kafka
  matching -- "Finds nearest drivers<br/>[Redis protocol]" --> redis
  realtime -- "Updates driver positions<br/>[Redis protocol]" --> redis
  notify -- "Consumes events<br/>[Kafka protocol]" --> kafka
  payment -- "Consumes events<br/>[Kafka protocol]" --> kafka

  orders -- "Requests a route<br/>[HTTPS / REST]" --> maps
  notify -- "Sends notifications and codes<br/>[HTTPS / REST]" --> smsPush
  payment -- "Charges cards<br/>[HTTPS / REST]" --> gatewayPay

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
  class passengerApp,driverApp,adminApp,gateway,realtime,orders,matching,payment,notify,lContainer container
  class db,redis,kafka,lStore store
  class maps,smsPush,gatewayPay,lExternal external
  class lBoundary note
  style boundary fill:none,stroke:#0b4884,stroke-dasharray:6 4
  style legend fill:#fafafa,stroke:#bbbbbb
```

## What is on the diagram

**Client row.** Three apps for three roles: passenger and driver apps in Flutter, admin panel in React. They are separate because the scenarios are fundamentally different: the driver needs background location tracking and offline work, the passenger does not. See [ADR-0003](../adr/0003-flutter-and-react-clients.md).

**API Gateway.** The single entry point for all three clients. It takes over what would otherwise be duplicated in every service: token validation, access rights, rate limiting, routing. See [ADR-0004](../adr/0004-api-gateway-single-entry-point.md).

**Real-time service.** Kept separate from the gateway. Regular requests live for a fraction of a second, while a WebSocket connection stays open for hours during a trip. They also scale differently: the gateway by request count, the real-time service by the number of open connections.

**Four internal services.** Split by area of responsibility, not by database entities. The order service runs a trip from creation to completion. The matching service finds the nearest available car and is written in Go because it is the hottest path under load. The payment service is isolated because it handles payment data and has separate security requirements. The notification service keeps all delivery channels in one place.

**Three data stores.** PostgreSQL is the source of truth: users, trips, tariffs, payments. Redis holds the positions of available drivers, which change every few seconds — writing them to a relational database makes no sense, and the Redis geo index finds the nearest drivers in milliseconds. Kafka carries asynchronous events between services.

## Containers

| Container | Technology | Responsibility | Scales by | Requirements |
|---|---|---|---|---|
| Passenger app | Flutter | Ordering, map, payment, rating | — | FR-1 … FR-19 |
| Driver app | Flutter | Accepting orders, navigation, earnings | — | FR-20 … FR-28 |
| Admin panel | React | Moderation, tariffs, analytics | — | FR-29 … FR-34 |
| API Gateway | Node.js | Authentication, authorization, rate limiting, routing | Request count | NFR-3, NFR-11, NFR-13, NFR-14 |
| Real-time service | Node.js, WebSocket | Live car position and trip status | Open connections | FR-10, NFR-2 |
| Order service | Node.js | Trip lifecycle, pricing, cancellations | Number of trips | FR-5, FR-9, FR-24, FR-37 |
| Driver matching service | Go | Finding the nearest available car | Number of searches | FR-22, FR-35, NFR-1 |
| Payment service | Node.js | Charges, receipts, refunds | Number of payments | FR-15, FR-18, FR-32, NFR-12 |
| Notification service | Node.js | Push notifications, verification codes | Number of events | FR-1, FR-14 |
| Main database | PostgreSQL | Users, trips, tariffs, payments | Read replicas | NFR-10 |
| Cache and geo index | Redis | Positions of available drivers | Cluster | NFR-1 |
| Message broker | Kafka | Events between services | Partitions | NFR-8 |

Previous level: [C1 — System Context](c1-system-context.md). Next level: [C3 — Components](c3-order-service.md).
