# FAQ — DecisionGraph Core

> This document is the canonical English version.
> Translations are provided for reference only.

---

## Is DecisionGraph Core a database?

No.

DecisionGraph Core does not aim to be a general-purpose database or storage engine.

It defines a **deterministic decision structure** and the rules for validating,
replaying, and auditing that structure.

How and where data is stored (files, databases, version control, append-only logs)
is intentionally left to implementations.

---

## Is this a knowledge graph?

Not in the conventional sense.

Knowledge graphs typically model facts, entities, or inferred relationships.
DecisionGraph Core models **explicit human decisions** and their declared relationships.

There is no inference, enrichment, or semantic expansion inside the kernel.

---

## Is this a blockchain?

No.

DecisionGraph Core does not provide:

- distributed consensus
- cryptographic mining
- economic incentives
- network-level trust guarantees

Immutability is enforced **by rules and validation**, not by consensus protocols.

It can be used *alongside* blockchains, but does not require them.

---

## Why is AI explicitly excluded from the kernel?

Because AI is probabilistic.

DecisionGraph Core guarantees:

- determinism
- replayability
- auditability

Embedding AI reasoning inside the kernel would break these guarantees.

AI may exist **outside** the kernel to:
- propose decisions
- suggest relationships
- assist with authoring

But the kernel itself accepts only explicit, structured inputs.

---

## Why is `author` required?

Because decisions without authorship are not accountable.

DecisionGraph Core treats decisions as **responsibility-bearing artifacts**.
Replay, audit, and explanation all require knowing *who* made a decision.

The kernel does not judge the author — it only preserves identity.

---

## Why can't I modify or delete decisions after commit?

Because history must remain inspectable.

Allowing mutation would break:
- audit trails
- time-based replay
- responsibility attribution

Changes are expressed through **supersession**, not mutation.
Old structure remains visible; new structure becomes effective.

---

## Is this meant for end users?

No.

DecisionGraph Core is infrastructure.
It is intended to be embedded into systems, tools, or platforms.

End-user experiences belong to UI and application layers built on top of the core.

---

## Can I use this for my own domain (law, medicine, finance, research)?

Yes.

The core is intentionally domain-agnostic.
Domain semantics belong in:
- extensions
- policies
- higher-layer schemas
- application logic

The kernel remains neutral and reusable.

---

## What problem does this solve that Git or documents do not?

Git tracks *files*.
DecisionGraph Core tracks *decisions*.

Documents describe reasoning.
DecisionGraph Core records the **structural outcome** of reasoning.

This enables:
- deterministic replay
- structural validation
- dependency inspection
- long-term accountability

---

## Is this trying to replace human judgment?

No.

DecisionGraph Core does not make decisions.
It records them.

It makes judgment **inspectable and accountable**, not automated.
