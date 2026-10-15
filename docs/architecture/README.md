# Architecture

The architecture is described with the **C4 model**: four levels of detail, from the outside view down to the internal structure. Each level zooms into **one** element of the previous level, like zooming in on a map. Each level serves its own audience, so one detailed diagram cannot replace four different ones.

| Level | What it shows | Audience | Document |
|---|---|---|---|
| C1 — System Context | The system as a single box, its users and external services. No technologies | Client, business | [c1-system-context.md](c1-system-context.md) |
| C2 — Containers | Separately running apps, services and data stores, each with its technology | Architect, whole team | [c2-containers.md](c2-containers.md) |
| C3 — Components | Internals of one container — the order service | Service developers | [c3-order-service.md](c3-order-service.md) |
| C4 — Code | Classes and methods of a component | — | Not drawn: code changes daily and the diagram would go stale faster than it could be updated |

## Diagrams

- Markdown diagrams (Mermaid) render directly on GitHub in the level files.
- Editable draw.io diagrams: [`diagrams/taxi-c4-model.drawio`](diagrams/taxi-c4-model.drawio) — three pages: C1, C2, C3. Open it at [app.diagrams.net](https://app.diagrams.net) via *File → Open From → Device*.

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
| Dashed border | System or container boundary |

## Architecture decisions

Key decisions are recorded as ADRs: [adr/README.md](adr/README.md).
