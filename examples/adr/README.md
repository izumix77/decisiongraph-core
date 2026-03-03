# Example: Architecture Decision Records (ADR)

This example demonstrates cross-graph dependencies across multiple teams
using DecisionGraph Core.

## Scenario

Three teams make decisions that depend on each other:

1. **SEC-001** (`G:security`) — Security team mandates OAuth 2.0 for all external endpoints
2. **AUTH-001** (`G:auth`) — Auth team implements OAuth 2.0 via Auth0 *(depends on SEC-001)*
3. **API-001** (`G:api`) — API team configures the gateway to validate JWT via Auth0 *(depends on AUTH-001)*

All decisions are `Active` — this is a **healthy, passing** example.

## Running

```bash
npx decisiongraph traverse ./decisions
```

Expected output:

```
✔ [01-security-policy.decisionlog.json]
✔ [02-auth-service.decisionlog.json]
✔ [03-api-gateway.decisionlog.json]
✔ Validation passed  (3 file(s))
```

## What this shows

- Cross-graph `depends_on` edges are resolved across the entire GraphStore
- Three separate teams (`G:security`, `G:auth`, `G:api`) each own their graph
- The dependency chain `API-001 → AUTH-001 → SEC-001` is explicit and inspectable
- **No inference** — the structure itself is the data

## Current limitation

As of v0.3, there is no operation to change a committed node's `status`
(e.g. `Active → Superseded`). This means the scenario of
"a decision that becomes invalid over time" cannot yet be expressed in a single
time-series log.

This is tracked in [ROADMAP.md](../../ROADMAP.md) under Phase 3b:
**Node status transition operation**.

For an example of `DEPENDENCY_ON_SUPERSEDED` detection,
see [`../broken/`](../broken/).
