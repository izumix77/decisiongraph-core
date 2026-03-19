# Changelog

All notable changes to this project will be documented in this file.

---

## v0.4.4 (2026-03-20)

### Fixed
- `@decisiongraph/schema`: `files` field added to `package.json` — `schemas/` directory was missing from npm published package
- `@decisiongraph/schema`: v0.4 schema upgraded to full implementation — typed discriminated union (`AddNodeOp` / `AddEdgeOp` / `SupersedeEdgeOp` / `CommitOp`) and `Node.status` prohibition (`"not": {}`) now enforced at schema layer
- `@decisiongraph/io-json` / `@decisiongraph/cli`: `workspace:*` dependencies were not resolved on publish — replaced with explicit version ranges

### Packages
- `@decisiongraph/schema@0.2.2`
- `@decisiongraph/io-json@0.2.2`
- `@decisiongraph/cli@0.1.5`

---

## v0.4.4 (2026-03-05)

### Fixed
- `@decisiongraph/cli`: `cmdLint` now uses `emptyGraph(graphId)` instead of `emptyStore()` — graph must exist before ops are applied
- `@decisiongraph/cli`: `cmdLintDir` now initializes each graph in store before `applyBatch`
- `@decisiongraph/schema`: v0.4 JSON Schema added (`schemas/v0.4/decision.schema.json`)
- `@decisiongraph/io-json`: `version.ts` updated — `"0.4"` added to `SUPPORTED_VERSIONS`, `CURRENT_SCHEMA_VERSION` set to `"0.4"`
- `decisions/demo.json` updated to v0.4 format (`version: "0.4"`, `graphId` added)
- CI `decision-lint.yml`: `pnpm install` (was `pnpm -w install`) for full workspace resolution
- All workspace dependencies use `workspace:*` for consistent turbo build ordering in CI

### Packages
- `@decisiongraph/core@0.4.2`
- `@decisiongraph/schema@0.2.0`
- `@decisiongraph/io-json@0.2.0`
- `@decisiongraph/cli@0.1.3`

---

## v0.4.3 (2026-03-05)

### Breaking Changes
- `Node.status` removed — supersession is now topology-derived via `effectiveStatus(store, nodeId)`
- `NodeStatus` type removed from public API
- `EdgeStatus` simplified to binary: `"Active" | "Superseded"` (`"Deprecated"` removed)
- `EdgeType` removes `"overrides"` — use `"supersedes"` for replacement relationships
- `supersede_node` op removed — supersession is expressed via `supersedes` edges only
- `DEPENDENCY_ON_DEPRECATED` violation removed (Deprecated status on nodes removed)
- All kernel functions now require `GraphStore` + `GraphId` (no single-Graph overloads)

### Added
- `effectiveStatus(store, nodeId): "Active" | "Superseded"` — topology-derived, sole authority for node supersession
- `SELF_LOOP` violation code — edge from a node to itself is rejected
- `supersede_edge` atomicity guarantee — old edge marked Superseded and new edge added in single operation
- `ResolvedNode` / `ResolvedEdge` types exported from `@decisiongraph/core`
- `emptyGraph(graphId)` helper for single-graph store initialization
- Golden fixtures C01–C20 covering all v0.4 constitutional invariants
- `io-json/decode.ts` updated to v0.4 (Node.status removed, supersede_node removed)

### Fixed
- `fixtures.test.ts`: store initialized with `emptyGraph(graphId)` to ensure graph exists before ops
- All v0.2 golden fixtures updated to v0.4 format (node.status removed, edge.status added)
- `core.test.ts`: node.status removed from all test data

### Packages
- `@decisiongraph/core@0.4.2`
- `@decisiongraph/io-json@0.2.0`

---

## v0.4.2 (2026-03-02)

### Fixed
- `@decisiongraph/cli`: `workspace:*` dependencies resolved to explicit versions for npm publish
- `@decisiongraph/io-json`: `workspace:*` dependencies resolved to explicit versions for npm publish
- Added `.npmrc` to root (`link-workspace-packages=false`) to prevent `workspace:*` from leaking into published packages

### Changed
- `scripts/validate-decisions.mjs`: updated to v0.3 GraphStore API (`emptyStore`, `applyBatch(store, graphId, ops, policy)`)
- `scripts/validate-decisions.mjs`: added ANSI color output with `NO_COLOR` / `--no-color` support
- `scripts/validate-decisions.mjs`: added `lintStore` call after all files applied to detect `DEPENDENCY_ON_SUPERSEDED` and `DEPENDENCY_ON_DEPRECATED`
- README: added Quick Start section (CLI-first)
- README_ja: added クイックスタート section
- ROADMAP: removed duplicate Phase 3b section; updated Phase 4 CLI items

### Packages
- `@decisiongraph/io-json@0.1.1`
- `@decisiongraph/cli@0.1.2`

---

## v0.4.1 (2026-03-01)

### Added
- `DEPENDENCY_ON_DEPRECATED` violation code (Constitution Section 6, severity: WARN)
- CLI `--strict` flag — treat WARN as ERROR

### Packages
- `@decisiongraph/core@0.4.1`
- `@decisiongraph/cli@0.1.0` (initial publish)

---

## v0.3.1

### Breaking Changes
- `Graph` now requires `graphId`
- `applyBatch`, `lint`, `replay` signatures updated to accept `GraphStore` and `GraphId`
- All IDs (`NodeId`, `EdgeId`, `CommitId`) are now GraphStore-wide unique

### Added
- `GraphStore` as top-level container (`GraphStore = one world`)
- `GraphId` branded type
- `lintStore` for store-wide cross-graph validation
- `resolveNode` / `resolveEdge` as first-class kernel operations
- `EDGE_NOT_RESOLVED` violation code for unresolvable cross-graph references
- `CIRCULAR_DEPENDENCY` violation code (DFS across graph boundaries)
- `DEPENDENCY_ON_SUPERSEDED` violation code (Constitution Section 6)
- CLI `traverse <directory>` command with violation tree display
- `Violation.payload` for structured context (`fromNodeId`)
- `traceDependencyPath` kernel function for chain traversal

### Design Decisions
- **commitId scope: GraphStore-global**
  - GraphStore = one world; commitId = a point in shared time
  - `replayAt(commitId)` is deterministic across all graphs
  - Graph-local commitId uniqueness intentionally not supported in v0.x
  - Cross-graph fixture runner deferred to Phase 3b
