# Services

The backend is not implemented in the prototype. This folder is reserved for it.

## Starting architecture

One TypeScript codebase, two processes ([C2 starting](../docs/architecture/starting/c2-containers.md)):

| Service | Technology | Responsibility |
|---|---|---|
| `api` | Node.js, TypeScript, NestJS, Socket.IO | REST API and WebSocket; modules: auth, admin, trips, matching, payments ([C3](../docs/architecture/starting/c3-backend-api.md)) |
| `api` in worker mode | Node.js, TypeScript, BullMQ | Background jobs: notifications, SMS codes, receipts, payment retries, clean-up |

Data stores: PostgreSQL (main database), Redis (geo index, TTL keys, job queue, pub/sub).

## Ideal architecture

When load grows, the modules are extracted into separate services ([C2 ideal](../docs/architecture/ideal/c2-containers.md)):

| Service | Technology | Extracted from | Requirements |
|---|---|---|---|
| `api-gateway` | Node.js | API layer, auth module | FR-1, NFR-11, NFR-13, NFR-14 |
| `realtime` | Node.js, WebSocket | API layer (Socket.IO gateway) | FR-10, NFR-2 |
| `order-service` | Node.js (TypeScript) | Trips module | FR-5, FR-7, FR-9, FR-24, FR-37 |
| `matching-service` | Go | Matching module | FR-22, FR-35, NFR-1 |
| `payment-service` | Node.js | Payments module | FR-15, FR-18, FR-32, NFR-12, NFR-17 |
| `notification-service` | Node.js | Background worker | FR-1, FR-14 |
