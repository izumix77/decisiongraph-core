# DecisionGraph Core — JSON Schema v0.3

**Normative Reference:** DecisionGraph Core Constitution v0.3
In case of conflict, the Constitution takes precedence.

This document specifies the JSON Schema for the **Decision Log (transport / replay format)** under the multi-graph model introduced in v0.3.

- **Canonical model (Normative):** Node / Edge / GraphStore semantics are defined by the Constitution v0.3.
- **Schema scope (This file):** Validates the log envelope, `graphId` declaration, and minimal op shape.
- **Semantic enforcement:** Performed by the Core + ConstitutionalPolicy at runtime.

---

## decisionlog.v0.3.json

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://decisiongraph.dev/schemas/v0.3/decisionlog.schema.json",
  "title": "DecisionGraph Decision Log v0.3",
  "description": "Transport/replay format: a deterministic sequence of operations belonging to a single Graph within a GraphStore.",
  "type": "object",
  "required": ["version", "graphId", "ops"],
  "properties": {
    "version": {
      "type": "string",
      "const": "0.3"
    },
    "graphId": {
      "type": "string",
      "minLength": 1,
      "description": "Stable identifier for the Graph this log belongs to within the GraphStore."
    },
    "ops": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type"],
        "properties": {
          "type": { "type": "string", "minLength": 1 }
        },
        "additionalProperties": true
      }
    }
  },
  "additionalProperties": false
}
```

---

## Changes from v0.2

| Field | v0.2 | v0.3 |
|---|---|---|
| `version` | `"0.2"` | `"0.3"` |
| `graphId` | — (absent) | REQUIRED |
| `ops` | REQUIRED | REQUIRED (unchanged) |

`graphId` is the key addition. It declares which Graph within the GraphStore this log belongs to,
enabling the kernel to route operations and resolve cross-graph references deterministically.

---

## Example: Single-Graph Log (v0.3)

```json
{
  "version": "0.3",
  "graphId": "G:security-policy",
  "ops": [
    {
      "type": "add_node",
      "node": {
        "id": "N:sec-policy-001",
        "kind": "Decision",
        "status": "Active",
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

---

## Example: Cross-Graph Edge Log (v0.3)

```json
{
  "version": "0.3",
  "graphId": "G:adr-001",
  "ops": [
    {
      "type": "add_node",
      "node": {
        "id": "N:adr-001",
        "kind": "Decision",
        "status": "Active",
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

`N:sec-policy-001` は `G:security-policy` に属するノードへのクロスグラフ参照。
カーネルは GraphStore 全体を横断して解決する。解決できない場合は `EDGE_NOT_RESOLVED` ERROR。

---

## Notes

- This schema is intentionally minimal. Structural validity is the only concern at the schema layer.
- Constitutional constraints (authorship, immutability, supersession, cross-graph resolution,
  circular dependency detection) are enforced by `@decisiongraph/core` and `ConstitutionalPolicy` at runtime.
- A v0.2 log without `graphId` is **not valid** under v0.3. Migration is required (see Migration Guide v0.2 → v0.3).
- A GraphStore may contain logs of different `graphId` values. The kernel routes each log to its owning Graph.

