# Services

The backend is not implemented in the prototype. Below is the target set of services according to the [C2 container diagram](../docs/architecture/c2-containers.md).

| Service | Technology | Responsibility | Requirements |
|---|---|---|---|
| `api-gateway` | Node.js | Single entry point: authentication, authorization, rate limiting, routing | FR-1, NFR-11, NFR-13, NFR-14 |
| `realtime` | Node.js, WebSocket | Streams the car position to the passenger map, live trip statuses | FR-10, NFR-2 |
| `order-service` | Node.js (TypeScript) | Trip lifecycle, price calculation, cancellations | FR-5, FR-7, FR-9, FR-24, FR-37 |
| `matching-service` | Go | Finds the nearest available car, dispatches orders | FR-22, FR-35, NFR-1 |
| `payment-service` | Node.js | Charges, receipts, refunds | FR-15, FR-18, FR-32, NFR-12, NFR-17 |
| `notification-service` | Node.js | Push notifications, verification codes | FR-1, FR-14 |

Data stores: PostgreSQL (main database), Redis (geo index of available drivers), Kafka (events between services).

The internals of `order-service` are shown on the [C3 component diagram](../docs/architecture/c3-order-service.md).
