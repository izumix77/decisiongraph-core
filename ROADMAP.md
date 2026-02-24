# DecisionGraph Core – Roadmap (Revised)

This document defines the development roadmap for **DecisionGraph Core**.
The objective is not feature growth, but **long-term structural stability as a deterministic decision kernel**.

---

## Phase 0 — Conceptual Foundation (Completed)

**Status:** ✅ Completed

### Objectives

- Establish core principles:

    - Deterministic behavior

    - Replayable state

    - No AI reasoning

    - No probabilistic or heuristic logic

- Clear responsibility boundaries:

    - Core ≠ Schema ≠ IO ≠ CLI

- Principle:

    > The kernel does not decide. It validates and replays.


### Deliverables

- README (Non-goals / package boundaries)

- Constitution documents (conceptual layer)


---

## Phase 1 — Structural Infrastructure (Completed)

**Status:** ✅ Completed

This phase ensured the project became structurally trustworthy.

### Achievements

- Stable monorepo structure

- Full TypeScript Project References

- Separation of dev type-checking and build emit

- No generated artifacts inside `src/`

- Root-level graph validation via `tsconfig.json`

- CI execution of `tsc -b`

- Environment consistency:

    - macOS / Windows

    - Node.js 20.x

    - pnpm 9.x


### Guarantees Established

- Reproducible builds

- Deterministic dependency graph

- No implicit package coupling

- CI/local behavior parity


This phase established the **load-bearing skeleton** of the project.

---

## Phase 2 — Core Maturity & Invariants (In Progress)

**Status:** 🟡 In Progress
(**Non-bypassable invariants are now enforced**)

The goal of Phase 2 is to strengthen semantic correctness without expanding surface area.

---

### Already Achieved

- Constitution v0.2 finalized

- “Specification over implementation” order established

- Commit immutability enforced at kernel entry

- Constitutional enforcement is non-bypassable

    - `apply()` always runs ConstitutionalPolicy first

    - `lint()` always runs ConstitutionalPolicy first

- Policy injection can no longer weaken invariants

- Append-only constraints enforced at kernel level

- Runtime vocabulary enforcement:

    - NodeStatus

    - EdgeStatus

    - EdgeType

- Violation severity introduced

- Deterministic error classification established

- Single-commit constraint enforced

- Duplicate ID detection (node / edge / commit)


The Constitution is no longer documentation —
it is executable law.

---

## Phase 2 Exit Criteria

Phase 2 does not mean “feature complete.”
It means **the kernel is safe to build upon.**

---

### A) Minimal Scenario Round-Trip

- Create minimal Graph (Node / Edge)

- Apply operations

- Create commit

- Replay state at commit


**Status:** 🟡 Partially complete
(Golden fixtures not yet implemented)

---

### B) Non-bypassable Invariants

- `apply` / `applyBatch` enforce Constitution before any caller policy

- Immutability after first commit enforced at kernel entry

- Single-commit rule enforced

- Runtime vocabulary enforcement (NodeStatus / EdgeStatus / EdgeType)

- ID uniqueness enforced (node.id / edge.id)


**Status:** ✅ Complete
(ConstitutionalPolicy always enforced before caller policy)

---

### C) Deterministic Failure Semantics

- Invariant violations are always severity `ERROR`

- Stable violation codes with deterministic ordering

- Output normalization is deterministic across environments

- Golden fixtures prevent regression in failure output


**Status:** ✅ Complete

---

### D) Golden Test Suite

- ≥ 10 JSON fixtures

- apply → commit → replay round-trip validation

- CI enforced


**Status:** ⬜ Not started

---

### Explicit Non-Goals (Phase 2)

- Performance optimization

- Storage implementations

- Convenience APIs that weaken guarantees

- Surface area expansion


---

When Phase 2 completes, DecisionGraph Core becomes:

> A minimal, institutionally enforceable decision kernel.

---

## Phase 3 — Policy Boundary & Extension Safety (Future)

**Status:** ⚪ Planned

Objective: Prevent long-term structural erosion.

### Planned Work

- Potential externalization of policies

    - e.g., `@decisiongraph/policies`

- Formalization of policy compatibility rules

- Version boundary clarification:

    - Core

    - Schema

    - IO


This phase acts as a **long-term stability barrier**.

---

## Phase 4 — Ecosystem & Tooling (Optional / Downstream)

**Status:** ⚪ Downstream

Objective: Improve usability outside the kernel.

Possible directions:

- CLI refinement (without abstraction leakage)

- Visualization tools

- Integration examples:

    - ClaimAtom

    - TraceOS


All such tools must remain strictly outside the Core.

---

## Permanent Non-Goals (Always)

DecisionGraph Core will never include:

- AI reasoning

- Probabilistic behavior

- Workflow engines

- Permission systems

- Organization-specific logic

- UI/UX layers


These belong strictly to upper layers.

---

## Guiding Principle

> DecisionGraph Core is infrastructure.
> Boring is a virtue.
> Predictability is mandatory.
>
> Every change must strengthen determinism.# DecisionGraph Core – Roadmap (Revised)

This document defines the development roadmap for **DecisionGraph Core**.
The objective is not feature growth, but **long-term structural stability as a deterministic decision kernel**.

---

## Phase 0 — Conceptual Foundation (Completed)

**Status:** ✅ Completed

### Objectives

- Establish core principles:

    - Deterministic behavior

    - Replayable state

    - No AI reasoning

    - No probabilistic or heuristic logic

- Clear responsibility boundaries:

    - Core ≠ Schema ≠ IO ≠ CLI

- Principle:

    > The kernel does not decide. It validates and replays.


### Deliverables

- README (Non-goals / package boundaries)

- Constitution documents (conceptual layer)


---

## Phase 1 — Structural Infrastructure (Completed)

**Status:** ✅ Completed

This phase ensured the project became structurally trustworthy.

### Achievements

- Stable monorepo structure

- Full TypeScript Project References

- Separation of dev type-checking and build emit

- No generated artifacts inside `src/`

- Root-level graph validation via `tsconfig.json`

- CI execution of `tsc -b`

- Environment consistency:

    - macOS / Windows

    - Node.js 20.x

    - pnpm 9.x


### Guarantees Established

- Reproducible builds

- Deterministic dependency graph

- No implicit package coupling

- CI/local behavior parity


This phase established the **load-bearing skeleton** of the project.

---

## Phase 2 — Core Maturity & Invariants (In Progress)

**Status:** 🟡 In Progress
(**Non-bypassable invariants are now enforced**)

The goal of Phase 2 is to strengthen semantic correctness without expanding surface area.

---

### Already Achieved

- Constitution v0.2 finalized

- “Specification over implementation” order established

- Commit immutability enforced at kernel entry

- Constitutional enforcement is non-bypassable

    - `apply()` always runs ConstitutionalPolicy first

    - `lint()` always runs ConstitutionalPolicy first

- Policy injection can no longer weaken invariants

- Append-only constraints enforced at kernel level

- Runtime vocabulary enforcement:

    - NodeStatus

    - EdgeStatus

    - EdgeType

- Violation severity introduced

- Deterministic error classification established

- Single-commit constraint enforced

- Duplicate ID detection (node / edge / commit)


The Constitution is no longer documentation —
it is executable law.

---

## Phase 2 Exit Criteria

Phase 2 does not mean “feature complete.”
It means **the kernel is safe to build upon.**

---

### A) Minimal Scenario Round-Trip

- Create minimal Graph (Node / Edge)

- Apply operations

- Create commit

- Replay state at commit


**Status:** 🟡 Partially complete
(Golden fixtures not yet implemented)

---

### B) Non-bypassable Invariants

- No mutation after commit

- Cannot bypass immutability via injected policy

- Append-only semantics cannot be broken


**Status:** ✅ Complete
(ConstitutionalPolicy always enforced before caller policy)

---

### C) Deterministic Failure Semantics

- Invariant violations classified as `ERROR`

- Stable violation codes

- Output does not vary across environments


**Status:** ✅ Complete

---

### D) Golden Test Suite

- ≥ 10 JSON fixtures

- apply → commit → replay round-trip validation

- CI enforced


**Status:** ⬜ Not started

---

### Explicit Non-Goals (Phase 2)

- Performance optimization

- Storage implementations

- Convenience APIs that weaken guarantees

- Surface area expansion


---

When Phase 2 completes, DecisionGraph Core becomes:

> A minimal, institutionally enforceable decision kernel.

---

## Phase 3 — Policy Boundary & Extension Safety (Future)

**Status:** ⚪ Planned

Objective: Prevent long-term structural erosion.

### Planned Work

- Potential externalization of policies

    - e.g., `@decisiongraph/policies`

- Formalization of policy compatibility rules

- Version boundary clarification:

    - Core

    - Schema

    - IO


This phase acts as a **long-term stability barrier**.

---

## Phase 4 — Ecosystem & Tooling (Optional / Downstream)

**Status:** ⚪ Downstream

Objective: Improve usability outside the kernel.

Possible directions:

- CLI refinement (without abstraction leakage)

- Visualization tools

- Integration examples:

    - ClaimAtom

    - TraceOS


All such tools must remain strictly outside the Core.

---

## Permanent Non-Goals (Always)

DecisionGraph Core will never include:

- AI reasoning

- Probabilistic behavior

- Workflow engines

- Permission systems

- Organization-specific logic

- UI/UX layers


These belong strictly to upper layers.

---

## Guiding Principle

> DecisionGraph Core is infrastructure.
> Boring is a virtue.
> Predictability is mandatory.
>
> Every change must strengthen determinism.# DecisionGraph Core – Roadmap (Revised)

This document defines the development roadmap for **DecisionGraph Core**.
The objective is not feature growth, but **long-term structural stability as a deterministic decision kernel**.

---

## Phase 0 — Conceptual Foundation (Completed)

**Status:** ✅ Completed

### Objectives

- Establish core principles:

    - Deterministic behavior

    - Replayable state

    - No AI reasoning

    - No probabilistic or heuristic logic

- Clear responsibility boundaries:

    - Core ≠ Schema ≠ IO ≠ CLI

- Principle:

    > The kernel does not decide. It validates and replays.


### Deliverables

- README (Non-goals / package boundaries)

- Constitution documents (conceptual layer)


---

## Phase 1 — Structural Infrastructure (Completed)

**Status:** ✅ Completed

This phase ensured the project became structurally trustworthy.

### Achievements

- Stable monorepo structure

- Full TypeScript Project References

- Separation of dev type-checking and build emit

- No generated artifacts inside `src/`

- Root-level graph validation via `tsconfig.json`

- CI execution of `tsc -b`

- Environment consistency:

    - macOS / Windows

    - Node.js 20.x

    - pnpm 9.x


### Guarantees Established

- Reproducible builds

- Deterministic dependency graph

- No implicit package coupling

- CI/local behavior parity


This phase established the **load-bearing skeleton** of the project.

---

## Phase 2 — Core Maturity & Invariants (In Progress)

**Status:** 🟡 In Progress
(**Non-bypassable invariants are now enforced**)

The goal of Phase 2 is to strengthen semantic correctness without expanding surface area.

---

### Already Achieved

- Constitution v0.2 finalized

- “Specification over implementation” order established

- Commit immutability enforced at kernel entry

- Constitutional enforcement is non-bypassable

    - `apply()` always runs ConstitutionalPolicy first

    - `lint()` always runs ConstitutionalPolicy first

- Policy injection can no longer weaken invariants

- Append-only constraints enforced at kernel level

- Runtime vocabulary enforcement:

    - NodeStatus

    - EdgeStatus

    - EdgeType

- Violation severity introduced

- Deterministic error classification established

- Single-commit constraint enforced

- Duplicate ID detection (node / edge / commit)


The Constitution is no longer documentation —
it is executable law.

---

## Phase 2 Exit Criteria

Phase 2 does not mean “feature complete.”
It means **the kernel is safe to build upon.**

---

### A) Minimal Scenario Round-Trip

- Create minimal Graph (Node / Edge)

- Apply operations

- Create commit

- Replay state at commit


**Status:** 🟡 Partially complete
(Golden fixtures not yet implemented)

---

### B) Non-bypassable Invariants

- No mutation after commit

- Cannot bypass immutability via injected policy

- Append-only semantics cannot be broken


**Status:** ✅ Complete
(ConstitutionalPolicy always enforced before caller policy)

---

### C) Deterministic Failure Semantics

- Invariant violations classified as `ERROR`

- Stable violation codes

- Output does not vary across environments


**Status:** ✅ Complete

---

### D) Golden Test Suite

- ≥ 10 JSON fixtures

- apply → commit → replay round-trip validation

- CI enforced


**Status:** ⬜ Not started

---

### Explicit Non-Goals (Phase 2)

- Performance optimization

- Storage implementations

- Convenience APIs that weaken guarantees

- Surface area expansion


---

When Phase 2 completes, DecisionGraph Core becomes:

> A minimal, institutionally enforceable decision kernel.

---

## Phase 3 — Policy Boundary & Extension Safety (Future)

**Status:** ⚪ Planned

Objective: Prevent long-term structural erosion.

### Planned Work

- Potential externalization of policies

    - e.g., `@decisiongraph/policies`

- Formalization of policy compatibility rules

- Version boundary clarification:

    - Core

    - Schema

    - IO


This phase acts as a **long-term stability barrier**.

---

## Phase 4 — Ecosystem & Tooling (Optional / Downstream)

**Status:** ⚪ Downstream

Objective: Improve usability outside the kernel.

Possible directions:

- CLI refinement (without abstraction leakage)

- Visualization tools

- Integration examples:

    - ClaimAtom

    - TraceOS


All such tools must remain strictly outside the Core.

---

## Permanent Non-Goals (Always)

DecisionGraph Core will never include:

- AI reasoning

- Probabilistic behavior

- Workflow engines

- Permission systems

- Organization-specific logic

- UI/UX layers


These belong strictly to upper layers.

---

## Guiding Principle

> DecisionGraph Core is infrastructure.
> Boring is a virtue.
> Predictability is mandatory.
>
> Every change must strengthen determinism.

---

- English roadmap: [ROADMAP.md](./ROADMAP.md)
- 日本語ロードマップ: [ROADMAP.ja.md](./ROADMAP.ja.md)
