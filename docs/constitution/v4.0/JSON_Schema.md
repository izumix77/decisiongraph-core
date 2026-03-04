# DecisionGraph Core — JSON Schema v0.4

**Normative Reference:** DecisionGraph Core Constitution v0.4 RC  
In case of conflict, the Constitution takes precedence.

This document specifies the JSON Schema for the **Decision Log (transport / replay format)**
under the topology-derived state model introduced in v0.4.

- **Canonical model (Normative):** Node / Edge / GraphStore semantics are defined by the Constitution v0.4.
- **Schema scope (This file):** Validates the log envelope, operation shapes, and v0.4 vocabulary constraints.
- **Semantic enforcement:** Performed by `@decisiongraph/core` + `ConstitutionalPolicy` at runtime.

---

## Design Principles

The schema layer enforces **structural validity only**.

What the schema enforces:
- Required fields are present and non-empty
- Enum values are within the v0.4 vocabulary
- Node objects do not contain `status` (v0.4 breaking change)

What the schema does not enforce (runtime only):
- `author` non-empty (checked by `ConstitutionalPolicy`)
- ID uniqueness across GraphStore
- Cross-graph edge resolution
- Circular dependency detection
- Commit immutability

---

## decisionlog.v0.4.schema.json

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://decisiongraph.dev/schemas/v0.4/decisionlog.schema.json",
  "title": "DecisionGraph Decision Log v0.4",
  "description": "Transport/replay format: a deterministic sequence of operations belonging to a single Graph within a GraphStore.",
  "type": "object",
  "required": ["version", "graphId", "ops"],
  "additionalProperties": false,
  "properties": {
    "version": {
      "type": "string",
      "const": "0.4"
    },
    "graphId": {
      "type": "string",
      "minLength": 1,
      "description": "Stable identifier for the Graph this log belongs to within the GraphStore."
    },
    "ops": {
      "type": "array",
      "items": { "$ref": "#/$defs/Operation" }
    }
  },

  "$defs": {

    "IsoTimestamp": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$",
      "description": "RFC3339 / ISO-8601 UTC timestamp."
    },

    "NodeId":   { "type": "string", "minLength": 1 },
    "EdgeId":   { "type": "string", "minLength": 1 },
    "CommitId": { "type": "string", "minLength": 1 },
    "AuthorId": { "type": "string", "minLength": 1 },

    "EdgeType": {
      "type": "string",
      "enum": ["depends_on", "supports", "refutes", "supersedes"],
      "description": "'overrides' was removed in v0.4. Use 'supersedes' instead."
    },

    "EdgeStatus": {
      "type": "string",
      "enum": ["Active", "Superseded"],
      "description": "'Deprecated' was removed in v0.4. Edge status is binary."
    },

    "Node": {
      "type": "object",
      "required": ["id", "kind", "createdAt", "author"],
      "additionalProperties": true,
      "properties": {
        "id":        { "$ref": "#/$defs/NodeId" },
        "kind":      { "type": "string", "minLength": 1 },
        "createdAt": { "$ref": "#/$defs/IsoTimestamp" },
        "author":    { "$ref": "#/$defs/AuthorId" },
        "payload":   {},
        "status": {
          "not": {},
          "description": "Node.status was removed in v0.4. Supersession is expressed via a 'supersedes' edge."
        }
      }
    },

    "Edge": {
      "type": "object",
      "required": ["id", "type", "from", "to", "status", "createdAt", "author"],
      "additionalProperties": true,
      "properties": {
        "id":        { "$ref": "#/$defs/EdgeId" },
        "type":      { "$ref": "#/$defs/EdgeType" },
        "from":      { "$ref": "#/$defs/NodeId" },
        "to":        { "$ref": "#/$defs/NodeId" },
        "status":    { "$ref": "#/$defs/EdgeStatus" },
        "createdAt": { "$ref": "#/$defs/IsoTimestamp" },
        "author":    { "$ref": "#/$defs/AuthorId" },
        "payload":   {}
      }
    },

    "AddNodeOp": {
      "type": "object",
      "required": ["type", "node"],
      "additionalProperties": false,
      "properties": {
        "type": { "type": "string", "const": "add_node" },
        "node": { "$ref": "#/$defs/Node" }
      }
    },

    "AddEdgeOp": {
      "type": "object",
      "required": ["type", "edge"],
      "additionalProperties": false,
      "properties": {
        "type": { "type": "string", "const": "add_edge" },
        "edge": { "$ref": "#/$defs/Edge" }
      }
    },

    "SupersedeEdgeOp": {
      "type": "object",
      "required": ["type", "oldEdgeId", "newEdge"],
      "additionalProperties": false,
      "properties": {
        "type":       { "type": "string", "const": "supersede_edge" },
        "oldEdgeId":  { "$ref": "#/$defs/EdgeId" },
        "newEdge":    { "$ref": "#/$defs/Edge" }
      }
    },

    "CommitOp": {
      "type": "object",
      "required": ["type", "commitId", "createdAt", "author"],
      "additionalProperties": false,
      "properties": {
        "type":      { "type": "string", "const": "commit" },
        "commitId":  { "$ref": "#/$defs/CommitId" },
        "createdAt": { "$ref": "#/$defs/IsoTimestamp" },
        "author":    { "$ref": "#/$defs/AuthorId" }
      }
    },

    "Operation": {
      "oneOf": [
        { "$ref": "#/$defs/AddNodeOp" },
        { "$ref": "#/$defs/AddEdgeOp" },
        { "$ref": "#/$defs/SupersedeEdgeOp" },
        { "$ref": "#/$defs/CommitOp" }
      ]
    }

  }
}
```

---

## Changes from v0.3

| Area | v0.3 | v0.4 |
|---|---|---|
| `version` | `"0.3"` | `"0.4"` |
| `ops` items | minimal shape only (`type` required) | **typed discriminated union** per op |
| `Node.status` | present (Active/Superseded/Deprecated) | **prohibited** (`"not": {}`) |
| `EdgeType` | includes `"overrides"` | **`"overrides"` removed** |
| `EdgeStatus` | Active/Superseded/Deprecated | **`"Deprecated"` removed** — binary only |
| `Node` fields | not validated beyond `type` | required fields validated |
| `Edge` fields | not validated beyond `type` | required fields validated |

### Node.status prohibition

The `"not": {}` keyword rejects any value for `status`:

```json
"status": { "not": {} }
```

A v0.3 log with `node.status: "Active"` will fail schema validation under v0.4.
This is intentional — the schema enforces the v0.4 breaking change at the data layer.

### Why ops are now typed

v0.3 ops were validated only for the presence of `type`.
v0.4 adds per-op shape validation via `oneOf` discriminated union.

This enables:
- VSCode autocompletion for decision log files
- Pre-runtime structural validation (CI schema lint)
- Clear error messages on malformed ops

Semantic constraints (author non-empty, ID uniqueness, cross-graph resolution)
remain in `ConstitutionalPolicy` at runtime.

---

## Example: Single-Graph Log (v0.4)

```json
{
  "version": "0.4",
  "graphId": "G:security-policy",
  "ops": [
    {
      "type": "add_node",
      "node": {
        "id": "N:sec-policy-001",
        "kind": "Decision",
        "createdAt": "2026-01-01T10:00:00.000Z",
        "author": "security-team"
      }
    },
    {
      "type": "commit",
      "commitId": "C:sec-1",
      "createdAt": "2026-01-01T10:05:00.000Z",
      "author": "security-team"
    }
  ]
}
```

Note: `node.status` is absent. This is correct for v0.4.

---

## Example: Cross-Graph Edge Log (v0.4)

```json
{
  "version": "0.4",
  "graphId": "G:adr-001",
  "ops": [
    {
      "type": "add_node",
      "node": {
        "id": "N:adr-001",
        "kind": "Decision",
        "createdAt": "2026-02-01T10:00:00.000Z",
        "author": "dev-team-alpha"
      }
    },
    {
      "type": "add_edge",
      "edge": {
        "id": "E:adr-001-depends-sec",
        "type": "depends_on",
        "from": "N:adr-001",
        "to": "N:sec-policy-001",
        "status": "Active",
        "createdAt": "2026-02-01T10:00:00.000Z",
        "author": "dev-team-alpha"
      }
    },
    {
      "type": "commit",
      "commitId": "C:adr-1",
      "createdAt": "2026-02-01T10:05:00.000Z",
      "author": "dev-team-alpha"
    }
  ]
}
```

`N:sec-policy-001` is a cross-graph reference to a Node in `G:security-policy`.
The schema permits this — cross-graph resolution is enforced at runtime by `ConstitutionalPolicy`.

---

## Example: Supersedes Edge (v0.4)

```json
{
  "version": "0.4",
  "graphId": "G:adr-002",
  "ops": [
    {
      "type": "add_node",
      "node": {
        "id": "N:adr-002",
        "kind": "Decision",
        "createdAt": "2026-03-01T10:00:00.000Z",
        "author": "dev-team-alpha"
      }
    },
    {
      "type": "add_edge",
      "edge": {
        "id": "E:adr-002-supersedes-adr-001",
        "type": "supersedes",
        "from": "N:adr-002",
        "to": "N:adr-001",
        "status": "Active",
        "createdAt": "2026-03-01T10:01:00.000Z",
        "author": "dev-team-alpha"
      }
    },
    {
      "type": "commit",
      "commitId": "C:adr-2",
      "createdAt": "2026-03-01T10:05:00.000Z",
      "author": "dev-team-alpha"
    }
  ]
}
```

`N:adr-001` is now structurally superseded.
`effectiveStatus(store, "N:adr-001")` returns `"Superseded"` at runtime.
No mutation of `N:adr-001` is required or permitted.

---

## Notes

- This schema is intentionally minimal at the semantic layer.
  The schema validates structure; `ConstitutionalPolicy` validates semantics.
- `Node.status` prohibition (`"not": {}`) is a hard boundary.
  Any tooling that generates v0.3 logs must be updated before targeting v0.4.
- A v0.3 log is **not valid** under v0.4. Migration is required (see Migration Guide v0.3 → v0.4).
- `EdgeType: "overrides"` is rejected by the schema.
  Replace with `"supersedes"` or encode domain semantics in `payload`.
- `EdgeStatus: "Deprecated"` is rejected by the schema.
  Retire deprecated edges via `supersede_edge` before migrating.
