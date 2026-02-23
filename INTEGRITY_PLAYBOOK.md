# INTEGRITY_PLAYBOOK.md

# DecisionGraph Ecosystem – Data Integrity Playbook

> This document defines non-negotiable rules for maintaining structural integrity
> across DecisionGraph Core, ClaimAtom Suite, FlowMemo, and future applications.

This file exists to prevent:

- Vocabulary drift

- Data model divergence

- Multiple competing “sources of truth”

- Replay inconsistencies

- Accidental architectural coupling


---

# 0. Core Principle

## Single Source of Truth

The only canonical, replayable, auditable source of truth is:

> **DecisionGraph Envelope (ops + commits)**

Everything else is secondary.

---

# 1. Layer Model (System Boundary Definition)

We operate with four strict layers:

## 1. Kernel (DecisionGraph Core)

Responsibilities:

- Deterministic state transitions

- Operation application

- Commit immutability

- Replay (as-of)

- Structural validation


Non-responsibilities:

- UI concepts

- Business meaning

- Workflow

- Permissions

- Organizational semantics


The Kernel does not know what a "Decision" means.

---

## 2. Spec Layer (Schemas & Profiles)

Includes:

- DG Envelope JSON Schema

- FlowProfile

- ClaimProfile

- Mapping tables


Responsibilities:

- Define allowed vocabulary for applications

- Provide validation constraints

- Translate app-level relations → Core EdgeTypes


Non-responsibilities:

- UI rendering

- Business logic


Profiles constrain usage.
They do not redefine the Kernel.

---

## 3. Application Layer (ClaimAtom, FlowMemo, etc.)

Responsibilities:

- UI

- Editing

- Domain semantics

- User workflows

- Visual representation


Rules:

- Applications MUST persist canonical state as DecisionGraph Envelope.

- Applications MAY store UI cache.

- Applications MUST NOT introduce competing history systems.


---

## 4. Trust / Operations Layer

Includes:

- Ledger Stamp

- Hash receipts

- External signatures

- Audit export


Responsibilities:

- External proof

- Time anchoring

- Verification support


This layer does not alter Kernel logic.

---

# 2. Data Categories (Never Mix These)

All stored data must be classified as one of:

## A. Canonical Data (Immutable, Replayable)

- ops

- commits

- decisiongraph envelope


This is authoritative.

## B. Profile / Constraint Data

- FlowProfile

- ClaimProfile

- Vocabulary mapping

- Allowed relation sets


Defines how an app uses the Kernel.

## C. UI Cache / View State (Discardable)

- Node position

- Layout

- Selected tab

- Zoom level

- Temporary annotations


Must never be treated as canonical history.

---

# 3. Vocabulary Separation Rules

## Rule 1 — No Same-Name Leakage

Suite vocabulary MUST NOT reuse Core vocabulary names unless meaning is identical.

Example:

Core:

- depends_on


FlowMemo (invalid):

- depends_on


FlowMemo (correct):

- blocks → maps to depends_on


---

## Rule 2 — All App Relations Must Map to Core EdgeType

Every application-level relation must define an explicit mapping:

Example:

FlowRelation → Core EdgeType

- blocks → depends_on

- because → supports

- contradicts → refutes

- updates → supersedes

- link → supports


Mapping must be documented in Profile.

---

## Rule 3 — Core Vocabulary Is Constitution-Level

Core terms are frozen unless constitutionally revised:

- Node

- Edge

- Op

- Commit

- Replay

- Validation

- Deterministic

- EdgeType


Applications adapt.
Core does not.

---

# 4. History Integrity Rules

## Forbidden

Applications must NOT:

- Treat UI history arrays as authoritative

- Persist alternative replay logic

- Modify past commits

- Override Kernel validation rules


## Required

All state changes must:

- Produce valid Operation

- Be applied through Kernel

- Be commit-capable

- Be replayable


---

# 5. Development Discipline Checklist

Before starting work, declare which layer you are modifying:

-  Kernel (DGC)

-  Schema / Profile

-  Application UI

-  Trust / Receipt


If multiple boxes are checked, reconsider scope.

---

# 6. Required Cross-Project Tests

Every application must pass:

## Replay Consistency

App → DG → Replay → App View must match.

## As-of State

Historical commit reconstruction must work.

## Schema Validation

All envelopes validate against DG schema.

## Mapping Coverage

All app relations must map to valid Core EdgeType.

---

# 7. Migration Rules

When modifying schema:

- Never break Envelope format without version bump.

- Never introduce non-deterministic state.

- Never change EdgeType meaning silently.

- Document mapping changes explicitly.


---

# 8. Naming Discipline

Use:

Core language → when writing specification
Suite language → when writing product docs
Marketing language → when communicating externally

Never mix layers in one sentence unless explicitly comparing.

---

# 9. Architectural North Star

DecisionGraph Core is:

> A deterministic judgment kernel.

Applications are:

> Interfaces to produce and explore replayable decision graphs.

The Kernel is infrastructure.
Applications are expression layers.

---

# 10. Final Guardrail

If a change:

- Introduces alternate truth

- Bypasses commit

- Adds semantic meaning inside Kernel

- Couples UI concept into Core


Stop.

Re-evaluate.

---

# End of Playbook
