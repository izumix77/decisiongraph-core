# DecisionGraph Core

DecisionGraph Core is a deterministic kernel for recording, traversing, and replaying human decisions as graph assets.

## Non-goals
- No AI reasoning
- No probabilistic behavior
- No random IDs
- No workflow/permissions system (belongs to higher layers)

## Packages
- @decisiongraph/core: pure kernel (no JSON schema, no AJV)
- @decisiongraph/schema: JSON Schema + AJV validator
- @decisiongraph/io-json: JSON <-> core mapping + normalization
- @decisiongraph/cli: CLI wrapper

