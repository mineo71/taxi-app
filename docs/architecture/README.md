# Architecture

The architecture is described in two versions:

| Version | What it is | Folder |
|---|---|---|
| **Starting** | What we launch the MVP with: a modular monolith in TypeScript, PostgreSQL and Redis. Fits the budget, timeline and team constraints | [starting/](starting/README.md) |
| **Ideal** | The target state for high load and several teams: separate services, Go, Kafka, gRPC, a dedicated gateway | [ideal/](ideal/README.md) |

Both implement the same [requirements](../requirements/functional.md). The starting architecture is built so that its modules can be extracted into the ideal services one by one ([path to the ideal architecture](starting/README.md#path-to-the-ideal-architecture)).

## Comparison

| | Starting | Ideal |
|---|---|---|
| Containers | 7 | 12 |
| Server-side deployables | 2: backend API, background worker | 6: gateway, real-time, order, matching, payment, notification |
| Languages | Dart, TypeScript, SQL | Dart, TypeScript, Go, SQL, Protobuf |
| Data stores | PostgreSQL, Redis | PostgreSQL, Redis, Kafka |
| Communication inside the backend | In-process calls, Redis job queue | gRPC, Kafka events |
| Infrastructure cost | ≈ $380–840 per month | Several times higher: Kafka cluster, more instances |
| Suited for | MVP, one city, ≈ 10–50 orders per minute | Many cities, hundreds of orders per minute, several teams |

## C4 model

Both versions are described with the **C4 model**: four levels of detail, from the outside view down to the internal structure. Each level zooms into **one** element of the previous level, like zooming in on a map. Each level serves its own audience, so one detailed diagram cannot replace four different ones.

| Level | What it shows | Audience | Starting | Ideal |
|---|---|---|---|---|
| C1 — System Context | The system as a single box, its users and external services. No technologies | Client, business | [C1](starting/c1-system-context.md) | [C1](ideal/c1-system-context.md) |
| C2 — Containers | Separately running apps, services and data stores, each with its technology | Architect, whole team | [C2](starting/c2-containers.md) | [C2](ideal/c2-containers.md) |
| C3 — Components | Internals of the container with the core business logic | Developers | [C3: backend API](starting/c3-backend-api.md) | [C3: order service](ideal/c3-order-service.md) |
| C4 — Code | Classes and methods of a component | — | Not drawn: code changes daily and the diagram would go stale faster than it could be updated | |

## Diagrams

- Markdown diagrams (Mermaid) render directly on GitHub in the level files. Each diagram has its own legend.
- Editable draw.io files, three pages each (C1, C2, C3), open at [app.diagrams.net](https://app.diagrams.net) via *File → Open From → Device*:
  - [`starting/diagrams/taxi-c4-model-starting.drawio`](starting/diagrams/taxi-c4-model-starting.drawio)
  - [`ideal/diagrams/taxi-c4-model.drawio`](ideal/diagrams/taxi-c4-model.drawio)

### Notation rules

1. **Title** — diagram type, level and system name.
2. **Legend** — what every colour and shape means.
3. **Full element label** — name, type in square brackets, technology, one-sentence description.
4. **Labelled arrow** — what happens and over which protocol. The direction shows the dependency: who calls whom.
5. **No unexplained abbreviations** — the diagram must be readable on its own.

### Legend

| Colour | Meaning |
|---|---|
| Dark blue | Person |
| Blue | Our system or its container |
| Light blue | Component inside a container |
| Grey | External system |
| Cylinder | Data store |
| Dashed border | System or container boundary |

## Architecture decisions

Key decisions are recorded as ADRs: [adr/README.md](adr/README.md).
