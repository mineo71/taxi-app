# Glossary

| Term | Meaning |
|---|---|
| Trip | One order from creation to completion or cancellation |
| Pickup | The driver arriving at the point where the passenger is waiting |
| Paid waiting | Driver waiting for the passenger beyond the free 3 minutes, charged per the tariff |
| Car class | Economy, Comfort, Business — defines the tariff and car requirements |
| Tariff | Pickup fee, per-km, per-minute and waiting rates for a car class in a city |
| Surge multiplier | Price multiplier applied when there are more orders than available drivers |
| Acceptance rate | Share of offered orders a driver accepts |
| Masked number | A temporary proxy number that lets the passenger and driver call each other without seeing real numbers |
| Online | Driver state in which they receive order offers |
| API Gateway | Single entry point for the client apps |
| Container (C4) | A separately running unit that executes code or stores data. Not to be confused with a Docker container |
| Component (C4) | A logical block of code inside one container |
| ADR | Architecture Decision Record — a record of one architecture decision |
| Architecture characteristic | A quality the architecture is optimised for, such as availability or performance. Becomes architectural only when backed by a tactic that changes the structure |
| Quality attribute scenario (QAS) | A testable description of a characteristic: source, stimulus, artifact, environment, response, response measure |
| Availability zone | An isolated data centre within a cloud region with its own power and network |
| Failover | Automatic switch from a failed primary to its standby or replica |
| Idempotency key | A unique request ID that lets the server apply a retried request only once |
| Transactional outbox | A table where an event is saved in the same transaction as the business change, then delivered by a separate process |
| Geo index | Data structure for fast nearest-point search on a map |
| Event | A message about a fact that has already happened, e.g. "trip completed" |
| p95 | 95th percentile: 95% of requests complete within this value |
| RPO | Recovery Point Objective — how much data may be lost in a failure |
| RTO | Recovery Time Objective — how quickly the system must be restored |
| PCI DSS | Security standard for handling payment card data |
| WCAG | Web Content Accessibility Guidelines |
| Feature flag | A switch that enables a feature for part of the users without a new release |
| MVP | Minimum viable product — the smallest version that can go to real users |
| North Star metric | The single metric that best reflects the value the product delivers |
| NPS | Net Promoter Score — share of promoters minus share of detractors |
| PRRO | Software cash register used in Ukraine to issue fiscal receipts |
