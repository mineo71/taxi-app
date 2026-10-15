# C1 — System Context diagram: Taxi ordering system (starting)

The system context is the same as in the [ideal architecture](../ideal/c1-system-context.md): the same users and the same external systems. Simplifying the internals does not change what the system does for its users or which external services it depends on.

```mermaid
flowchart TB
  passenger["<b>Passenger</b><br/>[Person]<br/><br/>Orders a ride, pays for it<br/>and rates the driver"]
  driver["<b>Driver</b><br/>[Person]<br/><br/>Accepts orders<br/>and completes trips"]
  operator["<b>Support operator</b><br/>[Person]<br/><br/>Moderates drivers, configures tariffs,<br/>handles complaints"]

  system["<b>Taxi ordering system</b><br/>[Software System]<br/><br/>Connects passengers and drivers: takes orders,<br/>finds the nearest car, runs the trip<br/>and calculates the price"]

  maps["<b>Google Maps API</b><br/>[External Software System]<br/><br/>Routes, pickup ETA, address autocomplete"]
  payments["<b>Payment provider</b><br/>[External Software System]<br/><br/>Charges cards, Apple Pay, Google Pay"]
  sms["<b>SMS gateway</b><br/>[External Software System]<br/><br/>Sends one-time login codes"]
  push["<b>Firebase Cloud Messaging</b><br/>[External Software System]<br/><br/>Delivers push notifications<br/>to iOS and Android"]

  passenger -- "Orders a ride, pays, rates<br/>[HTTPS / JSON]" --> system
  driver -- "Accepts orders, sends location<br/>[HTTPS / WebSocket]" --> system
  operator -- "Manages tariffs and drivers<br/>[HTTPS / JSON]" --> system

  system -- "Requests route and pickup ETA<br/>[HTTPS / REST]" --> maps
  system -- "Creates a payment<br/>[HTTPS / REST]" --> payments
  system -- "Sends a verification code<br/>[HTTPS / REST]" --> sms
  system -- "Sends trip status notifications<br/>[HTTPS / REST]" --> push

  subgraph legend["Legend"]
    direction LR
    lPerson["Person"]
    lSystem["Our system"]
    lExternal["External system"]
    lArrow["Arrow = who calls whom<br/>label = action + [protocol]"]
  end

  classDef person fill:#08427b,stroke:#052e56,color:#ffffff
  classDef internal fill:#1168bd,stroke:#0b4884,color:#ffffff
  classDef external fill:#8a8a8a,stroke:#6b6b6b,color:#ffffff
  classDef note fill:#ffffff,stroke:#bbbbbb,color:#333333
  class passenger,driver,operator,lPerson person
  class system,lSystem internal
  class maps,payments,sms,push,lExternal external
  class lArrow note
  style legend fill:#fafafa,stroke:#bbbbbb
```

At the starting stage the external systems are named concretely because they are fixed by the constraints: Google Maps ([CON-5](../../requirements/constraints.md)), a single payment provider ([CON-6](../../requirements/constraints.md)), and Firebase Cloud Messaging, which delivers push to both iOS and Android through one API.

Next level: [C2 — Containers](c2-containers.md).
