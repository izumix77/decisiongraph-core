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

---

## v0.4.1 (2026-03-01)

### Added
- `DEPENDENCY_ON_DEPRECATED` violation code (Constitution Section 6, severity: WARN)
- CLI `--strict` flag — treat WARN as ERROR

### Packages
- `@decisiongraph/core@0.4.1`
- `@decisiongraph/cli@0.1.0` (initial publish)
