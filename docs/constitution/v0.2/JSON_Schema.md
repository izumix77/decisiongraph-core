# DecisionGraph Core — JSON Schema v0.2

**Normative Reference:** DecisionGraph Core Constitution v0.2

This schema enforces constitutional requirements through type validation.

---

## decision.schema.json (v0.2)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://decisiongraph.dev/schemas/v0.2/decision.schema.json",
  "title": "DecisionGraph Decision Node v0.2",
  "description": "A single decision node conformant with DecisionGraph Core Constitution v0.2",

  "type": "object",
  "required": ["id", "type", "status", "metadata", "statement", "edges"],

  "properties": {
    "id": {
      "type": "string",
      "minLength": 1,
      "description": "Unique, stable decision identifier (Constitution 2.1)"
    },

    "type": {
      "type": "string",
      "const": "decision",
      "description": "Node type discriminator"
    },

    "status": {
      "type": "string",
      "enum": ["active", "superseded", "deprecated"],
      "description": "Node lifecycle status (Constitution 7.1)"
    },

    "metadata": {
      "type": "object",
      "required": ["author", "created_at"],
      "properties": {
        "author": {
          "type": "string",
          "minLength": 1,
          "description": "REQUIRED: Decision author/owner (Constitution 4.1)"
        },
        "created_at": {
          "type": "string",
          "format": "date-time",
          "description": "RFC3339 timestamp of creation (Constitution 2.1)"
        },
        "committed_at": {
          "type": "string",
          "format": "date-time",
          "description": "RFC3339 timestamp when decision became immutable (Constitution 4.2)"
        },
        "title": {
          "type": "string",
          "description": "Human-readable title (optional, view layer)"
        }
      },
      "additionalProperties": true
    },

    "statement": {
      "type": "string",
      "minLength": 1,
      "description": "Human-readable decision statement (Constitution 2.1)"
    },

    "concept": {
      "type": "object",
      "properties": {
        "concept_tags": {
          "type": "array",
          "items": {
            "type": "string",
            "pattern": "^[a-z0-9_]+:[a-z0-9_-]+$"
          },
          "description": "Language-free concept identifiers (e.g., 'auth:passwordless')"
        }
      }
    },

    "scope": {
      "type": "object",
      "properties": {
        "domain": {
          "type": "string"
        },
        "system": {
          "type": "string"
        },
        "environment": {
          "type": "string"
        }
      },
      "description": "Decision scope (implementation-defined)"
    },

    "edges": {
      "type": "array",
      "description": "Relationship edges (Constitution 2.2, 5.1)",
      "items": {
        "type": "object",
        "required": ["id", "type", "target", "status"],
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1,
            "description": "REQUIRED: Stable edge identifier (Constitution 5.1)"
          },

          "type": {
            "type": "string",
            "enum": [
              "depends_on",
              "overrides",
              "conflicts_with",
              "supports",
              "refutes",
              "supersedes",
              "cites",
              "requires",
              "approves"
            ],
            "description": "Relationship type (Constitution 2.2)"
          },

          "target": {
            "type": "string",
            "minLength": 1,
            "description": "Referenced decision ID (Constitution 2.2)"
          },

          "status": {
            "type": "string",
            "enum": ["active", "superseded"],
            "description": "Edge lifecycle status (Constitution 5.2, 7.2)"
          },

          "metadata": {
            "type": "object",
            "properties": {
              "reason": {
                "type": "string",
                "description": "Explanation for this relationship"
              },
              "scope": {
                "type": "string",
                "description": "Scope limitation for this relationship"
              },
              "superseded_by": {
                "type": "string",
                "description": "Edge ID that replaces this edge (Constitution 4.2)"
              }
            },
            "additionalProperties": true
          }
        },
        "additionalProperties": false
      }
    },

    "provisional": {
      "type": "object",
      "properties": {
        "review_required_after": {
          "type": "string",
          "format": "date-time",
          "description": "Date after which review is required (generates WARN)"
        }
      }
    }
  },

  "additionalProperties": false
}
```

---

## Example: Valid Decision (v0.2)

```json
{
  "$schema": "https://decisiongraph.dev/schemas/v0.2/decision.schema.json",

  "id": "ADR-2026-001",
  "type": "decision",
  "status": "active",

  "metadata": {
    "title": "Migrate authentication to passkeys",
    "author": "dev-team-alpha",
    "created_at": "2026-02-01T10:00:00Z",
    "committed_at": "2026-02-01T14:30:00Z"
  },

  "statement": "All new user authentication must use passkeys (WebAuthn).",

  "concept": {
    "concept_tags": [
      "auth:authentication",
      "security:passkey",
      "ux:passwordless"
    ]
  },

  "scope": {
    "domain": "authentication",
    "system": "frontend",
    "environment": "production"
  },

  "edges": [
    {
      "id": "edge-001",
      "type": "depends_on",
      "target": "SEC-POLICY-2025-004",
      "status": "active",
      "metadata": {
        "reason": "MFA is mandatory for all user authentication"
      }
    },
    {
      "id": "edge-002",
      "type": "overrides",
      "target": "ADR-2022-010",
      "status": "active",
      "metadata": {
        "reason": "Password-based auth is deprecated"
      }
    }
  ],

  "provisional": {
    "review_required_after": "2027-02-01T00:00:00Z"
  }
}
```

---

## Example: Edge Supersession (v0.2)

**Initial state:**

```json
{
  "edges": [
    {
      "id": "edge-001",
      "type": "depends_on",
      "target": "SEC-POLICY-2025-004",
      "status": "active"
    }
  ]
}
```

**After supersession (Constitution 4.2 compliant):**

```json
{
  "edges": [
    {
      "id": "edge-001",
      "type": "depends_on",
      "target": "SEC-POLICY-2025-004",
      "status": "superseded",
      "metadata": {
        "superseded_by": "edge-003",
        "reason": "Policy updated to SEC-POLICY-2026-001"
      }
    },
    {
      "id": "edge-003",
      "type": "depends_on",
      "target": "SEC-POLICY-2026-001",
      "status": "active",
      "metadata": {
        "reason": "Updated MFA policy requirements"
      }
    }
  ]
}
```

---

## Validation Rules (Constitutional Compliance)

### ERROR Conditions (Must Fail Validation)

```typescript
// Missing required field: author
{
  "metadata": {
    "created_at": "2026-02-01T10:00:00Z"
    // ❌ ERROR: author is required
  }
}

// Empty author
{
  "metadata": {
    "author": "",  // ❌ ERROR: author must be non-empty
    "created_at": "2026-02-01T10:00:00Z"
  }
}

// Missing edge id
{
  "edges": [
    {
      // ❌ ERROR: id is required
      "type": "depends_on",
      "target": "SEC-001",
      "status": "active"
    }
  ]
}

// Missing edge status
{
  "edges": [
    {
      "id": "edge-001",
      "type": "depends_on",
      "target": "SEC-001"
      // ❌ ERROR: status is required
    }
  ]
}

// Invalid status value
{
  "status": "pending"  // ❌ ERROR: must be active|superseded|deprecated
}
```

---

## Breaking Changes from v0.1

|Field|v0.1|v0.2|Migration|
|---|---|---|---|
|`metadata.author`|Optional|**Required**|Add to all nodes|
|`edges[].id`|Optional|**Required**|Generate stable IDs|
|`edges[].status`|N/A|**Required**|Add `"status": "active"`|
|Edge deletion|Allowed|**Forbidden**|Use supersession|
|`status` values|Undefined|**Enum**|Normalize to enum|

---

## Migration Script Example

```javascript
// Migrate v0.1 decision to v0.2
function migrateToV02(oldDecision) {
  const newDecision = { ...oldDecision };

  // 1. Ensure author exists
  if (!newDecision.metadata?.author) {
    throw new Error("Cannot migrate: author is required in v0.2");
  }

  // 2. Add edge IDs if missing
  newDecision.edges = newDecision.edges.map((edge, index) => ({
    ...edge,
    id: edge.id || `edge-${newDecision.id}-${index}`,
    status: edge.status || "active"
  }));

  // 3. Normalize status
  if (!["active", "superseded", "deprecated"].includes(newDecision.status)) {
    newDecision.status = "active";  // Default
  }

  return newDecision;
}
```

---

## Validator Implementation (Reference)

```typescript
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const schema = require("./decision.schema.json");
const validate = ajv.compile(schema);

function validateDecision(decision: unknown): {
  valid: boolean;
  errors: Array<{ path: string; message: string }>;
} {
  const valid = validate(decision);

  if (!valid && validate.errors) {
    return {
      valid: false,
      errors: validate.errors.map(err => ({
        path: err.instancePath,
        message: err.message || "Validation error"
      }))
    };
  }

  return { valid: true, errors: [] };
}

// Usage
const result = validateDecision(myDecision);
if (!result.valid) {
  console.error("Validation errors:", result.errors);
  process.exit(1);
}
```

---

## Next: CLI Validation Tool

The schema enables automated validation:

```bash
decisiongraph validate ./decisions --schema v0.2
```

Output:

```
✖ ERROR: Constitutional violation in ADR-2026-005
  - Missing required field: metadata.author
  - Edge edge-002 missing required field: status

Summary:
  Files validated: 15
  Errors: 2
  Warnings: 0

Result: FAILED (exit code 1)
```

---

**Version:** 0.2
**Status:** Normative
**Authority:** DecisionGraph Core Constitution v0.2
**Schema Format:** JSON Schema Draft 2020-12
