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

## Phase 3c — Topology-Derived Supersession

**Status:** ✅ Completed

### Background

v0.3 stored supersession as `Node.status: "Superseded"` — a category error.
A proposition cannot contain its own negation.
Supersession is a relationship between nodes, not a property of a node.

### Achieved
- `Node.status` removed — nodes carry no stored status field
- `effectiveStatus(store, nodeId)` introduced — topology-derived, sole authority for node supersession
- `EdgeStatus` simplified to binary: `"Active"` | `"Superseded"` (`"Deprecated"` removed)
- `EdgeType` removes `"overrides"` — supersession expressed exclusively via `supersedes` edges
- `supersede_node` op removed — supersession is expressed via `supersedes` edges only
- `SELF_LOOP` violation added — edge from a node to itself is rejected
- `supersede_edge` atomicity guaranteed — old edge marked Superseded and new edge added in single operation
- `GraphStore`-based Policy interface — all policy signatures operate on `GraphStore`
- `replay` / `replayAt` operate store-wide — boundary is global, not per-graph
- `diffStore()` added for store-wide diff
- Golden fixtures C01–C20 covering all v0.4 constitutional invariants
- Migration guide v0.3 → v0.4
- JSON Schema v0.4 — typed ops, `Node.status` prohibited
- `io-json` updated to v0.4 (`supersede_node` removed, `Node.status` removed from decode)

### Preserved invariants
- All v0.3 constitutional guarantees maintained
- Single-graph GraphStore fully v0.2/v0.3 compatible in operation
- Cross-graph edge resolution unchanged

---

## Phase 4 — Ecosystem & Tooling

**Status:** 🟡 In Progress

- CLI refinement (without abstraction leakage)
  - ✅ `traverse <directory>` — tree view of violations with dependency chains
  - ✅ `DEPENDENCY_ON_SUPERSEDED` detection (Constitution Section 6)
  - ✅ Cross-graph violation rendering with `payload`-based chain tracing
  - ✅ `DEPENDENCY_ON_DEPRECATED` detection (Constitution Section 6, WARN)
  - ✅ `--strict` flag — treat WARN as ERROR
  - ✅ `cmdLint` / `cmdLintDir` updated for v0.4 GraphStore — graph initialized via `emptyGraph(graphId)` before ops
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
