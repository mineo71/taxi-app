# C1 — System Context diagram: Taxi ordering system (starting)

The system context is the same as in the [ideal architecture](../ideal/c1-system-context.md): the same users and the same external systems. Simplifying the internals does not change what the system does for its users or which external services it depends on.

![C1 — System Context diagram (starting)](diagrams/c1-system-context.png)

*Source: [`taxi-c4-model-starting.drawio`](diagrams/taxi-c4-model-starting.drawio), page "C1 — System Context". Open it at [app.diagrams.net](https://app.diagrams.net) to edit.*

At the starting stage the external systems are named concretely because they are fixed by the constraints: Google Maps ([CON-5](../../requirements/constraints.md)), a single payment provider ([CON-6](../../requirements/constraints.md)), and Firebase Cloud Messaging, which delivers push to both iOS and Android through one API.

Next level: [C2 — Containers](c2-containers.md).
