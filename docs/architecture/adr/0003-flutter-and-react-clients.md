# ADR-0003: Flutter for mobile apps, React for the admin panel

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

Three clients are needed: a passenger app, a driver app (both iOS and Android) and a web admin panel. The MVP budget is limited ([CON-1](../../requirements/constraints.md)) and the team has Flutter experience ([CON-4](../../requirements/constraints.md)). The apps must support iOS 15+ and Android 8+ and run reliably on budget devices ([NFR-22](../../requirements/non-functional.md)).

Passenger and driver scenarios are fundamentally different: the driver needs background location tracking, offline work and navigation; the passenger does not.

## Decision

- The passenger app and the driver app are **two separate Flutter apps**.
- The admin panel is a **React** web app.

## Alternatives considered

- **Native development (Swift + Kotlin)** — doubles the cost of mobile development, does not fit the budget.
- **React Native** — a viable option, but the team has no experience with it, which increases schedule risk.
- **One mobile app with role switching** — different permissions (background location), different flows and different App Store rules for driver apps make a single app harder to build.
- **Admin panel in Flutter Web** — the React ecosystem is more mature for tables, filters and dashboards.

## Consequences

**Positive:**

- One codebase for iOS and Android per app.
- Shared Flutter packages (UI components, API client) between the passenger and driver apps.

**Negative:**

- Two client technologies (Dart and TypeScript).
- Background location and navigation require native plugins.
