# DecisionGraph Core — Minimal Kernel API v0.2

**Normative Reference:** DecisionGraph Core Constitution v0.2

This document is subject to DecisionGraph Core Constitution v0.2.
In case of conflict, the Constitution takes precedence.

**Breaking Changes from v0.1:**

- Removed `remove_edge` operation
- Added `supersede_edge` operation
- Required fields enforced in type system
- Aligned with constitutional immutability guarantees

---

## Design Principles

- **Data model is language-independent** (JSON/CBOR/Protobuf transportable)
- **Operations are command sequences (Ops)** (replayable)
- **Evaluation is Lint/Violations only** (no scoring/recommendations)
- **Commit is irreversible** (append-only)
- **Constitution enforcement is mandatory** (not delegated to Policy)

---

## 1) Core Types

### IDs (Determinism: ID generation is external to Kernel or rule-based)

- `NodeId`, `EdgeId`, `ActorId`, `CommitId` are **strings**
- Kernel does NOT generate random IDs (source of non-determinism)

### Node

```typescript
type NodeKind = "claim" | "reference" | "actor";

type NodeStatus = "active" | "superseded" | "deprecated";

type NodeMetadata = {
  author: string;              // REQUIRED, non-empty (Constitution 4.1)
  created_at: string;          // REQUIRED, RFC3339
  committed_at?: string;       // RFC3339, set on commit
};

type Node = {
  id: string;                  // REQUIRED
  kind: NodeKind;
  status: NodeStatus;          // REQUIRED (Constitution 7.1)
  metadata: NodeMetadata;      // REQUIRED
  payload: unknown;            // Kernel does not interpret
};
```

### Edge

```typescript
type EdgeType =
  | "supports"
  | "contradicts"
  | "cites"
  | "requires"
  | "approves"
  | "depends_on"
  | "overrides"
  | "supersedes";

type EdgeStatus = "active" | "superseded";

type EdgeMetadata = {
  reason?: string;
  scope?: string;
  superseded_by?: string;      // EdgeId that replaces this edge
  extra?: unknown;
};

type Edge = {
  id: string;                  // REQUIRED (Constitution 5.1)
  type: EdgeType;              // REQUIRED
  from: string;                // NodeId, REQUIRED
  to: string;                  // NodeId, REQUIRED
  status: EdgeStatus;          // REQUIRED (Constitution 5.2)
  metadata?: EdgeMetadata;
};
```

### Graph

```typescript
type Graph = {
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  // Optional: indexes are derived quantities (reconstructible)
};
```

---

## 2) Operations (Replayable Command Sequence)

**All mutations are expressed as Operations.**
Direct graph manipulation APIs are NOT provided.

```typescript
type Op =
  // Node operations
  | { op: "add_node"; node: Node }
  | { op: "set_node_status"; node_id: string; status: NodeStatus }

  // Edge operations (Constitution-compliant)
  | { op: "add_edge"; edge: Edge }
  | { op: "supersede_edge";
      old_edge_id: string;
      new_edge: Edge;
      reason?: string }

  // Payload operations (Draft only, enforced by Policy)
  | { op: "set_payload"; node_id: string; payload: unknown }

  // Commit operation (irreversible)
  | { op: "commit"; commit_id: string; meta?: unknown };
```

### Breaking Changes from v0.1

**Removed:**

```typescript
// ❌ REMOVED: Violates Constitution 4.2
| { op: "remove_edge"; edge_id: string }
```

**Added:**

```typescript
// ✅ ADDED: Constitution-compliant relationship change
| { op: "supersede_edge"; old_edge_id: string; new_edge: Edge }
```

### Operation Semantics

#### `supersede_edge`

Implements Constitution 4.2 requirement for edge immutability:

1. Validates that `old_edge_id` exists and is `active`
2. Sets old edge's `status` to `superseded`
3. Sets old edge's `metadata.superseded_by` to `new_edge.id`
4. Adds `new_edge` with `status: active`
5. If graph is committed, operation MUST fail (constitutional violation)

---

## 3) Policy (Rule Set)

Kernel supports **pluggable rule engines**.
Evaluation returns **true/false and violations only**.

```typescript
type ViolationSeverity = "error" | "warn" | "info";

type Violation = {
  code: string;               // e.g., "missing_required_author"
  message: string;            // human-readable
  severity: ViolationSeverity;
  subject?: {
    node_id?: string;
    edge_id?: string
  };
};

type Policy = {
  id: string;                 // Version pinning critical for replay

  // Pre-operation validation (prevents forbidden transitions)
  validate_op?: (g: Graph, op: Op) => Violation[];

  // Whole-graph static validation (lint)
  lint: (g: Graph) => Violation[];
};
```

### Constitutional Policy (Built-in, Non-Negotiable)

A reference implementation MUST include a `ConstitutionalPolicy` that enforces:

```typescript
const ConstitutionalPolicy: Policy = {
  id: "constitution-v0.2",

  validate_op: (g: Graph, op: Op): Violation[] => {
    const violations: Violation[] = [];

    // Enforce Constitution 4.2: No modification after commit
    if (isCommitted(g)) {
      if (op.op === "add_edge" ||
          op.op === "supersede_edge" ||
          op.op === "set_payload") {
        violations.push({
          code: "commit_immutability_violation",
          message: "Cannot modify committed graph",
          severity: "error"
        });
      }
    }

    // Enforce Constitution 4.1: Author required
    if (op.op === "add_node" && !op.node.metadata.author) {
      violations.push({
        code: "missing_required_author",
        message: "metadata.author is required",
        severity: "error"
      });
    }

    // Enforce Constitution 5.1: Edge ID required
    if (op.op === "add_edge" && !op.edge.id) {
      violations.push({
        code: "missing_required_edge_id",
        message: "edges[].id is required",
        severity: "error"
      });
    }

    return violations;
  },

  lint: (g: Graph): Violation[] => {
    // ... full graph validation
  }
};
```

---

## 4) Kernel Interface (Minimal)

### 4.1 apply (Deterministic Application)

```typescript
type ApplyResult = {
  graph: Graph;
  violations: Violation[];
  // If violations contain errors, graph MAY remain unchanged
};

interface DecisionGraphKernel {
  apply(
    g: Graph,
    policy: Policy,
    op: Op
  ): ApplyResult;

  apply_batch(
    g: Graph,
    policy: Policy,
    ops: Op[]
  ): ApplyResult;
}
```

**Determinism Guarantee:**
Same `g, policy.id, ops` → Same `graph, violations`

---

### 4.2 lint (Static Validation)

```typescript
type GraphState = "Draft" | "Valid" | "Invalid" | "Committed";

type LintResult = {
  state: GraphState;
  violations: Violation[];
};

interface DecisionGraphKernel {
  lint(g: Graph, policy: Policy): LintResult;
}
```

**State Semantics:**

- `Valid`: `violations.filter(v => v.severity === "error").length === 0`
- `Invalid`: Has error-level violations
- `Committed`: Has `committed_at` set on nodes
- `Draft`: Not committed and may have violations

---

### 4.3 replay (Reconstruction)

```typescript
type ReplayResult = {
  graph: Graph;
  violations: Violation[];  // Past ops may violate current policy
};

interface DecisionGraphKernel {
  replay(
    g0: Graph,           // Initial state
    policy: Policy,
    ops: Op[]
  ): ReplayResult;

  replay_at(
    g0: Graph,
    policy: Policy,
    ops: Op[],
    as_of: string        // RFC3339 timestamp
  ): ReplayResult;
}
```

**Replay Semantics:**

- Applies ops in sequence
- Only includes nodes/edges with `created_at <= as_of`
- Respects `superseded` status at the given timestamp

---

### 4.4 diff (Stable Difference)

Critical for audit, review, and accountability.

```typescript
type GraphDiff = {
  added_nodes: string[];
  removed_nodes: string[];
  added_edges: string[];
  superseded_edges: string[];   // Not "removed" (Constitution 4.2)
  changed_payloads: {
    node_id: string;
    old_payload?: unknown;
    new_payload: unknown;
  }[];
};

interface DecisionGraphKernel {
  diff(a: Graph, b: Graph): GraphDiff;
}
```

---

## 5) Commit Semantics (Responsibility Boundary)

### Minimum Requirements

- `commit` operation sets `metadata.committed_at` on all nodes
- Committed graphs transition to `Committed` state
- `ConstitutionalPolicy` MUST reject all modification operations on committed graphs

### Enforcement Strategy

**Constitution enforcement is NOT optional:**

```typescript
// ✅ CORRECT: Constitutional validation before policy
function apply(g: Graph, policy: Policy, op: Op): ApplyResult {
  // 1. Constitutional validation (non-negotiable)
  const constitutionalViolations =
    ConstitutionalPolicy.validate_op(g, op);

  if (constitutionalViolations.some(v => v.severity === "error")) {
    return { graph: g, violations: constitutionalViolations };
  }

  // 2. Policy validation (domain-specific)
  const policyViolations = policy.validate_op?.(g, op) || [];

  // 3. Apply if valid
  const allViolations = [
    ...constitutionalViolations,
    ...policyViolations
  ];

  if (allViolations.some(v => v.severity === "error")) {
    return { graph: g, violations: allViolations };
  }

  return {
    graph: applyOp(g, op),
    violations: allViolations
  };
}
```

**Key Principle:**

> Policy can add restrictions.
> Policy cannot remove constitutional guarantees.

---

## 6) AI Integration Point (External to Kernel)

AI generates **Op candidates only**.

```typescript
type AISuggestion = {
  ops: Op[];
  rationale?: string;        // Explanation is external; Kernel ignores it
};

type AIAdapter = (
  g: Graph,
  user_input: string
) => Promise<AISuggestion>;
```

**Kernel Integration:**

```typescript
async function processUserInput(
  g: Graph,
  policy: Policy,
  ai: AIAdapter,
  input: string
): Promise<ApplyResult> {
  const suggestion = await ai(g, input);
  return kernel.apply_batch(g, policy, suggestion.ops);
}
```

**Safety Guarantee:**
AI cannot bypass constitutional validation.
Even malicious AI cannot corrupt the graph.

---

## 7) Axiom Compliance

This API design satisfies:

|Axiom|Mechanism|
|---|---|
|Deterministic State|Same inputs → same outputs in `apply/replay`|
|No-Judgment|Only `lint/violations`, no scoring|
|Explicit Structure|Only node/edge operations allowed|
|Finite State|`GraphState` is enumerable|
|Commit Boundary|`ConstitutionalPolicy` enforcement|
|Replay Equivalence|`replay()` function|
|Lintability|`lint()` function|

---

## 8) Research Implications

This API design positions DecisionGraph Core as a **backend compiler** for human judgment:

- **AI = Frontend** (natural language → Ops)
- **Kernel = Backend** (Ops → verified state)
- **Constitution = Type System** (invariants enforced)

This architecture:

- Makes AI substitutable
- Makes judgment auditable
- Makes responsibility localizable

**Academic positioning:**

> We treat judgment not as prediction, but as a replayable state transition.

---

## 9) Migration from v0.1

### Code Changes Required

**Before (v0.1):**

```typescript
{ op: "remove_edge"; edge_id: "edge-123" }
```

**After (v0.2):**

```typescript
{
  op: "supersede_edge",
  old_edge_id: "edge-123",
  new_edge: {
    id: "edge-456",
    type: "depends_on",
    from: "node-A",
    to: "node-B",
    status: "active"
  },
  reason: "Dependency changed due to policy update"
}
```

### Type Changes

All edge and node types now require:

- `edges[].id` (previously optional)
- `edges[].status` (new field)
- `metadata.author` (previously could be missing)

---

## Next Steps

- **Phase 3:** Schema definitions (JSON Schema)
- **Phase 4:** Formal verification of determinism properties
- **Phase 5:** Reference implementation in TypeScript/Rust

---

**Version:** 0.2
**Status:** Normative
**Authority:** DecisionGraph Core Constitution v0.2
