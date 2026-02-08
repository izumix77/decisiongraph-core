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

    - **search** (filtering by structured fields / tags)

    - **traverse** (bounded path traversal over edges)

    - **replay** (reconstruct graph state _as-of_ a boundary)


### Core DOES NOT

- Perform AI reasoning or natural language understanding

- Judge correctness, ethics, or quality of decisions

- Generate content

- Enforce organization-level permissions, approvals, or workflows (belongs to higher layers)


---

## 2) Data Model (Minimal) — **Normative**

The canonical graph state consists of **Nodes**, **Edges**, and **Commits**.

### 2.1 Node (Minimal)

A Node **MUST** include:

- `id`: stable identifier

- `kind`: implementation-defined string discriminator

- `status`: one of `Active | Superseded | Deprecated`

- `createdAt`: RFC3339 / ISO-8601 timestamp

- `author`: REQUIRED, non-empty identifier

- `payload`: opaque to the kernel


### 2.2 Edge (Minimal)

An Edge **MUST** include:

- `id`: stable identifier

- `type`: one of `depends_on | supports | refutes | overrides | supersedes`

- `from`: source Node identifier

- `to`: target Node identifier

- `status`: one of `Active | Superseded | Deprecated`

- `createdAt`: RFC3339 / ISO-8601 timestamp

- `author`: REQUIRED, non-empty identifier

- `payload`: opaque to the kernel


### 2.3 Commit (Minimal)

A Commit **MUST** include:

- `commitId`: stable identifier

- `createdAt`: RFC3339 / ISO-8601 timestamp

- `author`: REQUIRED, non-empty identifier


---

## 3) Determinism Rules — **Normative**

### 3.1 Deterministic Retrieval

Given the same graph state and the same structured query, the Core **MUST** return:

- the same result set

- the same ordering


Ordering **MUST** be derived solely from stable, explicit fields
(e.g. `id`, commit order, or `commitId`)
and **MUST NOT** depend on insertion order, runtime state, or implementation-specific behavior.

---

### 3.2 No Implicit Inference

The Core **MUST NOT**:

- Create new edges

- Guess missing relationships

- Infer semantic meaning beyond explicit structure


All structure **MUST** be explicitly provided.

---

### 3.3 Replay is First-Class

The Core **MUST** support reconstructing graph state **as-of a point in history**.

An _as-of_ boundary **MUST** be expressible by at least one of:

- a commit marker (e.g. `commitId`), or

- a timestamp (if supported by the implementation)


Replay results **MUST** reflect the graph state at or before the specified boundary.

---

## 4) Actor & Commit Requirements — **Normative**

### 4.1 Actor Identity

- Every Node and Edge **MUST** declare a REQUIRED, non-null, non-empty `author`

- Missing or empty `author` **MUST** be treated as **ERROR**

- The Core **MUST** preserve `author` identity across traversal and replay

- The Core **does not interpret or validate the semantics** of `author`


---

### 4.2 Commit Immutability — **Normative**

A graph is considered **committed** once it contains at least one Commit record.

After the first commit, the Core **MUST NOT** allow any operation that mutates
the structural contents of the graph, including:

- Adding, removing, or modifying Nodes

- Adding, removing, or modifying Edges

- Changing any Node or Edge identifiers

- Changing authorship or creation timestamps of Nodes or Edges


#### Relationship Changes After Commit

After commit, relationship changes **MUST** be expressed only via supersession:

1. The existing Edge **MUST** transition to `Superseded`

2. A new Edge with a new identifier **MUST** be added

3. The supersession **MUST** be represented by operation semantics
    (e.g. a `supersede_edge` operation)


Direct deletion or in-place modification of committed Edges is **FORBIDDEN**.

#### Additional Commits

After the first commit, additional Commit records **MAY** be appended.

Such additional commits:

- **MUST NOT** change existing Node or Edge contents

- **MUST NOT** alter replay results

- **MAY** be used for re-anchoring, re-signing, or external attestation


#### Enforcement

Implementations **MUST** enforce commit immutability through a **non-optional constitutional enforcement mechanism**.

This mechanism:

- **MUST** be enabled by default

- **MUST NOT** be removable or bypassable in conformant builds

- **MAY** be implemented as a built-in policy module or equivalent internal mechanism


Commit immutability is a **constitutional requirement**, not an optional policy preference.

---

## 5) Edge Identity — **Normative**

### 5.1 Edge ID Requirement

- All Edges **MUST** include a stable `id`

- Edge identifiers **MUST NOT** change after commit


### 5.2 Edge Status Rules

- `status` **MUST** be one of `Active | Superseded | Deprecated`

- Relationship changes **MUST** be represented by supersession, not deletion


Stable Edge identifiers enable precise diffs, signing, attestation, and long-term audit trails.

---

## 6) Validation Levels — **Normative**

Implementations **MUST** expose validation outcomes at least at the following levels:

### ERROR (Exit Code 1)

Graph integrity or determinism is broken. The system **MUST** fail.

Examples:

- Missing or empty `author`

- Missing or invalid `createdAt`

- Missing Node or Edge identifiers

- Circular dependency

- Dependency on a `Superseded` decision

- Attempt to modify committed Nodes or Edges


---

### WARN (Exit Code 0 by Default)

Structurally valid but stale or risky.

Examples:

- Long-term unchanged decisions

- Dependency on `Deprecated` decisions


---

### INFO (Exit Code 0)

Hygiene and maintainability signals.

Examples:

- Orphan nodes

- Potential structural duplication


Implementations **MAY** offer a `--strict` mode to treat selected WARN conditions as ERROR.

---

## 7) State Model — **Normative**

### 7.1 Node Status

- `Active`: Decision is currently valid

- `Superseded`: Decision has been replaced

- `Deprecated`: Decision remains referenced but should not be extended


### 7.2 Edge Status

- `Active`: Relationship is currently valid

- `Superseded`: Relationship has been replaced

- `Deprecated`: Relationship is retained for reference only


### 7.3 Status Transitions — **Normative**

Allowed transitions:

```
Node: Active → Superseded
Node: Active → Deprecated
Node: Deprecated → Superseded

Edge: Active → Superseded
Edge: Active → Deprecated
```

**Forbidden:**

- Reverting from `Superseded` to `Active`

- Deleting committed Edges

- Modifying committed Nodes or Edges directly


---

## 8) Interface Boundary — **Normative**

- Probabilistic or generative systems **MAY** propose structured operations

- The Core **MUST**:

    - Accept only structured inputs

    - Remain fully deterministic


Any probabilistic component **MUST** exist outside the Core.

---

## 9) Conformance

An implementation is **Conformant** if and only if it:

- Enforces all **MUST** requirements in Sections 2–8

- Produces deterministic results for identical inputs

- Preserves actor identity and commit immutability across replay

- Rejects operations that violate edge immutability


---

## 10) Migration from v0.1a

### Breaking Changes Summary

1. Edge IDs are REQUIRED

2. Edge status is REQUIRED

3. Author is REQUIRED on Nodes and Edges

4. Edge deletion is forbidden; use supersession

5. Status vocabulary standardized


---

## 11) Versioning Note — **Non-Normative**

This Constitution intentionally remains minimal.

Domain-specific semantics belong to **extension packages**, not to the Core.

The Core defines **structure, responsibility, and replayability — not meaning.**

---

## One-Line Definition

**DecisionGraph Core is a deterministic kernel that records who decided what, when it became binding, and how that decision structurally relates to others — and allows that state to be replayed without interpretation.**

---

## Normative References

This Constitution is the **supreme authority** for DecisionGraph Core.

In case of conflict between this document and any implementation, API specification, or schema definition, **this Constitution takes precedence**.

All compliant implementations **MUST** cite this Constitution as their normative reference.
