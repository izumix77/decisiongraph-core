# DecisionGraph Core — Constitution v0.2

**BREAKING CHANGES from v0.1a**

- Strengthened edge immutability requirements
- Clarified commit boundary enforcement
- Unified state model
- Removed implementation ambiguities

---

**DecisionGraph Core is not a search engine.**
It is a deterministic kernel for recording, traversing, and replaying human decisions as first-class graph assets.

AI is used only as an interface layer. All retrieval is deterministic.

This document defines the **constitutional boundary** of the Core.
Sections marked **Normative** define requirements that implementations **MUST** follow.
Sections marked **Non-Normative** provide rationale or guidance and do not impose requirements.

---

## 1) Scope & Non-Goals

### Core DOES

- Store and validate **Decision Nodes** and **Relationship Edges**

- Provide deterministic:

    - **search** (filtering by structured fields / concept tags)

    - **traverse** (bounded path traversal over edges)

    - **replay** (reconstruct decision state `as-of` a time)


### Core DOES NOT

- Perform AI reasoning or natural language understanding

- Judge correctness, ethics, or quality of decisions

- Generate content

- Enforce organization-level permissions, approvals, or workflows (belongs to higher layers)


---

## 2) Data Model (Minimal) — **Normative**

### 2.1 Decision Node (Minimal)

A Decision Node represents a single, committed human judgment.

```
id (string): unique decision identifier (MUST be stable)
status (string): active | superseded | deprecated

metadata (object) MUST contain:
  author (string): REQUIRED, non-null, non-empty
  created_at (string, RFC3339 timestamp): time of initial creation
  committed_at (string, RFC3339 timestamp): time of structural immutability

statement (string): human-readable declaration (view-layer only)
context (object): domain / tags / scope (implementation-defined)
edges (array): relationship edges (graph-layer)
```

#### Breaking Change from v0.1a

- `metadata.author` is now explicitly REQUIRED (not just MUST be non-empty if present)
- Empty or missing `metadata.author` MUST result in validation ERROR

#### Non-Normative Rationale

Separating `created_at` and `committed_at` allows draft or provisional states while preserving the moment at which responsibility becomes binding. Replay and audit rely on `committed_at` as the temporal anchor.

---

### 2.2 Relationship Edge (Minimal)

A Relationship Edge represents a typed, directed structural relationship between decisions.

```
id (string): REQUIRED, stable edge identifier
type (string): relationship type
  Examples: depends_on | overrides | conflicts_with | supports | refutes | supersedes
target (string): referenced decision id
status (string): active | superseded (added in v0.2)

metadata (object, optional):
  reason (string, optional)
  scope (string, optional)
  superseded_by (string, optional): edge id that replaces this edge
  extra (object, optional)
```

#### Breaking Changes from v0.1a

- `edges[].id` is now REQUIRED (not optional)
- `edges[].status` field added to support immutability model

---

## 3) Determinism Rules — **Normative**

### 3.1 Deterministic Retrieval

Given the same graph state and the same structured query, the Core **MUST** return:

- the same result set

- the same ordering


Ordering **MUST** be derived solely from stable, explicit fields
(e.g. `id`, `metadata.committed_at`), and **MUST NOT** depend on insertion order, runtime state, or implementation-specific behavior.

---

### 3.2 No Implicit Inference

The Core **MUST NOT**:

- Create new edges

- Guess missing relationships

- Infer semantic meaning beyond explicit fields


All structure must be explicitly provided.

---

### 3.3 Replay is First-Class

The Core **MUST** support time-based evaluation (`--as-of`) using explicit timestamp fields on nodes.

Replay results **MUST** reflect the graph state as it existed at or before the specified time.

Replay **MUST** account for both **node and edge existence** as of the specified time.

---

## 4) Actor & Commit Requirements — **Normative**

### 4.1 Actor Identity

- Every Decision Node **MUST** declare a **REQUIRED**, non-null, non-empty `metadata.author`

- Missing or empty `metadata.author` **MUST** be treated as **ERROR** (not WARN)

- The Core **MUST** preserve `metadata.author` identity across traversal and replay

- The Core **does not interpret or validate the semantics** of `metadata.author`


---

### 4.2 Commit Immutability — **Breaking Change**

After a Decision Node is committed (i.e., `metadata.committed_at` is set), the Core **MUST NOT** allow modification of:

- `metadata.author`

- `metadata.committed_at`

- `id`

- Any existing edge (edges can only be superseded, not modified or deleted)


#### Edge Immutability After Commit

Once committed, edges **MUST** follow these rules:

1. **No Deletion**: Committed edges **MUST NOT** be deleted

2. **No Modification**: Existing edge properties (type, target, metadata) **MUST NOT** be changed

3. **Supersession Only**: To change a relationship:

    - Add a new edge with a new `id`
    - Mark the old edge's `status` as `superseded`
    - Set `superseded_by` in the old edge's metadata to reference the new edge id
4. **Append-Only**: New edges **MAY** be added to committed nodes


#### Enforcement

Implementations **MUST** enforce immutability via:

- Input validation that rejects modification operations on committed nodes/edges

- Content hashing (optional but recommended)

- Append-only storage architecture


Implementations **MUST NOT** delegate this enforcement solely to Policy layers.
Immutability is a **constitutional requirement**, not a policy preference.

#### Non-Normative Rationale

Decisions without authorship are non-accountable. Replay without actor identity is non-auditable. Mutating authorship or commit time breaks temporal responsibility.

Allowing edge deletion or modification after commit would break:

- Audit trails
- Replay determinism
- Responsibility chains

---

## 5) Edge Identity — **Normative** (upgraded from optional)

### 5.1 Edge ID Requirement

All edges **MUST** include a stable identifier:

```json
"edges": [
  {
    "id": "edge-001",
    "type": "depends_on",
    "target": "SEC-POLICY-2025-004",
    "status": "active",
    "metadata": {
      "reason": "MFA is mandatory"
    }
  }
]
```

#### Breaking Change from v0.1a

- Edge IDs are now REQUIRED, not optional
- Edge status field is REQUIRED

---

### 5.2 Edge ID Rules — **Normative**

- `edges[].id` **MUST** be unique within a Decision Node

- `edges[].id` **MUST** be unique across the entire graph (recommended but not required)

- `edges[].id` **MUST NOT** change after commit

- `edges[].status` **MUST** be either `active` or `superseded`


Changes to relationships **MUST** be represented by:

1. Creating a new edge with a new `id` and `status: active`
2. Setting the old edge's `status` to `superseded`
3. Setting the old edge's `metadata.superseded_by` to the new edge's `id`

#### Non-Normative Rationale

Stable edge identifiers enable precise diffs, signing, attestation, and long-term audit trails without ambiguity.

---

## 6) Validation Levels — **Normative**

Implementations **MUST** expose validation outcomes at least at the following levels:

### ERROR (Exit Code 1)

Graph integrity or determinism is broken. The system **MUST** fail.

Examples:

- Missing or empty `metadata.author` (**upgraded from WARN in v0.1a**)

- Missing or invalid `metadata.created_at`

- Missing or invalid `metadata.committed_at`

- Missing `edges[].id`

- Missing target decision ID

- Circular dependency

- Dependency on a superseded decision (where superseded means `status: superseded`)

- Attempt to modify or delete committed edge

- Hard expiration violation (if supported by extensions)


---

### WARN (Exit Code 0 by Default)

Structurally valid but stale or risky.

Examples:

- Review date exceeded

- External reference drift

- Long-term unchanged core decisions

- Dependency on deprecated (but not superseded) decision


---

### INFO (Exit Code 0)

Hygiene and maintainability signals.

Examples:

- Orphan nodes

- Tag drift

- Potential semantic duplication


Implementations **MAY** offer a `--strict` mode to treat selected WARN conditions as ERROR.

---

## 7) State Model — **Normative**

### 7.1 Node Status

Valid values for `status`:

- `active`: Decision is currently valid and in effect
- `superseded`: Decision has been replaced by another decision
- `deprecated`: Decision is marked for future removal but still referenced

### 7.2 Edge Status

Valid values for `edges[].status`:

- `active`: Edge relationship is currently valid
- `superseded`: Edge has been replaced by another edge

### 7.3 Status Transitions — **Normative**

Allowed transitions:

```
Node: active → superseded
Node: active → deprecated
Node: deprecated → superseded

Edge: active → superseded (ONLY, no deletion)
```

**Forbidden operations:**

- Reverting from `superseded` to `active`
- Deleting edges (must supersede instead)
- Modifying committed edges directly

---

## 8) Interface Boundary — **Normative**

- LLM or probabilistic systems **MAY**:

    - Transform natural language into structured fields (e.g., concept tags)

    - Propose edges or validation suggestions

- The Core **MUST**:

    - Accept only structured inputs

    - Remain fully deterministic


Any probabilistic or generative component **MUST** exist outside the Core.

---

## 9) Conformance

An implementation is considered **Conformant** with this Constitution if and only if it:

- Enforces all **MUST** requirements in Sections 2–8

- Produces deterministic results for identical graph state and queries

- Preserves actor identity and commit immutability across replay

- Rejects operations that violate edge immutability

- Validates required fields (`author`, `edges[].id`) at input time


---

## 10) Migration from v0.1a

### Breaking Changes Summary

1. **Edge IDs are required**: Add unique `id` to all edges
2. **Edge status is required**: Add `status: active` to all edges
3. **Author is required**: Ensure all nodes have `metadata.author`
4. **No edge deletion**: Replace `remove_edge` operations with supersession
5. **Status values standardized**: Use only `active`, `superseded`, `deprecated`

### Migration Steps

For existing graphs:

1. Generate stable IDs for all edges lacking them
2. Add `status: active` to all existing edges
3. Validate that all nodes have `metadata.author`
4. Convert any edge deletions in history to supersessions

---

## 11) Versioning Note — **Non-Normative**

This Constitution intentionally remains minimal.

Domain-specific semantics (law, ADR, research, narrative systems, cognitive tracing, financial compliance) belong to **extension packages**, not to the Core.

The Core defines **structure, responsibility, and replayability — not meaning.**

---

## One-Line Definition

**DecisionGraph Core is a deterministic kernel that records who decided what, when it became binding, and how that decision structurally relates to others — and allows that state to be replayed without interpretation.**

---

## Normative References

This Constitution is the **supreme authority** for DecisionGraph Core.

In case of conflict between this document and any implementation, API specification, or schema definition, **this Constitution takes precedence**.

All compliant implementations, APIs, and schemas MUST cite this Constitution as their normative reference.
