# DecisionGraph Core — JSON Schema v0.2

**Normative Reference:** DecisionGraph Core Constitution v0.2

This document specifies the JSON Schema for the **Decision Log (transport / replay format)**.
It does **not** define the canonical Node/Edge model.

- **Canonical model (Normative):** Node / Edge semantics are defined by the Constitution v0.2.
- **Schema scope (This file):** Validates only the log envelope and minimal op shape.
- **Semantic enforcement:** Performed by the Core + ConstitutionalPolicy at runtime.

---

## decisionlog.v0.2.json

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://decisiongraph.dev/schemas/v0.2/decisionlog.schema.json",
  "title": "DecisionGraph Decision Log v0.2",
  "description": "Transport/replay format: a deterministic sequence of operations.",
  "type": "object",
  "required": ["version", "ops"],
  "properties": {
    "version": { "type": "string", "const": "0.2" },
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

## Example: Valid Decision Log (v0.2)

```json
{
  "version": "0.2",
  "ops": [
    {
      "type": "add_node",
      "node": {
        "id": "N:1",
        "kind": "Decision",
        "status": "Active",
        "createdAt": "2026-02-01T10:00:00.000Z",
        "author": "A:team",
        "payload": { "statement": "Example" }
      }
    },
    {
      "type": "commit",
      "commitId": "C:1",
      "createdAt": "2026-02-01T10:05:00.000Z",
      "author": "A:team"
    }
  ]
}

```

---

## Notes

- This schema is intentionally minimal.

- Constitutional constraints such as:

    - required authorship

    - commit immutability

    - supersession rules

    - valid status transitions
        are enforced by `@decisiongraph/core` and `ConstitutionalPolicy`.
