# Example: Broken Graphs (Violation Detection)

This example demonstrates violation detection in DecisionGraph Core.
All files in this directory are **intentionally invalid** — they exist to verify
that `decisiongraph traverse` correctly reports errors.

## Running
```bash
npx decisiongraph traverse ./decisions
```

Expected output:
```
✖ [01-depends-on-superseded.decisionlog.json] DEPENDENCY_ON_SUPERSEDED
✖ [02-circular-dependency.decisionlog.json] CIRCULAR_DEPENDENCY
✖ Validation failed  (2 error(s))
```

## What this shows

| File | Violation | Description |
|------|-----------|-------------|
| `01-depends-on-superseded.decisionlog.json` | `DEPENDENCY_ON_SUPERSEDED` | An Active `depends_on` edge targets a topology-superseded Node |
| `02-circular-dependency.decisionlog.json` | `CIRCULAR_DEPENDENCY` | Three nodes form a cycle: A → C → B → A |

## Note

These files are not meant to be replayed in production.
They exist solely as fixtures for CLI and policy validation testing.
