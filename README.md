# DecisionGraph Core

**DecisionGraph Core** is a deterministic kernel for recording, traversing, and replaying
**human decisions** as first-class graph assets.

> AI may generate meaning.
> Humans must fix meaning.
> DecisionGraph Core stores that fixed meaning.

---

## What this is

DecisionGraph Core is **not a search engine** and **not an AI reasoning system**.

It is a **domain-agnostic, language-independent kernel** that treats decisions as:

- explicit
- inspectable
- replayable
- auditable

If your system needs to answer:

- *Why was this decided?*
- *What does this decision depend on?*
- *Is this decision still valid at a given time?*

DecisionGraph Core provides the structural layer to answer those questions
**without inference or guessing**.

---

## What this is NOT

DecisionGraph Core intentionally does **not**:

- perform AI inference or reasoning
- judge correctness, ethics, or quality
- generate content
- optimize or recommend decisions
- act as a workflow or approval system

Those belong to **interface layers**, **policies**, or **human judgment** — not the kernel.

---

## Core idea

Decisions are treated as **state transitions**, not opinions or predictions.

- Every decision has an **author**
- Every decision has a **commit point**
- Every relationship is **explicit**
- Once committed, structure is **append-only**

Changes are expressed by **supersession**, never mutation.

This makes decision history:

- replayable
- diffable
- auditable
- explainable across time

---

## Design principles

DecisionGraph Core is built around a **Constitution-first** model:

- The **Constitution** defines non-negotiable requirements
- APIs and schemas **must comply** with the Constitution
- Policies may **extend**, but never weaken, constitutional guarantees

Key guarantees:

- **Determinism** — same input always yields the same output
- **Immutability** — committed decisions cannot be altered
- **Replayability** — past states can be reconstructed exactly
- **Auditability** — every decision traces back to a human author
- **Lintability** — structural violations are detectable before use

These are enforced at the kernel level, not by convention.

---

## Decisions as a graph

Each decision is a node.
Each relationship is an explicit, typed edge.


```text
Decision A
 └─ depends_on → Decision B
      └─ superseded_by → Decision C
```

There is no hidden meaning and no implicit inference.
**The structure is the data.**

---

## Language independence

Natural language is treated as a **view**, not as a source of truth.

The kernel operates on stable identifiers and structure.
Human-readable text exists for interpretation and presentation only.

This allows:

- multi-language representations

- deterministic behavior

- stable replay across time and systems

---

## Typical use cases

DecisionGraph Core is suited for domains where decisions must remain accountable over time:

- Architecture Decision Records (ADR)

- Research and experimental reasoning

- Legal and regulatory decision tracking

- Governance and policy evolution

- High-risk or long-lived system design


It is not intended for end-user productivity tools or consumer-facing AI features.

---

## Project structure

### Repository layout (source of truth)


This repository is a monorepo.

```text
docs/
  constitution/v0.2/   # Normative specification (supreme authority)
packages/
  core/                # Deterministic kernel (domain model, replay, diff)
  schema/              # JSON Schema validators (structural only)
  io-json/             # JSON ↔ core mapping and normalization
  cli/                 # CLI wrapper (non-normative interface)
```

The normative source of truth is docs/constitution/v0.2.
If there is any conflict between documentation and implementation,
the Constitution MUST take precedence.

### Key documents

- README.md — this file (overview)

- Constitution v0.2 — normative requirements (supreme authority)

- JSON Schema v0.2 — data validation rules

- Minimal Kernel API v0.2 — implementation specification

#### Recommended reading order:

1. README
2. Constitution
3. JSON Schema
4. Kernel API

---

## Versioning

DecisionGraph Core follows explicit versioning.

Breaking changes are documented and require migration.
v0.2 introduces stricter immutability, required authorship, and a unified state model.

---

## Open source boundary

### Open (this repository)

- Deterministic graph model

- Validation and replay logic

- Constitutional guarantees

- Language-independent structure


### Out of scope

- Organizational workflows

- Responsibility attribution systems

- AI agents and prompt logic

- Proprietary governance layers


The kernel remains neutral and reusable across domains.

---

## Status

- **Current version:** v0.2

- **Stability:** Active development

- **Normative authority:** Constitution v0.2

---

## License

MIT License
