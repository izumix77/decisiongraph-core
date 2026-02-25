# Philosophy — Design Rationale
## DecisionGraph Core

Status: Non-normative. In case of conflict, Constitution v0.2 prevails.

> This document explains *why* DecisionGraph Core is designed the way it is.
> It is not an introduction.
> It exists to make the design defensible over decades.

---

## Why does DecisionGraph Core exist at all?

Because modern systems forget *why* they are the way they are.

Most software systems can tell you:
- what the current state is
- what code is running
- what data is stored

They usually cannot tell you:
- **who decided this**
- **when that decision became binding**
- **what assumptions it depended on**
- **what replaced it, and why**

This absence is tolerable in small systems.
It becomes catastrophic in long-lived, high-risk, or regulated systems.

DecisionGraph Core exists to treat **decisions themselves** as first-class,
persistent, inspectable artifacts.

---

## Why focus on “decisions” instead of facts, data, or knowledge?

Facts describe the world.
Data records observations.
Knowledge summarizes patterns.

**Decisions commit responsibility.**

A decision is the point where uncertainty ends and consequences begin.

Once a decision is made:
- resources are allocated
- risks are accepted
- alternatives are excluded
- accountability is created

DecisionGraph Core is concerned with *that irreversible moment*.

---

## Why must every decision have an author?

Because responsibility cannot be anonymous.

Systems that allow “authorless” decisions inevitably drift into:
- blame diffusion
- unverifiable authority
- post-hoc justification
- institutional amnesia

DecisionGraph Core does not evaluate authorship.
It does not judge competence, intent, or correctness.

It only enforces one rule:

> If a decision binds the future,
> someone must be recorded as having made it.

Without this, replay and audit are meaningless.

---

## Why is immutability enforced so strictly?

Because mutable history is not history.

If past decisions can be edited or deleted:
- audits become performative
- replay becomes fiction
- responsibility dissolves retroactively

DecisionGraph Core enforces **structural immutability** after commit.

This does *not* mean decisions cannot change.

It means change must be expressed explicitly:
- old structure remains visible
- new structure supersedes it
- the transition itself becomes inspectable

This preserves temporal truth:
> “At time T, this was the decision.”

---

## Why supersession instead of modification?

Because modification destroys context.

Replacing history erases:
- what was known at the time
- which constraints existed
- which alternatives were rejected

Supersession preserves:
- the original decision
- the reason it stopped being valid
- the structure of replacement

This is essential for:
- post-incident analysis
- legal defensibility
- scientific reproducibility
- institutional learning

---

## Why is the kernel deterministic?

Because accountability requires reproducibility.

If the same input can produce different outputs:
- audits cannot be repeated
- disputes cannot be resolved
- responsibility becomes probabilistic

DecisionGraph Core therefore forbids:
- randomness
- probabilistic inference
- implicit ordering
- implementation-dependent behavior

Determinism is not an optimization.
It is a **moral requirement** for accountable systems.

---

## Why is AI explicitly excluded from the kernel?

Because AI cannot explain itself deterministically.

LLMs are powerful tools for:
- drafting
- summarizing
- proposing
- translating

They are unsuitable as the *ground truth* of decisions.

Embedding AI inside the kernel would mean:
- identical inputs may yield different structures
- replay would depend on model state
- responsibility would be unassignable

DecisionGraph Core therefore treats AI as:
> an interface, never an authority.

---

## Why not let the kernel “judge” decision quality?

Because judgment is contextual and normative.

Quality depends on:
- domain knowledge
- values
- risk tolerance
- temporal context

Encoding such judgments into the kernel would:
- hard-code ideology
- create false objectivity
- collapse domain boundaries

DecisionGraph Core limits itself to:
- structure
- validity
- consistency

Judgment belongs to humans and policies above the kernel.

---

## Why is this not a workflow engine?

Because workflows describe *process*, not *commitment*.

Approval flows, permissions, and roles are organizational constructs.
They change frequently and differ across domains.

DecisionGraph Core is concerned with:
- the moment a decision becomes binding
- not how many approvals preceded it

This keeps the kernel stable while allowing diverse integrations.

---

## Why insist on being “boring” infrastructure?

Because infrastructure must outlive fashion.

Systems that embed trends:
- age poorly
- become brittle
- require constant justification

DecisionGraph Core deliberately chooses:
- minimalism over convenience
- explicitness over magic
- stability over speed

Its job is not to impress.
Its job is to remain trustworthy after enthusiasm fades.

---

## Why separate Constitution, Schema, and API?

Because guarantees must be layered.

- The **Constitution** defines invariants
- The **Schema** enforces data validity
- The **API** defines allowed operations

Collapsing these layers leads to:
- unclear authority
- accidental weakening of guarantees
- implementation drift

Separation makes violations detectable.

---

## Is this trying to control how people think?

No.

DecisionGraph Core does not prescribe reasoning.
It does not optimize thought.
It does not enforce correctness.

It only insists that:
> once a decision is made,
> its existence and consequences cannot be denied.

This is a system for **remembering**, not for commanding.

---

## Is this overkill?

Yes — for small, short-lived systems.

It is intentionally not optimized for:
- quick prototypes
- disposable projects
- informal decision-making

It is designed for:
- long time horizons
- high stakes
- irreversible consequences

Overkill is acceptable when failure is not.

---

## What kind of future is this designed for?

A future where:
- AI generates vast amounts of reasoning
- explanations are demanded, not optional
- decisions must be replayed across years or decades
- responsibility cannot be outsourced to machines

DecisionGraph Core assumes that:
> *someone will always be asked why.*

This kernel exists so that answer can be structural,
not rhetorical.

---

## One sentence summary

DecisionGraph Core exists to ensure that
**human decisions remain inspectable, replayable, and accountable —
even after the people who made them are gone.**
