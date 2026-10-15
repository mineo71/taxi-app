# Non-functional requirements

Non-functional requirements describe **how well** the system works. Each one has a metric, a target value and measurement conditions; otherwise it cannot be verified.

## Design load

Performance and scalability targets apply to the following load (one city, Kyiv):

| Indicator | Average | Peak (×5) |
|---|---|---|
| New orders | 10 per min (≈ 14,400 per day) | 50 per min |
| Drivers online | 1,000 | 5,000 |
| Concurrent WebSocket connections (drivers + passengers on a trip) | 1,500 | 7,500 |
| API requests | 100 RPS | 500 RPS |
| Driver position updates (every 3 s) | ≈ 330 per s | ≈ 1,700 per s |

## Requirements

### Performance

| ID | Metric | Target | Conditions and measurement |
|---|---|---|---|
| NFR-1 | Matching time: from order confirmation to the offer sent to the first candidate | p95 ≤ 5 s, p50 ≤ 2 s | When at least one available driver is within 3 km. Histogram in the monitoring system |
| NFR-2 | Driver position refresh interval on the passenger map | Every 2–5 s, delivery latency p95 ≤ 1 s | On stable 4G. Compare send time in the driver app with receive time in the passenger app |
| NFR-3 | API response time at the gateway | p95 ≤ 300 ms, p99 ≤ 800 ms, 5xx errors < 0.1% | At the 500 RPS peak, excluding payment provider response time. Load test (k6) + gateway metrics |
| NFR-4 | App cold start to an interactive home screen | ≤ 3 s on Android, ≤ 2 s on iOS | Reference devices: Samsung Galaxy A14 (4 GB RAM), iPhone 11. Average of 10 launches |

### Scalability and availability

| ID | Metric | Target | Conditions and measurement |
|---|---|---|---|
| NFR-5 | Behaviour under peak load | NFR-1 and NFR-3 hold at 5× load for 30 min | Load test with the "peak" profile from the design load table |
| NFR-6 | Horizontal scaling and new city launch | New city in ≤ 2 business days by configuration only (tariffs, zones, city boundaries), no code changes. Stateless services scale by adding instances, autoscaling at CPU > 70% | Verified on staging: add a city and service instances |
| NFR-7 | Availability of ride ordering | ≥ 99.9% per month (≤ 43 min 49 s downtime). Admin panel ≥ 99.5% | Synthetic check of the ordering flow every minute from two regions |

### Reliability

| ID | Metric | Target | Conditions and measurement |
|---|---|---|---|
| NFR-8 | Lost active trips | 0 lost trips. Trip state is restored ≤ 10 s after connectivity returns | Test: force-close the app, switch Wi-Fi ↔ 4G, restart any service during a trip |
| NFR-9 | Operation on a poor connection | An order is placed in ≤ 10 s on 3G (750 kbit/s, 300 ms latency, 2% packet loss). Offline, the last trip state stays visible and driver actions are queued and sent after reconnecting. Retries with 1, 2, 4 … 30 s backoff and an idempotency key | Network emulation on staging |
| NFR-10 | Backup and recovery | RPO ≤ 15 min, RTO ≤ 1 h. Daily full backup + continuous transaction log, 30-day retention, copy in another data centre | Quarterly restore drill recording the actual RPO and RTO |

### Security

| ID | Metric | Target | Conditions and measurement |
|---|---|---|---|
| NFR-11 | Traffic protection | 100% of traffic over TLS 1.2+ (preferably 1.3), SSL Labs grade A or higher. Certificate pinning in mobile apps with a backup key | SSL Labs scan, interception attempt through a proxy |
| NFR-12 | Payment data storage | 0 full card numbers or CVVs in the system — provider tokens only. Payment service in a separate network zone | Audit of the DB schema and logs for card numbers |
| NFR-13 | Tokens and rate limits | Access token 15 min, refresh token 30 days with rotation. 100 requests per min per user, 10 code requests per hour per phone number. 5 failed code attempts — 15 min lockout | Automated security tests at the gateway |
| NFR-14 | Admin panel access | Roles: support operator, moderator, finance, administrator. Two-factor authentication for everyone. Immutable audit log kept ≥ 1 year | Review of the role permission matrix and audit log |

### Compliance and privacy

| ID | Metric | Target | Conditions and measurement |
|---|---|---|---|
| NFR-15 | Personal data protection (Law of Ukraine "On Personal Data Protection", GDPR) | Consent to data processing at sign-up. Account deletion and data export on request within ≤ 30 days | Deletion and export flows tested on a test account |
| NFR-16 | Privacy | Phone numbers masked in 100% of calls. Trip tracks kept for 90 days, then anonymised. Driver positions outside trips kept for 24 h | Review of automatic data clean-up jobs |
| NFR-17 | Fiscalisation | A fiscal receipt via a software cash register (PRRO) for 100% of payments, generated ≤ 1 min after payment | Daily reconciliation of payments and receipts |

### Usability and accessibility

| ID | Metric | Target | Conditions and measurement |
|---|---|---|---|
| NFR-18 | Number of actions to order | ≤ 3 actions from the home screen (address → class → "Order"), ≤ 2 for a saved address. ≥ 90% of usability test participants order a ride unaided in ≤ 60 s | Usability test on the prototype, at least 8 participants |
| NFR-19 | Accessibility (WCAG 2.1 AA) | Text contrast ≥ 4.5:1, large text and icons ≥ 3:1. Touch targets ≥ 44×44 pt (iOS) / 48×48 dp (Android). The UI does not break at 200% font size. All elements are announced by VoiceOver and TalkBack | Automated audit (0 critical issues) + manual screen reader check |
| NFR-20 | Dark theme | 100% of screens support dark theme, following the system setting, contrast per NFR-19 | Review of all screens in dark theme |
| NFR-21 | Localisation | Ukrainian (default) and English. 100% of strings in localisation files. A new language is added without code changes. Dates and amounts follow the locale | Automated check for strings outside localisation files |

### Compatibility

| ID | Metric | Target | Conditions and measurement |
|---|---|---|---|
| NFR-22 | Supported platforms and stability | iOS 15+, Android 8.0+ (API 26). Crash-free sessions ≥ 99.5%, ANR rate < 0.47%. App size ≤ 50 MB | Firebase Crashlytics, Google Play Console. Test matrix of 6 devices |
| NFR-23 | Driver app battery usage | ≤ 8% battery per hour online with the screen off | Measured on a Samsung Galaxy A14 over 2 h |

### Maintainability and observability

| ID | Metric | Target | Conditions and measurement |
|---|---|---|---|
| NFR-24 | Code and delivery quality | Unit test coverage of business logic (order service, pricing) ≥ 80%. E2E tests for 5 critical flows: login, order, trip, payment, cancellation. CI ≤ 15 min. Rollback of a failed release ≤ 15 min | CI and coverage reports on every pull request |
| NFR-25 | Observability | 100% of requests carry a trace ID. Logs kept 14 days hot, 90 days archived. Alert on NFR-1, NFR-3, NFR-7 violations within ≤ 5 min | "Golden signals" dashboard: latency, traffic, errors, saturation |
| NFR-26 | Staged rollout | Every new feature is behind a feature flag. Rollout 5% → 25% → 100% of users with automatic rollback if the crash rate grows by more than 0.5 pp | Phased release in the App Store, staged rollout in Google Play |

## Ukraine-specific notes

NFR-9 and NFR-10 deserve special attention: power outages and overloaded mobile networks make resilience to poor connectivity a daily requirement rather than a theoretical one.

## Link to architecture

| Requirements | Architecture decision |
|---|---|
| NFR-1, NFR-5 | [ADR-0008](../architecture/adr/0008-redis-geo-index-for-driver-positions.md) Redis geo index, [ADR-0010](../architecture/adr/0010-go-for-matching-service.md) Go for the matching service |
| NFR-2 | [ADR-0005](../architecture/adr/0005-separate-realtime-service.md) Separate real-time service |
| NFR-3, NFR-11, NFR-13 | [ADR-0004](../architecture/adr/0004-api-gateway-single-entry-point.md) API Gateway |
| NFR-8 | [ADR-0009](../architecture/adr/0009-kafka-for-async-events.md) Kafka for events |
| NFR-10 | [ADR-0007](../architecture/adr/0007-postgresql-as-source-of-truth.md) PostgreSQL as the source of truth |
| NFR-12 | [ADR-0012](../architecture/adr/0012-external-payment-provider.md) External payment provider |
| NFR-24 | [ADR-0002](../architecture/adr/0002-monorepo.md) Monorepo, [ADR-0011](../architecture/adr/0011-hexagonal-architecture-order-service.md) Hexagonal architecture |

Product metrics (conversion, cancellations, retention) are listed in the [success metrics](success-metrics.md).
