# DecisionGraph Core — Constitution v0.3

**BREAKING CHANGES from v0.2**

- Introduced `GraphStore` as the canonical multi-graph container
- Cross-graph node references are now explicitly supported
- `Graph` immutability is preserved per-graph; cross-graph edges are permitted
- Circular dependency detection is now required across graph boundaries
- `resolveNode` / `resolveEdge` are first-class kernel operations

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

- Store and validate **Decision Nodes** and **Relationship Edges** within and across Graphs
- Maintain a **GraphStore** as the canonical multi-graph container
- Provide deterministic:
  - **search** (filtering by structured fields / tags, across graphs)
  - **traverse** (bounded path traversal over edges, including cross-graph edges)
  - **replay** (reconstruct GraphStore state _as-of_ a boundary)
  - **resolve** (locate any Node or Edge across all Graphs in a GraphStore)

### Core DOES NOT

- Perform AI reasoning or natural language understanding
- Judge correctness, ethics, or quality of decisions
- Generate content
- Enforce organization-level permissions, approvals, or workflows (belongs to higher layers)

---

## 2) Data Model — **Normative**

The canonical state is a **GraphStore**, which contains one or more **Graphs**.
Each Graph consists of **Nodes**, **Edges**, and **Commits**.

### 2.1 GraphStore (NEW)

A GraphStore **MUST**:

- Maintain a registry of Graphs, each identified by a stable `graphId`
- Support `resolveNode(nodeId)` returning the Node and its owning `graphId`, or null
- Support `resolveEdge(edgeId)` returning the Edge and its owning `graphId`, or null
- Enforce that `graphId` values are unique and stable
- Preserve immutability guarantees per-Graph (see Section 4.2)

A GraphStore **MUST NOT**:

- Allow the same `nodeId` to exist in more than one Graph
- Allow the same `edgeId` to exist in more than one Graph

### 2.2 Graph

A Graph **MUST** include:

- `graphId`: stable identifier for this Graph within the GraphStore
- `nodes`: collection of Nodes
- `edges`: collection of Edges (may reference Nodes in other Graphs)
- `commits`: ordered list of Commits

### 2.3 Node (unchanged from v0.2)

A Node **MUST** include:

- `id`: stable identifier (unique across the entire GraphStore)
- `kind`: implementation-defined string discriminator
- `status`: one of `Active | Superseded | Deprecated`
- `createdAt`: RFC3339 / ISO-8601 timestamp
- `author`: REQUIRED, non-empty identifier
- `payload`: opaque to the kernel

### 2.4 Edge

An Edge **MUST** include:

- `id`: stable identifier (unique across the entire GraphStore)
- `type`: one of `depends_on | supports | refutes | overrides | supersedes`
- `from`: source Node identifier (MAY refer to a Node in a different Graph)
- `to`: target Node identifier (MAY refer to a Node in a different Graph)
- `status`: one of `Active | Superseded | Deprecated`
- `createdAt`: RFC3339 / ISO-8601 timestamp
- `author`: REQUIRED, non-empty identifier
- `payload`: opaque to the kernel

#### Cross-Graph Edge Rules — **Normative**

- An Edge whose `from` or `to` refers to a Node in a different Graph is a **cross-graph edge**
- Cross-graph edges **MUST** be validated by resolving both endpoints across the GraphStore
- If either endpoint cannot be resolved, the Core **MUST** treat this as **ERROR**
- The immutability of the referenced Node is governed by the rules of its **owning Graph**

### 2.5 Commit (unchanged from v0.2)

A Commit **MUST** include:

- `commitId`: stable identifier (unique across the entire GraphStore)
- `createdAt`: RFC3339 / ISO-8601 timestamp
- `author`: REQUIRED, non-empty identifier

---

## 3) Determinism Rules — **Normative**

### 3.1 Deterministic Retrieval (unchanged)

Given the same GraphStore state and the same structured query, the Core **MUST** return:

- the same result set
- the same ordering

Ordering **MUST** be derived solely from stable, explicit fields and **MUST NOT** depend on
insertion order, runtime state, or implementation-specific behavior.

### 3.2 No Implicit Inference (unchanged)

The Core **MUST NOT**:

- Create new edges
- Guess missing relationships
- Infer semantic meaning beyond explicit structure

All structure **MUST** be explicitly provided.

### 3.3 Replay is First-Class

The Core **MUST** support reconstructing **GraphStore** state **as-of a point in history**.

An _as-of_ boundary **MUST** be expressible by at least one of:

- a commit marker (e.g. `commitId`), or
- a timestamp (if supported by the implementation)

Replay results **MUST** reflect the GraphStore state at or before the specified boundary,
including all cross-graph edges valid at that point.

---

## 4) Actor & Commit Requirements — **Normative**

### 4.1 Actor Identity (unchanged)

- Every Node and Edge **MUST** declare a REQUIRED, non-null, non-empty `author`
- Missing or empty `author` **MUST** be treated as **ERROR**
- The Core **MUST** preserve `author` identity across traversal and replay

### 4.2 Commit Immutability — **Normative**

Immutability is enforced **per Graph**.

A Graph is considered **committed** once it contains at least one Commit record.

After the first commit of a Graph, the Core **MUST NOT** allow any operation that mutates
the structural contents of **that Graph**, including:

- Adding, removing, or modifying Nodes within the Graph
- Adding, removing, or modifying Edges **owned by** the Graph
- Changing any Node or Edge identifiers
- Changing authorship or creation timestamps

#### Cross-Graph Edges After Commit

A cross-graph edge is **owned by the Graph it was added to**.
After that Graph is committed:

- The cross-graph edge itself is immutable (owned graph's rules apply)
- The **referenced Node** in the other Graph is also immutable (owning graph's rules apply)
- Relationship changes **MUST** be expressed via supersession (`supersede_edge`)

#### Enforcement (unchanged)

Implementations **MUST** enforce commit immutability through a **non-optional constitutional
enforcement mechanism** that is enabled by default and cannot be bypassed in conformant builds.

---

## 5) Edge Identity — **Normative**

### 5.1 Edge ID Requirement (unchanged)

- All Edges **MUST** include a stable `id`
- Edge identifiers **MUST NOT** change after commit
- Edge identifiers **MUST** be unique across the entire GraphStore

### 5.2 Edge Status Rules (unchanged)

- `status` **MUST** be one of `Active | Superseded | Deprecated`
- Relationship changes **MUST** be represented by supersession, not deletion

---

## 6) Validation Levels — **Normative**

### ERROR (Exit Code 1)

- Missing or empty `author`
- Missing or invalid `createdAt`
- Missing Node or Edge identifiers
- Duplicate Node ID, Edge ID, or commitId across the GraphStore
- Circular dependency (within a Graph or across Graphs)
- Dependency on a `Superseded` Node or Edge
- Attempt to modify committed Nodes or Edges
- Cross-graph edge referencing a non-existent Node (**EDGE_NOT_RESOLVED**)

### WARN (Exit Code 0 by Default)

- Long-term unchanged decisions
- Dependency on `Deprecated` decisions (within or across graphs)

### INFO (Exit Code 0)

- Orphan nodes
- Potential structural duplication

Implementations **MAY** offer a `--strict` mode to treat selected WARN conditions as ERROR.

---

## 7) State Model — **Normative**

### 7.1 Node Status (unchanged)

- `Active`: Decision is currently valid
- `Superseded`: Decision has been replaced
- `Deprecated`: Decision remains referenced but should not be extended

### 7.2 Edge Status (unchanged)

- `Active`: Relationship is currently valid
- `Superseded`: Relationship has been replaced
- `Deprecated`: Relationship is retained for reference only

### 7.3 Status Transitions (unchanged)

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
  - Resolve cross-graph references deterministically

Any probabilistic component **MUST** exist outside the Core.

---

## 9) Conformance

An implementation is **Conformant** if and only if it:

- Enforces all **MUST** requirements in Sections 2–8
- Maintains a `GraphStore` as the canonical container
- Resolves cross-graph Node and Edge references deterministically
- Produces deterministic results for identical inputs
- Preserves actor identity and commit immutability per-Graph across replay
- Rejects operations that violate edge immutability
- Detects and rejects circular dependencies across graph boundaries

---

## 10) Migration from v0.2

### Breaking Changes Summary

1. `Graph` is no longer the top-level container; **`GraphStore` is**
2. Node IDs and Edge IDs **MUST** be unique across the entire GraphStore (not just per-graph)
3. Cross-graph edges are now **explicitly supported and validated**
4. `resolveNode` and `resolveEdge` are **required kernel operations**
5. Circular dependency detection is now **required across graph boundaries**

### Non-Breaking

- All v0.2 single-graph operations remain valid within a GraphStore of one Graph
- Node, Edge, and Commit schemas are unchanged
- Status vocabulary is unchanged
- Supersession model is unchanged

---

## 11) Versioning Note — **Non-Normative**

This Constitution intentionally remains minimal.

Domain-specific semantics belong to **extension packages**, not to the Core.

The Core defines **structure, responsibility, and replayability — not meaning.**

A single-graph GraphStore is fully valid. Multi-graph is an extension of the same model,
not a different model.

---

## One-Line Definition

**DecisionGraph Core is a deterministic kernel that records who decided what, when it became
binding, and how that decision structurally relates to others — within and across graph
boundaries — and allows that state to be replayed without interpretation.**

---

## Normative References

This Constitution is the **supreme authority** for DecisionGraph Core.

In case of conflict between this document and any implementation, API specification, or schema
definition, **this Constitution takes precedence**.

All compliant implementations **MUST** cite this Constitution as their normative reference.
