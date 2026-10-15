# Taxi App

A taxi ordering system: passenger app, driver app and admin panel.

The repository contains the project documentation (requirements, architecture, architecture decisions) and a clickable UI prototype.

## Structure

```
taxi-app/
├── apps/
│   ├── passenger/      passenger app prototype
│   ├── driver/         driver app prototype
│   └── admin/          admin panel prototype
├── packages/
│   └── shared/         shared tariffs, price calculation, styles
├── services/           backend services overview (C2)
└── docs/
    ├── overview.md     vision, roles, MVP scope
    ├── requirements/   actors, functional and non-functional requirements, unhappy paths, constraints, success metrics
    ├── project/        budget
    ├── architecture/   C4 model (C1–C3) and ADRs
    └── glossary.md
```

## Documentation

| Section | File |
|---|---|
| Project overview | [docs/overview.md](docs/overview.md) |
| Actors | [docs/requirements/actors.md](docs/requirements/actors.md) |
| Functional requirements | [docs/requirements/functional.md](docs/requirements/functional.md) |
| Unhappy paths | [docs/requirements/unhappy-paths.md](docs/requirements/unhappy-paths.md) |
| Non-functional requirements | [docs/requirements/non-functional.md](docs/requirements/non-functional.md) |
| Constraints | [docs/requirements/constraints.md](docs/requirements/constraints.md) |
| Success metrics | [docs/requirements/success-metrics.md](docs/requirements/success-metrics.md) |
| Budget | [docs/project/budget.md](docs/project/budget.md) |
| Architecture (C4) | [docs/architecture/README.md](docs/architecture/README.md) |
| Architecture decision records | [docs/architecture/adr/README.md](docs/architecture/adr/README.md) |
| Glossary | [docs/glossary.md](docs/glossary.md) |

All diagrams are drawn in draw.io: the editable `.drawio` sources and their PNG exports live in the `diagrams/` folders next to the documents.

## Running the prototype

The prototype has no dependencies and needs no build step. The simplest way is to open a file in the browser:

- `apps/passenger/index.html`
- `apps/driver/index.html`
- `apps/admin/index.html`

Or start a local server from the repository root:

```bash
npm start
# http://localhost:3000/apps/passenger/
```

The prototype simulates the main scenarios with mock data: there is no backend, real maps or real payments. The target implementation is described in [docs/architecture](docs/architecture/README.md).
