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
