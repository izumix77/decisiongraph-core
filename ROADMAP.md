# DecisionGraph Core – Roadmap

This document describes the development roadmap of **DecisionGraph Core**.
The goal is not feature accumulation, but long-term structural stability as a
deterministic decision kernel.

---

## Phase 0 — Concept & Philosophy (Completed)

**Status:** ✅ Completed

- Core philosophy defined:
  - Deterministic
  - Replayable
  - No AI reasoning
  - No probabilistic behavior
- Clear separation of concerns:
  - Core ≠ Schema ≠ IO ≠ CLI
- “Kernel does not judge, only validates and replays” principle established

Artifacts:
- README.md (Non-goals, package boundaries)
- Constitution / philosophy documents (conceptual)

---

## Phase 1 — Structural Foundation (Completed)

**Status:** ✅ Completed

This phase focused on making the project *structurally trustworthy*.

### Achievements
- Monorepo structure stabilized
- TypeScript Project References fully wired
- Dev-time type checking vs build-time emit clearly separated
- No generated artifacts committed under `src/`
- Root `tsconfig.json` added for full graph validation
- CI validates TypeScript project graph (`tsc -b`)
- Environment parity confirmed:
  - macOS / Windows
  - Node 20.x
  - pnpm 9.x

### Guarantees Achieved
- Reproducible builds
- Deterministic type graph
- No hidden cross-package coupling
- CI reflects local reality

This phase establishes the **“load-bearing skeleton”** of the project.

---

## Phase 2 — Core Maturity & Invariants (Next)

**Status:** 🟡 Planned / In Progress

Focus: strengthen *semantic correctness* without increasing surface area.

### Goals
- Explicitly define and document **core invariants**
- Expand kernel-level validation where appropriate
- Improve internal consistency guarantees

### Candidate Work
- Clarify invariants for:
  - Graph structure
  - Node / Edge identity
  - Temporal consistency
- Improve error typing and classification
- Tighten lint / diff / replay contracts
- Add minimal, high-signal tests for invariants

Non-goals:
- No performance optimizations yet
- No new storage backends
- No convenience APIs that weaken guarantees

---

## Phase 3 — Policy & Extension Boundaries (Future)

**Status:** ⚪ Planned

Focus: preventing future complexity collapse.

### Goals
- Prevent policy logic from bloating the core
- Make extension points explicit and safe

### Candidate Work
- Evaluate extracting policies into:
  - `@decisiongraph/policies`
- Formalize:
  - Policy interfaces
  - Policy compatibility rules
- Define versioning strategy between:
  - Core
  - Schema
  - IO adapters

This phase protects the **long-term maintainability** of the kernel.

---

## Phase 4 — Ecosystem & Tooling (Future)

**Status:** ⚪ Optional / Downstream

Focus: usability *around* the core, not inside it.

### Possible Directions
- Better CLI ergonomics (without leaking abstractions)
- Visualization or inspection tools
- Integration examples (TraceOS, ClaimAtom, etc.)

These must remain **strictly layered above the core**.

---

## Explicit Non-Goals (Always)

The following are intentionally out of scope for DecisionGraph Core:

- AI reasoning or inference
- Probabilistic or heuristic behavior
- Workflow engines
- Permission systems
- Organization-specific logic
- UI concerns

If a feature requires any of the above, it belongs in a higher layer.

---

## Guiding Principle

> **DecisionGraph Core is infrastructure.**
> Boring is good. Predictable is essential.
> Every added feature must justify its impact on determinism.

---

- English roadmap: [ROADMAP.md](./ROADMAP.md)
- 日本語ロードマップ: [ROADMAP.ja.md](./ROADMAP.ja.md)
