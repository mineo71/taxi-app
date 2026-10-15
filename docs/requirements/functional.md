# Functional requirements

Functional requirements describe **what** the system does. They are grouped by user role. Each requirement has concrete parameters and acceptance criteria used to verify it in demos and tests.

Priority follows MoSCoW: **Must** — the MVP cannot launch without it, **Should** — important, but launch is possible without it, **Could** — nice to have, moved to later releases.

## Passenger

| ID | Requirement | Parameters and acceptance criteria | Priority |
|---|---|---|---|
| FR-1 | Sign-up and login by phone number with a one-time code, or via Google / Apple ID | Code: 6 digits, valid for 5 min. Resend allowed after 60 s. After 5 failed attempts login is blocked for 15 min. Session lasts 30 days without re-login | Must |
| FR-2 | Profile: name, photo, saved addresses, payment methods | Up to 10 saved addresses ("Home", "Work" + custom). Up to 5 linked cards. Photo: JPG or PNG up to 5 MB | Should |
| FR-3 | Location detection via GPS and manual pickup point selection on the map | Pickup point is set automatically if GPS accuracy is ≤ 50 m; otherwise the app asks to adjust the point on the map. The pin can be dragged manually | Must |
| FR-4 | Destination input with autocomplete and intermediate stops | Suggestions appear after 3 characters within 500 ms, up to 5 options. Up to 3 intermediate stops | Must |
| FR-5 | Car class selection with an upfront price estimate | 3 classes: Economy, Comfort, Business. Every class shows its price before ordering; price updates ≤ 1 s after the route changes. The estimate is held for 5 min | Must |
| FR-6 | Extra options: child seat, pet transport, note for the driver | Child seat +₴30, pet +₴40. Note up to 200 characters. Orders with an option are offered only to drivers with a matching profile flag | Should |
| FR-7 | Scheduled rides | From 30 min to 7 days ahead. Driver search starts 20 min before the pickup time. Reminders 60 and 10 min before | Could |
| FR-8 | Price boost for a faster driver search during peak hours | Step +10%, up to +50% of the estimate. Every boost widens the search radius | Could |
| FR-9 | Cancellation with a fee after a set time | Free before a driver is assigned and within 2 min after. After 2 min or once the driver has arrived: ₴50 fee. Free if the driver is more than 5 min late versus the promised ETA | Must |
| FR-10 | Live driver tracking on the map and pickup ETA | Position updates every 2–5 s ([NFR-2](non-functional.md)). ETA is recalculated every 30 s | Must |
| FR-11 | Driver and car details: name, photo, rating, make, colour, plate | Shown right after a driver is assigned. Rating with one decimal place | Must |
| FR-12 | Call and chat via a masked number | The masked number works until 1 h after the trip ends. Chat has quick replies ("Coming out", "I'm here", "Wait 2 min") | Should |
| FR-13 | Share the trip with contacts and an SOS button | The trip link is valid until the trip ends + 15 min. SOS dials 112 and within ≤ 10 s sends coordinates, car and driver details to the safety team | Should |
| FR-14 | Notifications about key trip events | 5 events: driver found, driver arriving in 1 min, driver arrived, trip completed, receipt issued. Delivery ≤ 5 s after the event (p95) | Must |
| FR-15 | Payment by cash, card, Apple Pay, Google Pay or corporate account | A failed card charge is retried 3 times within 24 h. While a debt exists, a new order is possible only with another payment method | Must |
| FR-16 | Promo codes, bonuses, cashback | One promo code per trip. Cashback: 3% in points, 1 point = ₴1. Points can cover up to 50% of a trip | Could |
| FR-17 | Driver rating, review and tip | 1–5 stars, available for 24 h. A rating ≤ 3 requires choosing a reason. Tip: ₴20, ₴50 or a custom amount up to ₴500 | Must |
| FR-18 | Trip history with electronic receipts | Full history, 20 trips per page. A fiscal receipt is generated ≤ 1 min after payment and sent by e-mail | Must |
| FR-19 | Support ticket about a specific trip | Available for trips from the last 30 days. Categories: payment, driver, lost items, safety. First response ≤ 15 min | Should |

## Driver

| ID | Requirement | Parameters and acceptance criteria | Priority |
|---|---|---|---|
| FR-20 | Sign-up with document verification and moderation | Documents: driving licence, vehicle registration, compulsory motor insurance, car photos from 4 sides, selfie. Moderation ≤ 24 h. Car age: Economy ≤ 15 years, Comfort ≤ 7, Business ≤ 5 | Must |
| FR-21 | "Online" and "offline" status | While online, the position is sent every 2–5 s. After 3 consecutive missed offers the status switches to "offline" automatically | Must |
| FR-22 | Order offers with a limited response time | 15 s to respond. An offer shows the pickup distance, route, price, class and payment type. An offer goes to one driver at a time | Must |
| FR-23 | Navigation to the passenger and along the route | Built-in map or open the route in Google Maps / Waze. The route is rebuilt after a deviation of more than 50 m | Must |
| FR-24 | Trip status changes: arrived, start, complete | "Arrived" is enabled only within 150 m of the pickup point. "Complete" records the actual route for price calculation | Must |
| FR-25 | Waiting time and paid waiting | 3 min of free waiting, then waiting is charged per the class tariff. After 15 min the driver can cancel and the passenger is charged a fee | Should |
| FR-26 | Balance, earnings history, commission, withdrawal | Service fee 15%. Withdrawal from ₴200, at most once a day, paid to the card within 1 business day | Must |
| FR-27 | Driver rating and passenger rating | Driver rating = average of the last 100 ratings. Below 4.5 — warning, below 4.3 — temporary suspension pending review | Should |
| FR-28 | Order filters: radius, direction, payment type | Radius 1–10 km in 1 km steps. "Towards home" filter up to 2 times a day. Payment type: cash, card, any | Should |

## Administrator and system

| ID | Requirement | Parameters and acceptance criteria | Priority |
|---|---|---|---|
| FR-29 | Driver document moderation, blocking, complaint review | Moderation queue with a ≤ 24 h review time. Blocking requires a reason. A complaint is reviewed within ≤ 48 h | Must |
| FR-30 | Tariff configuration by city, car class and time of day | Tariff components: pickup fee, per km, per minute, per waiting minute, minimum fare. Night multiplier (23:00–06:00). Changes apply only to new orders; change history is kept | Must |
| FR-31 | Monitoring of active trips and drivers on the map | The map refreshes every ≤ 10 s. Driver status by colour: available, on trip, offline. Filter by trip status | Must |
| FR-32 | Ticket handling, refunds, dispute resolution | Full or partial refund, credited within ≤ 3 business days. Every decision is logged with its author and reason | Should |
| FR-33 | Promo campaign and promo code management | Percentage or fixed discount. Total and per-user limits, validity period, cities, car classes | Could |
| FR-34 | Analytics: orders, conversion, churn, revenue, demand heatmap | The dashboard refreshes hourly. Metrics follow the [success metrics](success-metrics.md). Demand heatmap with a 500 m grid | Should |
| FR-35 | Dispatch algorithm based on distance, rating and acceptance rate | Candidates are searched within 3 km, then 5 and 8 km. Candidate score: pickup ETA — weight 0.6, rating — 0.2, acceptance rate — 0.2 | Must |
| FR-36 | Dynamic pricing based on demand and supply | Multiplier = 1 + 0.5 × (orders / available drivers − 1), from 1.0 to 2.0 in 0.1 steps. Recalculated every 2 min per city zone | Should |
| FR-37 | Final price calculation from the actual route and waiting time | Formula below. If the final price differs from the estimate by more than 20%, the passenger sees an explanation (route change, waiting) | Must |
| FR-38 | Anti-fraud: fake GPS, multi-accounting, promo code abuse | Movement faster than 200 km/h between consecutive points is flagged as fake GPS. At most 2 accounts per device. New-user promo codes: once per device and card | Could |

## Business rules

### Tariffs (initial values, Kyiv)

| Class | Pickup fee | Per km | Per min | Waiting, per min | Minimum fare |
|---|---|---|---|---|---|
| Economy | ₴45 | ₴11 | ₴2 | ₴3 | ₴70 |
| Comfort | ₴60 | ₴14 | ₴3 | ₴4 | ₴95 |
| Business | ₴110 | ₴22 | ₴5 | ₴6 | ₴180 |

### Price formula

```
price = max(minimum fare, (pickup fee + per_km × distance + per_min × duration + waiting_rate × (waiting − 3 min)) × surge multiplier)
        + extra options
```

Example: Economy, 4.2 km, 12 min, no waiting, no surge — 45 + 11 × 4.2 + 2 × 12 = **₴115**.

### Key parameters

| Parameter | Value | Requirement |
|---|---|---|
| Driver response time | 15 s | FR-22 |
| Free cancellation | 2 min after a driver is assigned | FR-9 |
| Cancellation fee | ₴50 | FR-9 |
| Free waiting | 3 min | FR-25 |
| Service fee | 15% | FR-26 |
| Surge multiplier | 1.0 – 2.0 | FR-36 |
| Driver search radius | 3 → 5 → 8 km | FR-35 |

The prototype uses these values: [`packages/shared/pricing.js`](../../packages/shared/pricing.js).

## Short list

Sign-up and login, ride ordering, upfront price, driver matching, cancellation, live car tracking, driver details, contacting the driver, payment, trip rating, trip history, support, driver dashboard, admin panel.

## Prototype coverage

The clickable prototype in [`apps/`](../../apps) demonstrates these requirements with mock data:

| App | Requirements |
|---|---|
| [Passenger](../../apps/passenger/index.html) | FR-4, FR-5, FR-6, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-15, FR-16, FR-17, FR-18, FR-37 |
| [Driver](../../apps/driver/index.html) | FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-28 |
| [Admin](../../apps/admin/index.html) | FR-29, FR-30, FR-31, FR-33, FR-34 |
