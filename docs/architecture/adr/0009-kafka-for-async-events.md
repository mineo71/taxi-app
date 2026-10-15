# ADR-0009: Kafka for asynchronous events

- **Status:** Accepted
- **Date:** 2026-10-15

## Context

When a trip is completed, several things must happen: charge the passenger, send the receipt and notifications, update the driver's balance, update statistics, award bonuses.

Without a broker, the order service would have to call everyone in turn and wait for each response. If the notification service is down, the whole request fails even though the trip is actually completed. If statistics are slow, the passenger stares at a spinner. When a sixth action is added, the order service code has to change again. The order service knows about everyone, depends on everyone and fails together with any of them.

## Decision

The order service publishes trip status events (`TripCreated`, `DriverAssigned`, `TripCompleted`, `TripCancelled`) to **Kafka**. Each interested service consumes the events at its own pace.

## Alternatives considered

- **Synchronous HTTP calls** — the coupling problems described above.
- **RabbitMQ** — good for task queues, but messages are deleted once consumed: no replay and no multiple independent consumers of the same stream without extra setup.

## Consequences

**Positive:**

- The order service does not know who reads its events. A new service (for example, analytics) subscribes to the same topic without any change to the order service.
- **Events are retained**: a service that was down for two hours reads everything it missed after it comes back ([NFR-8](../../requirements/non-functional.md)).
- **Everyone reads at their own pace**: the fast payment service does not wait for slow analytics.
- **Events can be replayed**: after a bug fix, last week's events can be processed again.

**Negative:**

- Kafka is separate infrastructure that has to be operated.
- Consistency between services is eventual; event handlers must be idempotent.
