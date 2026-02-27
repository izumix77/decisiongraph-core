# DecisionGraph Core – Roadmap

DecisionGraph Core is a deterministic kernel for recording, validating, and replaying human decisions as graph assets.
The objective is not feature growth, but long-term structural stability.

---

## Phase 0 — Conceptual Foundation

**Status:** ✅ Completed

- Deterministic behavior / replayable state
- No AI reasoning / no probabilistic logic
- Clear boundaries: Core ≠ Schema ≠ IO ≠ CLI
- Principle: The kernel does not decide. It validates and replays.

Deliverables: README, Constitution docs.

---

## Phase 1 — Structural Infrastructure

**Status:** ✅ Completed

- Stable monorepo + TS Project References
- Dev typecheck vs build emit split
- No generated artifacts under `src/`
- Root graph validation and CI `tsc -b`
- Env parity: macOS/Windows, Node 20.x, pnpm 9.x

Guarantees: reproducible builds, deterministic deps, CI/local parity.

---

## Phase 2 — Core Maturity & Invariants

**Status:** ✅ Completed
(Non-bypassable invariants are enforced)

### Achieved
- Constitution v0.2 finalized; spec > implementation order established
- Non-bypassable Constitutional enforcement:
  - `apply/applyBatch` enforce Constitution before any caller policy
  - `lint` enforces Constitution before caller policy
- Post-commit immutability + single-commit rule enforced
- Runtime vocab enforcement: NodeStatus / EdgeStatus / EdgeType
- ID uniqueness enforced: node.id / edge.id / commitId
- Violation severity introduced; deterministic error classification
- Golden fixtures (≥ 10) include deterministic `replayAt` snapshots

> The Constitution is executable law.

### Explicit Non-Goals (Phase 2)
- Performance optimization, storage implementations
- Convenience APIs that weaken guarantees
- Surface area expansion

---

## Phase 3a — Multi-Graph Kernel

**Status:** ✅ Completed

### Achieved
- Constitution v0.3 finalized
- `GraphStore` introduced as top-level container
- `graphId` required on all Graphs and log files
- ID uniqueness enforced GraphStore-wide (node.id / edge.id / commitId)
- Cross-graph edges supported: `Edge.from` / `Edge.to` may reference Nodes in other Graphs
- `EDGE_NOT_RESOLVED` enforced for unresolvable cross-graph references
- Circular dependency detection across graph boundaries (DFS)
- Per-Graph commit immutability preserved
- Full backward compatibility with single-graph (v0.2) operations
- `lintStore` for store-wide cross-graph validation
- `resolveNode` / `resolveEdge` as first-class kernel operations
- Migration guide v0.2 → v0.3

---

## Phase 3b — Policy Boundary & Extension Safety

**Status:** ⚪ Planned

- Keep policy logic from eroding the kernel
- Externalize domain policies (e.g. `@decisiongraph/policies`)
- Formalize policy compatibility and version boundaries (Core / Schema / IO)
- Ensure extension packages cannot weaken constitutional guarantees
- The Core defines structure, responsibility, and replayability — not meaning

---

## Phase 4 — Ecosystem & Tooling

**Status:** 🟡 In Progress

- CLI refinement (without abstraction leakage)
  - ✅ `traverse <directory>` — tree view of violations with dependency chains
  - ✅ `DEPENDENCY_ON_SUPERSEDED` detection (Constitution Section 6)
  - ✅ Cross-graph violation rendering with `payload`-based chain tracing
- Visualization / inspection tools
- Integration examples (ClaimAtom, TraceOS)

All tooling must remain outside the Core.

---

## Permanent Non-Goals (Always)

No AI reasoning, probabilistic behavior, workflow engines, permission systems,
org-specific logic, or UI/UX. These belong to upper layers.

---

## Guiding Principle

> DecisionGraph Core is infrastructure.
> Boring is a virtue. Predictability is mandatory.
> Every change must strengthen determinism.
