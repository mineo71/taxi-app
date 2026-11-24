# Architecture characteristics

Architecture characteristics (quality attributes) describe **what the architecture must be good at**, as opposed to functional requirements, which describe what the system does. They are derived from the [non-functional requirements](../requirements/non-functional.md), the [constraints](../requirements/constraints.md) and the [unhappy paths](../requirements/unhappy-paths.md).

A characteristic on its own does not change anything. "The system must be available" leaves the diagram exactly as it was. A characteristic becomes architectural only when it is backed by a **tactic** that changes the structure: two availability zones, a database standby with automatic failover, an offline queue on the phone. For every candidate below we therefore name the tactic and the exact change it causes on the diagrams.

The document follows the four steps of the analysis:

1. [Candidate characteristics](#1-candidate-characteristics) — 12 candidates and how each would change the structure.
2. [Top three and the cost of the rest](#2-top-three-and-the-cost-of-the-rest) — what we optimise for, and the consequence of every characteristic we left out.
3. [Quality attribute scenarios](#3-quality-attribute-scenarios) — one measurable scenario per chosen characteristic.
4. [What changed after the review](#4-what-changed-after-the-review) — the resulting changes to the ADRs and diagrams.

## 1. Candidate characteristics

| ID | Characteristic | Requirements |
|---|---|---|
| AC-1 | Availability | NFR-7, UP-23, UP-24 |
| AC-2 | Fault tolerance | NFR-8, NFR-9, UP-13, UP-18 … UP-20, UP-22, UP-25, UP-26 |
| AC-3 | Performance (responsiveness) | NFR-1, NFR-2, NFR-3 |
| AC-4 | Scalability and elasticity | NFR-5, NFR-6 |
| AC-5 | Data integrity | FR-15, FR-37, NFR-17, UP-20 |
| AC-6 | Security and privacy | NFR-11 … NFR-16, CON-7, CON-8 |
| AC-7 | Recoverability | NFR-10 |
| AC-8 | Observability | NFR-25 |
| AC-9 | Deployability | NFR-24, NFR-26 |
| AC-10 | Extensibility | NFR-6, *Could* requirements in [functional](../requirements/functional.md) |
| AC-11 | Interoperability with external providers | CON-5, CON-6, UP-18, UP-22, UP-25 |
| AC-12 | Portability | CON-8 |

### AC-1 Availability

**Why it matters.** If ordering is down, a passenger opens a competitor's app within a minute, and drivers lose income for every minute of downtime. Target: ordering ≥ 99.9% per month, i.e. at most 43 min of downtime (NFR-7).

**Tactic that changes the structure.** Two availability zones in one region. Every server-side process runs in two instances, one per zone, behind a managed load balancer with health checks. PostgreSQL runs as primary + synchronous standby in the other zone with automatic failover; Redis as primary + replica with automatic failover. A synthetic check places a test order every minute from two regions.

**What changes on the diagrams.** A deployment diagram appears with two zone boxes, a load balancer as the only entry, ×2 instance counts and replication arrows between primaries and standbys. The background worker goes from one instance to two, because a single worker is a single point of failure for payments and notifications.

### AC-2 Fault tolerance

**Why it matters.** Power outages, base stations on battery, drivers in underground parking: in Ukraine, poor connectivity is a daily condition, not an edge case (see [Ukraine-specific notes](../requirements/non-functional.md#ukraine-specific-notes)). The system must not lose a trip, a status change or a payment when a phone, an instance or an external provider fails (NFR-8, NFR-9).

**Tactic that changes the structure.**

- An **offline action queue** in the driver app (local SQLite): actions taken without a network are stored and replayed after reconnection.
- **Idempotency keys** on every command, stored on the server, so a retried request is applied exactly once.
- A **transactional outbox**: the business change and the job it triggers (charge the card, send a push, issue a receipt) are written in one PostgreSQL transaction; the worker relays them to the job queue. Without it, a crash between "trip completed" and "enqueue charge" silently loses the charge.
- **Retries with backoff, timeouts and circuit breakers** for external providers, each with a fallback: cached or straight-line route (UP-22), cash payment (UP-18), Google / Apple sign-in instead of SMS (UP-25).

**What changes on the diagrams.** C2: the driver app keeps an offline queue; the database stores the outbox and idempotency keys; the worker reads the outbox. C3: the API layer checks idempotency keys; the trips module no longer enqueues jobs into Redis directly, it writes them to the outbox in the same transaction as the trip state.

### AC-3 Performance (responsiveness)

**Why it matters.** This is the product's core promise: a driver is found within seconds and the car visibly moves on the map. Targets: offer to the first candidate p95 ≤ 5 s (NFR-1), position delivery p95 ≤ 1 s (NFR-2), API p95 ≤ 300 ms (NFR-3).

**Tactic that changes the structure.**

- Driver positions (≈ 330 per second on average, ≈ 1,700 at peak) go only to the in-memory **Redis geo index**, never to PostgreSQL on the hot path. Nearest-driver search is `GEOSEARCH` in Redis.
- The passenger app receives positions and statuses as **pushes over WebSocket**, not by polling. Between the two backend instances, events go through Redis pub/sub.
- Repeated routes are **cached** in Redis; trip track points are written to PostgreSQL in batches by the worker.

**What changes on the diagrams.** C3 gets a separate **location module**: positions flow from the API layer to the location module and on to Redis, with no arrow to the data access component. C2: Redis is labelled as geo index, live position channel and route cache.

### AC-4 Scalability and elasticity

**Why it matters.** Demand jumps up to 5× in rush hour, in rain, at the end of curfew and when a long air-raid alert ends (NFR-5). New cities must be launched by configuration (NFR-6).

**Tactic that changes the structure.** Stateless backend instances behind an autoscaling group; WebSocket fan-out through Redis pub/sub so any instance can serve any client; queues absorb bursts of background work. At higher scale, partitioning by city and separate services that scale on their own axis (connections, searches, payments).

**What changes on the diagrams.** "N instances" with an autoscaling rule on the deployment diagram; at the next level, the ideal C2 with separate real-time and matching services.

### AC-5 Data integrity

**Why it matters.** A trip must not be charged twice or end up in two states at once. Driver earnings, payments and fiscal receipts must match (FR-15, NFR-17).

**Tactic that changes the structure.** PostgreSQL as the single source of truth with ACID transactions; the trip state machine with optimistic locking (a version column); each module owns its tables; payment requests carry an idempotency key equal to the trip ID; provider webhooks are deduplicated by payment ID (UP-20); daily reconciliation with the provider and the fiscal register. A stronger version would be an immutable double-entry ledger for money.

**What changes on the diagrams.** One database, written only through the data access component (C3); module ownership boundaries; with a ledger, a separate ledger store.

### AC-6 Security and privacy

**Why it matters.** The system holds phone numbers, home addresses and trip tracks, connects to a payment provider and gives administrators the power to issue refunds (NFR-11 … NFR-16). Data must stay in Ukraine or the EU (CON-8).

**Tactic that changes the structure.** Card data stays with the provider (tokens only); the payment component in a **separate network zone** with its own secrets; a web application firewall in front of the load balancer; databases in private subnets; a secrets manager; the admin panel behind SSO with two-factor authentication; an append-only audit log; masked phone numbers.

**What changes on the diagrams.** Network zones (public, private, payment) on the deployment diagram, a firewall box, a separate payment service container, an audit log store.

### AC-7 Recoverability

**Why it matters.** Losing trip and payment history is both a financial and a legal problem. Target: RPO ≤ 15 min, RTO ≤ 1 h (NFR-10).

**Tactic that changes the structure.** Point-in-time recovery from a continuous transaction log plus daily snapshots copied to a second region. The full version is a warm standby environment in the second region with a cross-region replica and DNS failover.

**What changes on the diagrams.** Backup storage in a second region (cheap version) or a second copy of the whole deployment diagram (full version).

### AC-8 Observability

**Why it matters.** A 99.9% availability target and p95 latencies cannot be met if they are not measured. A small team has to find the cause of a night-time incident quickly (NFR-25).

**Tactic that changes the structure.** OpenTelemetry in the backend and the worker, a trace ID that follows a request through the API, the outbox and the job queue; a central store for logs, metrics and traces; alerts to an on-call engineer.

**What changes on the diagrams.** A telemetry collector and an external monitoring system with an arrow from every container.

### AC-9 Deployability

**Why it matters.** A bug found during the Friday evening peak must be fixed or rolled back within 15 min; new features roll out gradually (NFR-24, NFR-26).

**Tactic that changes the structure.** A CI/CD pipeline, rolling or blue-green deployment of backend instances, backward-compatible database migrations (expand, then contract), a feature flag service, phased releases in the app stores.

**What changes on the diagrams.** A feature flag service on C2; blue and green instance groups on the deployment diagram; at the next level, independently deployable services.

### AC-10 Extensibility

**Why it matters.** After the MVP come new cities, scheduled rides, promo codes and other *Could* requirements, and eventually the extraction of services described in the [path to the ideal architecture](starting/README.md#path-to-the-ideal-architecture).

**Tactic that changes the structure.** A modular monolith whose module boundaries match the future services; cities, tariffs and zones as data rather than code; ports and adapters inside modules; module dependency rules enforced by a linter in CI.

**What changes on the diagrams.** Module boundaries on C3 that map one-to-one to the services on the ideal C2.

### AC-11 Interoperability with external providers

**Why it matters.** The system cannot work without four providers: maps, payments, SMS and push (plus the fiscal register). Each of them can fail, change its API or raise its prices.

**Tactic that changes the structure.** An adapter per provider behind a provider-neutral interface; for critical channels, a second provider with automatic switching (for example, a second SMS gateway).

**What changes on the diagrams.** Adapters as components on C3; a second provider for a channel as an extra external system on C1 and C2.

### AC-12 Portability

**Why it matters.** Data must stay in Ukraine or the EU (CON-8). Cloud prices, sanctions or a requirement to host in a Ukrainian data centre may force a move.

**Tactic that changes the structure.** Only managed services with open protocols (PostgreSQL, Redis), Docker images, infrastructure as code with provider-neutral modules, no proprietary serverless functions or queues.

**What changes on the diagrams.** Almost nothing on C2, which names technologies rather than vendors. That is exactly why it is easy to lose portability without noticing.

### Not on the list

Usability, accessibility, dark theme and localisation (NFR-18 … NFR-21) matter a lot for the product, but they are qualities of the client UI: none of them adds, removes or moves a box on the architecture diagrams. They are verified in the apps, not designed into the architecture.

## 2. Top three and the cost of the rest

### Chosen

| # | Characteristic | Why it is in the top three |
|---|---|---|
| 1 | **AC-1 Availability** | If the service is down, passengers switch to a competitor immediately; a taxi service has no "come back later". |
| 2 | **AC-2 Fault tolerance** | Poor connectivity and power outages are everyday conditions in Ukraine. A lost trip or a lost charge destroys trust and money faster than downtime. |
| 3 | **AC-3 Performance** | Matching speed and the live car on the map are what the passenger actually experiences. If the search takes too long, passengers cancel (see the cancellation targets in the [success metrics](../requirements/success-metrics.md)). |

All three answer one question: *what makes a passenger leave the app right now?* They are also the ones where the starting architecture has to make specific structural decisions ([ADR-0005](adr/0005-two-availability-zones-with-failover.md), [ADR-0006](adr/0006-idempotent-actions-offline-queue-and-outbox.md), [ADR-0007](adr/0007-driver-positions-in-redis-only.md)). The rest are covered by a baseline that managed services give us cheaply, or are deliberately postponed.

### Left out and the consequence

A characteristic that is left out is not ignored: it gets a baseline, and we accept a specific consequence.

| Characteristic | What we do anyway (baseline) | Consequence we accept |
|---|---|---|
| **AC-4 Scalability and elasticity** | Capacity is sized for the 5× peak; the stateless backend can scale out on CPU. PostgreSQL and Redis have a single primary each and scale only vertically | Growing beyond ≈ 500 orders per minute or adding a second large city is an **extraction project** (separate matching and real-time services, see the [path to the ideal architecture](starting/README.md#path-to-the-ideal-architecture)), not "add two more instances". A sudden spike above 5× — for example, when a long night-time air-raid alert ends — slows matching down instead of being absorbed |
| **AC-5 Data integrity** | PostgreSQL transactions, the trip state machine, idempotent payments (they come for free with AC-2) | There is **no immutable money ledger**. Driver balances and commissions are calculated from payment rows; if a bug corrupts them, the history cannot be replayed, and finance reconciles manually against the provider's reports |
| **AC-6 Security and privacy** | TLS, short-lived tokens, rate limits, provider tokens instead of card numbers, two-factor authentication in the admin panel, databases in a private network | The payments module runs **in the same process** as every other module. A remote code execution bug in any module exposes the payment provider's API keys, which allow refunds. The "separate network zone" from NFR-12 exists only in the ideal architecture. A security review and penetration test become a separate project before scaling to more cities |
| **AC-7 Recoverability** | Point-in-time recovery, daily snapshots copied to a second EU region | Zone failures are covered by AC-1, but **a whole-region outage** means rebuilding the environment from infrastructure code and restoring from backup in another region: RTO is **several hours**, not 1 h. NFR-10 holds only for zone and instance failures |
| **AC-8 Observability** | Cloud provider metrics and logs, Sentry and Crashlytics, a trace ID in every log line, alerts on NFR-1, NFR-3 and NFR-7 | No distributed tracing and no 24/7 on-call rotation. Incidents are diagnosed from logs, so the time to repair is longer, and slow degradation (as opposed to an outage) is noticed only if someone looks at the dashboard. Tracing must be added **before** the first service is extracted, otherwise a request that crosses services cannot be followed |
| **AC-9 Deployability** | One pipeline, rolling deployment of two instances, feature flags as configuration in the database, rollback ≤ 15 min | Any change, even an admin report, **redeploys the whole backend**, including trips and matching. A bad release reaches 100% of backend traffic until it is rolled back, so releases are batched and scheduled outside peak hours |
| **AC-10 Extensibility** | Module boundaries that match the future services, enforced by convention and a linter | Under deadline pressure the boundaries erode, and every later extraction turns into refactoring first. There is no public API for partners (corporate clients, hotels): each such integration is new work |
| **AC-11 Interoperability** | One provider per channel with a thin adapter: Google Maps (CON-5), one payment provider (CON-6), one SMS gateway, FCM | A provider outage means **degraded mode** (cash only, Google / Apple sign-in only). Switching a provider means a new adapter, a new contract and regression testing — weeks, not days. A Google Maps price increase hits the infrastructure cost per trip directly |
| **AC-12 Portability** | Open protocols (PostgreSQL, Redis), Docker images | We use the cloud provider's managed PostgreSQL, Redis, load balancer, object storage and monitoring. **Moving to another cloud or to a Ukrainian data centre is a project** — rewriting infrastructure code, migrating the database with a downtime window or replication, re-testing failover — not a sprint. The Google Maps SDK in both Flutter apps means that replacing the maps provider also requires app releases |

## 3. Quality attribute scenarios

Each scenario uses the six-part format: **source** → **stimulus** → **artifact** → **environment** → **response** → **response measure**. The response measure is what makes the characteristic testable.

### QAS-1 Availability: loss of an availability zone

| Part | Value |
|---|---|
| Source | Cloud infrastructure |
| Stimulus | Availability zone A fails completely: backend API instance 1, worker instance 1, the PostgreSQL primary and the Redis primary become unreachable |
| Artifact | Backend API, background worker, main database, Redis |
| Environment | Normal operation during the evening peak: 50 orders per minute, ≈ 1,000 active trips |
| Response | The load balancer marks instance 1 unhealthy and sends all traffic to instance 2. Managed PostgreSQL promotes the standby in zone B; the Redis replica is promoted. Worker 2 continues processing jobs. The apps reconnect with backoff and resend unconfirmed requests with the same idempotency key |
| Response measure | Ordering works again within **≤ 3 min**. **0** lost or duplicated orders and trips. **0** committed transactions lost (synchronous replication, RPO = 0). Monthly availability stays **≥ 99.9%**: one such failure uses at most 3 of the 43 allowed minutes |
| How we verify | Quarterly failure drill on staging: stop the zone A instances and trigger a database failover while a load test is running; the synthetic check measures the actual downtime |

### QAS-2 Fault tolerance: driver offline during a trip

| Part | Value |
|---|---|
| Source | Mobile network (a district with a power outage, base stations on battery) |
| Stimulus | The driver app loses the connection for 3 min during an active trip. While offline, the driver taps "Passenger on board" and later "Complete trip" |
| Artifact | Driver app (offline action queue), API layer (idempotency check), trips module, outbox, background worker |
| Environment | Degraded network after reconnection: 3G, 750 kbit/s, 300 ms latency, 2% packet loss |
| Response | The app stores each action locally with its time, GPS point and idempotency key and shows it as "pending". The passenger app shows "Connection with the driver is lost". After reconnection the actions are sent in order with retries (1, 2, 4 … 30 s). The server applies each action exactly once, calculates the price from the recorded times and track, and writes "trip completed" together with the charge job in one transaction (outbox); the worker charges the card |
| Response measure | **0** lost and **0** duplicated status changes. Both apps show the same trip state **≤ 10 s** after connectivity returns. The card is charged **exactly once**. **≤ 1%** of such trips need manual correction by support |
| How we verify | Network emulation on staging (airplane mode, packet loss); every request is replayed three times and must produce exactly one state change and one charge |

### QAS-3 Performance: driver matching at peak load

| Part | Value |
|---|---|
| Source | Passenger |
| Stimulus | Confirms an order |
| Artifact | API layer, trips module, matching module, Redis geo index, WebSocket gateway |
| Environment | Peak load: 50 orders per minute, 5,000 drivers online sending a position every 3 s (≈ 1,700 updates per second); at least one available driver within 3 km |
| Response | The trips module creates the trip. The matching module runs `GEOSEARCH` within 3 km in Redis, ranks the candidates and sends the offer to the first one over WebSocket (push notification if the socket is closed), starting the 15 s timer |
| Response measure | Offer delivered to the first candidate: **p95 ≤ 5 s, p50 ≤ 2 s**. Geo search p95 **≤ 50 ms**. API p95 stays **≤ 300 ms** during the test. No position update is written to PostgreSQL on the request path |
| How we verify | k6 load test with the peak profile and simulated drivers for 30 min (NFR-5); latency histograms in monitoring |

## 4. What changed after the review

After choosing the top three, the ADRs and diagrams were reviewed again. The starting architecture changed; the ideal architecture did not.

### In one paragraph

Before, the starting architecture said *what* runs (a modular monolith, PostgreSQL, Redis) but not *how it survives failures*. Availability added a deployment diagram with two zones, failover and a second worker. Fault tolerance added an offline queue in the driver app, idempotency keys and a transactional outbox, which removed a hidden dual write from the trips module. Performance moved driver positions into their own module that writes only to Redis. Three new ADRs record these decisions; the four existing ADRs are still valid.

### Diagrams

| # | Change | Diagram | Driven by | Why |
|---|---|---|---|---|
| D1 | **New deployment diagram**: one EU region, two availability zones, managed load balancer, backend and worker × 2, PostgreSQL primary + synchronous standby, Redis primary + replica, backups in a second region, synthetic monitoring | [Starting: deployment](starting/deployment.md) | AC-1 | "99.9%" is invisible on C2. Zones, failover and replication only show up on a deployment diagram. It replaces the text sketch in the starting README |
| D2 | **Background worker: 1 → 2 instances**, one per zone | Starting C2, deployment | AC-1, AC-2 | A single worker was a single point of failure for card charges, receipts and notifications |
| D3 | **Driver app keeps an offline action queue** (SQLite inside the app); backend labelled with idempotency keys; database stores the outbox and idempotency keys; worker relays the outbox | [Starting C2](starting/c2-containers.md) | AC-2 | NFR-8 and NFR-9 cannot be met by the server alone. SQLite runs inside the app process, so by the C4 definition it is part of the driver app container, not a separate container |
| D4 | **Trips module no longer enqueues jobs into Redis directly** ("Enqueues jobs" arrow removed). It saves the trip state and the outbox event in one transaction; the charge on completion goes through an outbox job; the background worker is shown relaying the outbox | [Starting C3](starting/c3-backend-api.md) | AC-2 | The old arrow was a dual write: a crash between the database commit and the Redis enqueue lost the card charge |
| D5 | **API layer checks idempotency keys**; payments module charges with the trip ID as the idempotency key | Starting C3 | AC-2, AC-5 | A retried request after a reconnect must not complete a trip or charge a card twice |
| D6 | **New location module**: positions go from the API layer to the location module and on to Redis only; the matching module receives offer answers, not positions | Starting C3 | AC-3 | Before, positions went into the matching module and it was unclear where they were stored. Now it is explicit that the hot path never touches PostgreSQL |
| D7 | **Maps client** labelled with route cache and straight-line fallback; Redis labelled with route cache and live position channel | Starting C2, C3 | AC-2, AC-3 | UP-22 and NFR-3 depend on the cache |
| — | Ideal C1–C3 and requirements diagrams: **no change** | — | — | The ideal architecture already separates real-time, matching and payment services and uses Kafka as a durable event log. When the trips module is extracted, the outbox moves with it and feeds Kafka instead of Redis (noted in ADR-0006) |

### ADRs

| ADR | Status after review | What changed |
|---|---|---|
| [0001](adr/0001-record-architecture-decisions.md) Record decisions as ADRs | Unchanged | — |
| [0002](adr/0002-monorepo.md) Monorepo | Unchanged | Still valid: one backend codebase, three clients and shared packages. Its context lists the ideal services; the decision does not depend on them |
| [0003](adr/0003-flutter-and-react-clients.md) Flutter and React | Unchanged | Still valid. The new requirement for an offline-first driver app (local database, ordered replay) is recorded as a consequence in ADR-0006 |
| [0004](adr/0004-api-gateway-single-entry-point.md) API Gateway as the single entry point | Unchanged, clarified by ADR-0005 | The principle — one address for all clients — holds. In the starting architecture the entry point is the managed load balancer plus gateway middleware in the backend. Its negative consequence ("needs several instances behind a load balancer") is now implemented concretely in ADR-0005 |
| [0005](adr/0005-two-availability-zones-with-failover.md) Two availability zones with automatic failover | **New** | AC-1 |
| [0006](adr/0006-idempotent-actions-offline-queue-and-outbox.md) Idempotent actions, offline queue and transactional outbox | **New** | AC-2 |
| [0007](adr/0007-driver-positions-in-redis-only.md) Driver positions only in Redis, pushed over WebSocket | **New** | AC-3 |

### Other documents

- [Starting architecture](starting/README.md): deployment section now links to the deployment diagram; cost estimate updated for the second worker (+ $40–70 per month); trade-offs list the accepted gaps.
- [Starting C2](starting/c2-containers.md) and [C3](starting/c3-backend-api.md): tables updated to match the diagrams.
- [Non-functional requirements](../requirements/non-functional.md): the link-to-architecture table includes the new ADRs.

### Known gaps we accept

These follow from section 2 and are worth stating openly when the architecture is presented:

| Requirement | Gap | Covered by |
|---|---|---|
| NFR-10 RTO ≤ 1 h | Holds for zone failures, not for the loss of a whole region | AC-7 left out |
| NFR-12 separate network zone for payments | Only in the ideal architecture | AC-6 left out |
| NFR-25 tracing | Trace ID in logs, no distributed tracing until services are extracted | AC-8 left out |
