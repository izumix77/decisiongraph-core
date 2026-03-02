# Changelog

All notable changes to this project will be documented in this file.

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
