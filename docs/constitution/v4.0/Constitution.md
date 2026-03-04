# DecisionGraph Core — Constitution v0.4

**Status: RC (Release Candidate)**

**BREAKING CHANGES from v0.3**

- `Node` no longer carries a `status` field; Nodes are bare propositions
- `Superseded` is no longer a stored attribute; it is a **derived structural fact**
- `effectiveStatus` is a read-only concept computed from graph topology — never stored
- `DEPENDENCY_ON_SUPERSEDED` detection uses topology derivation, not stored Node state
- Node status transitions are **abolished**; all stored Node fields are immutable by definition
- `Deprecated` is **removed from Core entirely** — deprecation semantics belong to extension layers
- `overrides` is **removed from EdgeType** — Core EdgeType is now `depends_on | supports | refutes | supersedes`
- Edge `status` is retained as binary `Active | Superseded` — the axiomatic ground of the supersession model
- `Policy` interface now operates on `GraphStore` + `GraphId`, not single `Graph`
- `ApplyResult.graph` renamed to `ApplyResult.store`
- `lint()` and `lintStore()` accept `GraphStore` + `Policy`

---

**DecisionGraph Core is not a search engine.**
It is a deterministic kernel for recording, traversing, and replaying human decisions as
first-class graph assets.

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
  - **derive** (compute `effectiveStatus` of Nodes from graph topology at any replay point)

### Core DOES NOT

- Perform AI reasoning or natural language understanding
- Judge correctness, ethics, or quality of decisions
- Generate content
- Enforce organization-level permissions, approvals, or workflows (belongs to higher layers)
- Store the supersession state of a Node as a mutable attribute
- Interpret the semantic meaning of EdgeTypes beyond structural traversal
- Define or enforce deprecation semantics (belongs to extension layers and policies)

---

## 2) Data Model — **Normative**

The canonical state is a **GraphStore**, which contains one or more **Graphs**.
Each Graph consists of **Nodes**, **Edges**, and **Commits**.

### 2.1 GraphStore (unchanged from v0.3)

A GraphStore **MUST**:

- Maintain a registry of Graphs, each identified by a stable `graphId`
- Support `resolveNode(nodeId)` returning the Node and its owning `graphId`, or null
- Support `resolveEdge(edgeId)` returning the Edge and its owning `graphId`, or null
- Enforce that `graphId` values are unique and stable
- Preserve immutability guarantees per-Graph (see Section 4.2)

A GraphStore **MUST NOT**:

- Allow the same `nodeId` to exist in more than one Graph
- Allow the same `edgeId` to exist in more than one Graph

### 2.2 Graph (unchanged from v0.3)

A Graph **MUST** include:

- `graphId`: stable identifier for this Graph within the GraphStore
- `nodes`: collection of Nodes
- `edges`: collection of Edges (may reference Nodes in other Graphs)
- `commits`: ordered list of Commits

### 2.3 Node — **CHANGED from v0.3**

A Node **MUST** include:

- `id`: stable identifier (unique across the entire GraphStore)
- `kind`: implementation-defined string discriminator
- `createdAt`: RFC3339 / ISO-8601 timestamp
- `author`: REQUIRED, non-empty identifier
- `payload`: opaque to the kernel

A Node **MUST NOT** include a stored `status` field.
Node state is derived from graph topology at evaluation time (see Section 7).

> **Rationale (Non-Normative):** A Node is a proposition — a statement that a decision was
> made, by a specific author, at a specific time. Whether that proposition has been replaced
> is a relational fact between Nodes, not an internal attribute of any single Node.
> Storing `Superseded` as a Node attribute conflates the proposition with its fate,
> breaking append-only invariants and making replay semantics ambiguous.

### 2.4 Edge — **CHANGED from v0.3**

An Edge **MUST** include:

- `id`: stable identifier (unique across the entire GraphStore)
- `type`: one of `depends_on | supports | refutes | supersedes`
- `from`: source Node identifier (MAY refer to a Node in a different Graph)
- `to`: target Node identifier (MAY refer to a Node in a different Graph)
- `status`: one of `Active | Superseded`
- `createdAt`: RFC3339 / ISO-8601 timestamp
- `author`: REQUIRED, non-empty identifier
- `payload`: opaque to the kernel

`overrides` is **removed** from EdgeType.
`Deprecated` is **removed** from Edge status vocabulary.
See Section 5.2 for the rationale behind retaining Edge `status` as a stored axiomatic field.

#### Cross-Graph Edge Rules — **Normative** (unchanged from v0.3)

- An Edge whose `from` or `to` refers to a Node in a different Graph is a **cross-graph edge**
- Cross-graph edges **MUST** be validated by resolving both endpoints across the GraphStore
- If either endpoint cannot be resolved, the Core **MUST** treat this as **ERROR**
- The immutability of the referenced Node is governed by the rules of its **owning Graph**

### 2.5 Commit (unchanged from v0.3)

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

### 3.3 Replay is First-Class (unchanged)

The Core **MUST** support reconstructing **GraphStore** state **as-of a point in history**.

An _as-of_ boundary **MUST** be expressible by at least one of:

- a commit marker (e.g. `commitId`), or
- a timestamp (if supported by the implementation)

Replay results **MUST** reflect the GraphStore state at or before the specified boundary,
including all cross-graph edges valid at that point.

Because `effectiveStatus` is derived from graph topology, `replayAt` **automatically and
correctly** reflects supersession state at any historical boundary — no additional mechanism
is required.

---

## 4) Actor & Commit Requirements — **Normative**

### 4.1 Actor Identity (unchanged)

- Every Node and Edge **MUST** declare a REQUIRED, non-null, non-empty `author`
- Missing or empty `author` **MUST** be treated as **ERROR**
- The Core **MUST** preserve `author` identity across traversal and replay

### 4.2 Commit Immutability — **Normative** (unchanged)

Immutability is enforced **per Graph**.

A Graph is considered **committed** once it contains at least one Commit record.

After the first commit of a Graph, the Core **MUST NOT** allow any operation that mutates
the structural contents of **that Graph**, including:

- Adding, removing, or modifying Nodes within the Graph
- Adding, removing, or modifying Edges **owned by** the Graph
- Changing any Node or Edge identifiers
- Changing authorship or creation timestamps

#### Cross-Graph Edges After Commit (unchanged)

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

### 5.2 Edge Status as Axiomatic Ground — **CHANGED from v0.3**

Edge `status` **MUST** be one of `Active | Superseded`.

This is a **stored, binary field** — the only stored lifecycle state in the entire Core model.

Unlike Node supersession (which is derived from topology per Section 7.1), Edge `status` is
**axiomatic**: it is not derived from further edges. This asymmetry is deliberate.

> **Rationale (Non-Normative):** If Edge supersession were itself expressed as an Edge
> (`E:new --supersedes--> E:old`), determining the validity of that supersession edge would
> require yet another edge — producing infinite regress with no stopping condition.
>
> Edge `status: Active | Superseded` is the **stopping axiom** of the supersession model:
> the point at which derivation ends and ground truth is stored directly.
>
> This mirrors the role of immutable commit objects in version control. The commit object
> itself is not committed by another commit — it is the ground. Every derivation system
> requires at least one axiomatic layer. In DecisionGraph Core, Edge `status` is that layer.
>
> The asymmetry with Nodes is not a design inconsistency. It reflects a genuine ontological
> distinction: Nodes are propositions (their existence is unconditional); Edges are relations
> (their existence is conditional on being active). That conditionality requires a stored
> ground to avoid regress.

Relationship changes **MUST** be represented by the `supersede_edge` operation, not deletion.

A `supersede_edge` operation **MUST** be atomic:

- The old Edge `status` **MUST** be set to `Superseded`, AND
- The new Active Edge **MUST** be added

in a single indivisible transition. A state where only one of these two effects has
occurred is **invalid** and **MUST NOT** be observable by any caller, including under
error or partial-failure conditions.

---

## 6) Validation Levels — **Normative**

### ERROR (Exit Code 1)

- Missing or empty `author` on any Node, Edge, or Commit
- Missing or invalid `createdAt` on any Node, Edge, or Commit
- Missing `id` on any Node or Edge
- Duplicate Node ID, Edge ID, or commitId across the GraphStore
- An edge where `from === to` (`SELF_LOOP`) — **ERROR** regardless of edge type or status
- Circular dependency detected across any Active edges (including `supersedes` cycles);
  self-loops are a degenerate case of circular dependency and **MUST** be detected as such
- A `depends_on` edge (Active) whose target Node has `effectiveStatus = Superseded`
  (derived per Section 7.1 — **not** from stored Node state)
- Attempt to modify committed Nodes or Edges (`IMMUTABLE_AFTER_COMMIT`)
- Cross-graph edge referencing a non-existent Node (`EDGE_NOT_RESOLVED`)
- Invalid `EdgeType` (any value outside `depends_on | supports | refutes | supersedes`)
- Invalid Edge `status` (any value outside `Active | Superseded`)

### WARN (Exit Code 0 by Default)

- Long-term unchanged decisions
- Extension-policy-defined conditions (not enforced by Core)

> **Note:** `Deprecated` is no longer a Core concept. The `DEPENDENCY_ON_DEPRECATED`
> violation code is **removed**. Extension policies MAY define deprecation semantics
> independently via payload fields or domain-specific conventions.

### INFO (Exit Code 0)

- Orphan nodes (no edges)
- Potential structural duplication

Implementations **MAY** offer a `--strict` mode to treat selected WARN conditions as ERROR.

---

## 7) Derived State Model — **Normative** — **CHANGED from v0.3**

Nodes carry **no stored status**. Node state is derived from graph topology at evaluation
time. This section defines the canonical derivation rules that all conformant implementations
**MUST** follow.

### 7.1 effectiveStatus Derivation for Nodes

Given a GraphStore `S` and a NodeId `n`, implementations **MUST** derive `effectiveStatus`
as follows:

```
effectiveStatus(S, n):

  if ∃ edge e in S such that:
      e.type   = "supersedes"
      e.to     = n
      e.status = "Active"

  then → "Superseded"

  else → "Active"
```

**Properties that MUST hold:**

- **Purely structural** — reads only edge topology and the stored Edge `status`;
  never reads any stored Node attribute.
- **Deterministic** — identical GraphStore state always yields identical result.
- **Replay-safe** — `effectiveStatus(replayAt(S, commitId), n)` correctly reflects
  supersession state at that historical boundary without any additional mechanism.
- **Cross-graph aware** — a `supersedes` edge in Graph B participates in deriving the
  `effectiveStatus` of a Node in Graph A.
- **Non-unique successor** — `effectiveStatus` is an existence check only. It does **not**
  guarantee that at most one Active `supersedes` edge points to `n`. Multiple concurrent
  successors are structurally valid; canonicality belongs to higher layers.

### 7.2 Supersession is a Relation, Not a State

The fact that Node B has been superseded by Node A is expressed solely as:

```
N:A  --supersedes-->  N:B
```

The existence of this Active `supersedes` edge is the **sole authority** for the superseded
status of `N:B`. No modification to `N:B` is required or permitted.

Multiple successors are structurally valid:

```
N:fork-a  --supersedes-->  N:original
N:fork-b  --supersedes-->  N:original
```

Both are concurrent revisions. `N:original` has `effectiveStatus = Superseded`.
The kernel does not determine which successor is canonical — that belongs to higher layers.

### 7.3 No Deprecated in Core

`Deprecated` is not a Core concept.

The v0.3 `overrides` EdgeType and the associated `Deprecated` derivation rule are **removed**.
Any semantics resembling "this decision should not be extended but remains referenced" belong
entirely to extension packages, domain policies, or payload conventions.

The Core recognises exactly two states for a Node: `Active` and `Superseded`.

### 7.4 Edge Status Ground (see Section 5.2)

Edge `status` is the axiomatic stopping condition of the model. Only `Active` edges
participate in `effectiveStatus` derivation for Nodes. It is the only stored lifecycle
state in the Core model.

### 7.5 Node Immutability

Because Nodes carry no stored status, there are **no Node status transitions**.
All stored Node fields are immutable after commit.

The only valid mechanism to change a Node's `effectiveStatus` is to add a `supersedes`
edge in a new uncommitted Graph, then commit that Graph.

For Edges, the only valid transition is:

```
Edge: Active → Superseded  (via supersede_edge operation only)
```

**Forbidden:**

- Deleting committed Edges
- Modifying any field of a committed Node or Edge
- Reverting a Superseded Edge to Active

---

## 8) Kernel API Contracts — **Normative** — **CHANGED from v0.3**

This section defines the required API surface that conformant implementations MUST provide.

### 8.1 Policy Interface

```typescript
interface Policy {
  validateOperation(
    store: GraphStore,
    graphId: GraphId,
    op: Operation
  ): Violation[];

  validateStore(store: GraphStore): Violation[];
}
```

- `validateOperation` receives the **full GraphStore** to support cross-graph resolution.
- `validateStore` performs whole-store validation: cross-graph edges, circular dependencies,
  `effectiveStatus`-based checks.
- Implementations **MUST NOT** implement a `validateGraph(graph)` signature as the sole
  Policy method — single-Graph scope is insufficient for v0.4 correctness.

### 8.2 apply / applyBatch

```typescript
type ApplyResult = { store: GraphStore; events: ApplyEvent[] };

function apply(store: GraphStore, graphId: GraphId, op: Operation, policy: Policy): ApplyResult;
function applyBatch(store: GraphStore, graphId: GraphId, ops: Operation[], policy: Policy): ApplyResult;
```

- Returns `store` (not `graph`) — the entire updated GraphStore.
- Constitutional enforcement runs **before** caller policy and is non-bypassable.

### 8.3 lint / lintStore

```typescript
type LintResult = { ok: true } | { ok: false; violations: Violation[] };

function lint(store: GraphStore, graphId: GraphId, policy: Policy): LintResult;
function lintStore(store: GraphStore, policy: Policy): LintResult;
```

- `lintStore` is the primary validation entry point; it covers cross-graph concerns.
- `lint` may scope output to a specific Graph but **MUST** still run store-level checks.

### 8.4 replay / replayAt

```typescript
type GraphLog = { graphId: GraphId; ops: Operation[] };

function replay(logs: GraphLog[], policy: Policy): GraphStore;
function replayAt(logs: GraphLog[], commitId: string, policy: Policy): GraphStore;
```

### 8.5 effectiveStatus

```typescript
function effectiveStatus(store: GraphStore, nodeId: string): "Active" | "Superseded";
```

- **MUST** be a pure function of the GraphStore state.
- **MUST** consider cross-graph `supersedes` edges.
- **MUST NOT** read any stored Node attribute.

---

## 9) Interface Boundary — **Normative** (unchanged)

- Probabilistic or generative systems **MAY** propose structured operations
- The Core **MUST**:
  - Accept only structured inputs
  - Remain fully deterministic
  - Resolve cross-graph references deterministically

Any probabilistic component **MUST** exist outside the Core.

---

## 10) Conformance

An implementation is **Conformant** if and only if it:

- Enforces all **MUST** requirements in Sections 2–9
- Maintains a `GraphStore` as the canonical container
- Does **not** store supersession state as a Node attribute
- Derives `effectiveStatus` from graph topology according to Section 7.1
- Treats Edge `status` as an axiomatic binary field per Section 5.2
- Does **not** recognise `overrides` as a Core EdgeType
- Does **not** enforce `Deprecated` as a Core concept
- Implements `Policy` with the `GraphStore`-based interface per Section 8.1
- Resolves cross-graph Node and Edge references deterministically
- Produces deterministic results for identical inputs
- Preserves actor identity and commit immutability per-Graph across replay
- Rejects operations that violate edge immutability
- Detects and rejects circular dependencies across graph boundaries,
  including supersession cycles (`A supersedes B, B supersedes A`)
- Validates `DEPENDENCY_ON_SUPERSEDED` via `effectiveStatus` derivation per Section 7.1

---

## 11) Migration from v0.3

### Breaking Changes Summary

| # | Area | v0.3 | v0.4 |
|---|---|---|---|
| 1 | Node schema | `status: Active\|Superseded\|Deprecated` | **`status` field removed** |
| 2 | Node supersession | stored `node.status = Superseded` | derived via `effectiveStatus()` |
| 3 | Deprecated concept | Core-level WARN | **removed from Core** |
| 4 | EdgeType | `depends_on\|supports\|refutes\|overrides\|supersedes` | **`overrides` removed** |
| 5 | Edge status | `Active\|Superseded\|Deprecated` | **`Deprecated` removed** |
| 6 | Policy interface | `validateOperation(graph, op)` | `validateOperation(store, graphId, op)` |
| 7 | Policy interface | `validateGraph(graph)` | `validateStore(store)` |
| 8 | ApplyResult | `.graph` | **`.store`** |
| 9 | Violation | `DEPENDENCY_ON_DEPRECATED` | **removed** |

### Non-Breaking

- GraphStore, Graph, and Commit schemas are unchanged.
- All v0.3 operations remain valid: `add_node`, `add_edge`, `supersede_edge`, `commit`.
- Cross-graph edge support is unchanged.
- Circular dependency detection is unchanged (extended to include supersession cycles).
- A single-graph GraphStore remains fully valid.
- The `supersedes` EdgeType is unchanged in meaning.
- `DEPENDENCY_ON_SUPERSEDED` violation code is retained; only its detection logic changes.

### Migration Steps

**Step 1: Remove `status` from Node data**

```json
// v0.3
{ "type": "add_node", "node": { "id": "N:adr-001", "kind": "Decision", "status": "Active", "createdAt": "...", "author": "..." } }

// v0.4
{ "type": "add_node", "node": { "id": "N:adr-001", "kind": "Decision", "createdAt": "...", "author": "..." } }
```

**Step 2: Replace stored `Superseded` node status with a `supersedes` edge**

```json
// v0.3 — stored state on node (REMOVE)
{ "id": "N:adr-001", "status": "Superseded" }

// v0.4 — add a supersedes edge in a new Graph
{
  "type": "add_edge",
  "edge": {
    "id": "E:adr-003-supersedes-adr-001",
    "type": "supersedes",
    "from": "N:adr-003",
    "to": "N:adr-001",
    "status": "Active",
    "createdAt": "...",
    "author": "..."
  }
}
```

**Step 3: Remove or replace `overrides` edges**

Any edge with `type: "overrides"` is invalid in v0.4:
- Remove if the intent was deprecation signalling (now an extension concern).
- Replace with `supersedes` if the intent was actual structural supersession.

**Step 4: Replace `Deprecated` edge status**

Any edge with `status: "Deprecated"` must be retired via `supersede_edge`,
or removed if it carried only deprecation intent now delegated to extensions.

**Step 5: Update Policy implementations**

```typescript
// v0.3
class MyPolicy implements Policy {
  validateOperation(graph: Graph, op: Operation): Violation[] { ... }
  validateGraph(graph: Graph): Violation[] { ... }
}

// v0.4
class MyPolicy implements Policy {
  validateOperation(store: GraphStore, graphId: GraphId, op: Operation): Violation[] { ... }
  validateStore(store: GraphStore): Violation[] { ... }
}
```

**Step 6: Update apply / lint call sites**

```typescript
// v0.3
const result = applyBatch(graph, ops, policy);
result.graph;

// v0.4
const result = applyBatch(store, graphId, ops, policy);
result.store;
```

**Step 7: Update validators — use effectiveStatus()**

```typescript
// v0.3
if (node.status === "Superseded") { ... }

// v0.4
if (effectiveStatus(store, nodeId) === "Superseded") { ... }
```

---

## 12) Design Philosophy — **Non-Normative**

### The Deliberate Asymmetry

v0.4 introduces a deliberate asymmetry:

- **Nodes** have no stored status — supersession is entirely derived from topology.
- **Edges** have a stored binary status — it is the axiomatic ground.

This asymmetry reflects a genuine ontological distinction:

- A **Node** is a proposition. Its existence is unconditional. Whether it has been superseded
  is a relational fact external to the proposition itself. Storing it on the Node would be
  a category error.
- An **Edge** is a relation. Its existence is conditional on being active. That conditionality
  requires a stored ground — otherwise "which edges are active" would require further edges,
  producing infinite regress.

The asymmetry is not a compromise. It is the correct formal structure: one axiomatic layer
(Edge `status`) and one derived layer above it (Node `effectiveStatus`).

### The Scope of Core After v0.4

The Core knows exactly two things about Node state:

1. A Node exists (stored).
2. A Node has been superseded (derived from `supersedes` edge topology).

Everything else — deprecation, approval, maturity, validity scoring, domain lifecycle —
belongs above the kernel. The Core defines the minimum necessary to make supersession
deterministic, replayable, and auditable. No more.

---

## 13) Versioning Note — **Non-Normative**

This Constitution intentionally remains minimal.

Domain-specific semantics belong to **extension packages**, not to the Core.

The Core defines **structure, responsibility, and replayability — not meaning.**

A single-graph GraphStore is fully valid. Multi-graph is an extension of the same model,
not a different model.

---

## One-Line Definition

**DecisionGraph Core is a deterministic kernel that records who decided what, when it became
binding, and how that decision structurally relates to others — deriving all Node state from
topology alone, grounding Edge validity in a stored binary axiom, and replaying that
structure without interpretation.**

---

## Normative References

This Constitution is the **supreme authority** for DecisionGraph Core.

In case of conflict between this document and any implementation, API specification, or schema
definition, **this Constitution takes precedence**.

All compliant implementations **MUST** cite this Constitution as their normative reference.
