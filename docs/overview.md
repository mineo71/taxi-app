# Project overview

## Vision

A mobile taxi ordering service that connects passengers and drivers: a passenger orders a ride in a few taps with the price known upfront, the system finds the nearest available car, and both sides follow the trip in real time.

## Goals

- Order a ride in no more than 3 actions ([NFR-18](requirements/non-functional.md)).
- Find a driver candidate within 5 seconds in 95% of cases ([NFR-1](requirements/non-functional.md)).
- Keep working on poor connections and during power outages ([NFR-8](requirements/non-functional.md), [NFR-9](requirements/non-functional.md)).
- Launch the MVP in 4–6 months within a $60,000 budget ([constraints](requirements/constraints.md)).
- Reach 10,000 completed trips per week in Kyiv 3 months after launch ([success metrics](requirements/success-metrics.md)).

## User roles

Short summary; goals, permissions and external actors are described in [actors](requirements/actors.md).

| Role | Channel | Main tasks |
|---|---|---|
| Passenger | Passenger mobile app | Orders a ride, tracks the car, pays, rates the driver |
| Driver | Driver mobile app | Goes online, accepts orders, completes trips, manages earnings |
| Support operator / administrator | Web admin panel | Moderates drivers, configures tariffs, handles tickets, monitors analytics |

## External systems

| System | Purpose |
|---|---|
| Maps service (Google Maps API) | Routes, distance, pickup ETA, address autocomplete |
| Payment gateway | Card charges and refunds |
| SMS gateway | One-time login codes |
| Push notification service (FCM / APNs) | Trip status notifications |

## MVP scope

**In scope:** sign-up and login, ride ordering with an upfront price, driver matching, cancellation, live car tracking, driver details, contacting the driver, payment, rating, trip history, support, driver dashboard, admin panel.

**Out of MVP scope** (priority *Could* in the [functional requirements](requirements/functional.md)): scheduled rides, passenger price boost, promo codes and cashback, promo campaign management, anti-fraud.

## Documents

- [Actors](requirements/actors.md)
- [Functional requirements](requirements/functional.md)
- [Unhappy paths](requirements/unhappy-paths.md)
- [Non-functional requirements](requirements/non-functional.md)
- [Constraints](requirements/constraints.md)
- [Success metrics](requirements/success-metrics.md)
- [Budget](project/budget.md)
- [Architecture (C4)](architecture/README.md)
- [Architecture decision records](architecture/adr/README.md)
- [Glossary](glossary.md)
