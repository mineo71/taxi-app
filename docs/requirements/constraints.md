# Constraints

Constraints are conditions imposed from outside that the team cannot change at will. Unlike non-functional requirements, they are not a goal to strive for but a given.

Example of the difference: "the app must be fast" is a non-functional requirement. "We write in Flutter because the team only knows Flutter" is a constraint.

| ID | Type | Constraint |
|---|---|---|
| CON-1 | Budget | MVP development up to $60,000. Monthly infrastructure costs up to $2,000. Details in the [budget](../project/budget.md) |
| CON-2 | Timeline | MVP launch 4–6 months after development starts |
| CON-3 | Team | Effort is limited by the budget: ≈ 1,600 person-hours at $25–50 per hour |
| CON-4 | Technology | Mobile apps in Flutter (team experience), admin panel in React ([ADR-0003](../architecture/adr/0003-flutter-and-react-clients.md)) |
| CON-5 | Integrations | Maps: Google Maps API |
| CON-6 | Integrations | Payments through a single PCI DSS-certified payment provider ([ADR-0012](../architecture/adr/0012-external-payment-provider.md)) |
| CON-7 | Legal | Compliance with Ukrainian law: personal data protection, fiscalisation of payments |
| CON-8 | Infrastructure | Data stored on servers in Ukraine or the EU |
| CON-9 | Platforms | Compliance with App Store and Google Play guidelines |
| CON-10 | Platforms | Support for older Android versions (Android 8 and later) |
