# C1 — System Context diagram: Taxi ordering system (ideal)

The system seen from the outside: it is shown as a single box, surrounded by the people who use it and the external services it cannot work without. There are no technologies at this level because it is meant for the client, not for developers.

The system context is the same in the [starting architecture](../starting/c1-system-context.md): only the internals differ.

```mermaid
flowchart TB
  passenger["<b>Passenger</b><br/>[Person]<br/><br/>Orders a ride, pays for it<br/>and rates the driver"]
  driver["<b>Driver</b><br/>[Person]<br/><br/>Accepts orders<br/>and completes trips"]
  operator["<b>Support operator</b><br/>[Person]<br/><br/>Moderates drivers, configures tariffs,<br/>handles complaints"]

  system["<b>Taxi ordering system</b><br/>[Software System]<br/><br/>Connects passengers and drivers: takes orders,<br/>finds the nearest car, runs the trip<br/>and calculates the price"]

  maps["<b>Maps service</b><br/>[External Software System]<br/><br/>Builds routes and calculates pickup ETA"]
  payments["<b>Payment gateway</b><br/>[External Software System]<br/><br/>Charges the passenger's card"]
  sms["<b>SMS gateway</b><br/>[External Software System]<br/><br/>Sends one-time login codes"]
  push["<b>Push notification service</b><br/>[External Software System]<br/><br/>Delivers notifications to phones"]

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

## Elements

| Element | Type | Role |
|---|---|---|
| Passenger | Person | Orders a ride, pays for it and rates the driver |
| Driver | Person | Accepts orders and completes trips |
| Support operator | Person | Moderates drivers, configures tariffs, handles complaints |
| Taxi ordering system | Our system | Connects passengers and drivers |
| Maps service | External system | Routes, distance, pickup ETA |
| Payment gateway | External system | Card charges |
| SMS gateway | External system | One-time login codes |
| Push notification service | External system | Push notifications to phones |

Next level: [C2 — Containers](c2-containers.md).
