# ADR-0004: API Gateway as the single entry point

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

Three clients talk to several internal services. Every request needs the same things: token validation, access control, rate limiting, logging ([NFR-11](../../requirements/non-functional.md), [NFR-13](../../requirements/non-functional.md), [NFR-14](../../requirements/non-functional.md)).

A mobile app update takes weeks to reach all users. If service addresses were hard-coded in the app, any architecture change would break older versions.

## Decision

All clients reach the system only through the **API Gateway** (Node.js). The gateway handles authentication, authorization, rate limiting and routing to internal services. Only the gateway is exposed to the internet; internal services run in a private network.

## Alternatives considered

- **Clients call services directly** — clients know the internal structure, checks are duplicated in every service, the attack surface grows.
- **Backend for Frontend per client** — excessive for the MVP; can be split out of the gateway later.

## Consequences

**Positive:**

- Clients do not know the internal structure: there are four services behind the gateway today and may be eight tomorrow, while the app on the phone stays the same.
- Shared checks are implemented in one place.
- One point of defence against external attacks.
- The gateway can aggregate data from several services into one response, saving battery and traffic.

**Negative:**

- The gateway is a critical component: it needs several instances behind a load balancer ([NFR-7](../../requirements/non-functional.md)).
- The extra network hop adds latency; this is accounted for in the 300 ms budget ([NFR-3](../../requirements/non-functional.md)).
