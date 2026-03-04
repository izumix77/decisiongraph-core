// Constitution v0.4
// Policy interface operates on GraphStore, not single Graph.
// All validation is store-aware to support cross-graph edge resolution
// and topology-based effectiveStatus derivation.

import type { GraphId } from "../domain/ids.js";
import type { GraphStore, Operation, Violation } from "../domain/types.js";

export interface Policy {
  // Per-operation validation. Receives the full store for cross-graph resolution.
  // graphId identifies which Graph this operation targets.
  validateOperation(
    store: GraphStore,
    graphId: GraphId,
    op: Operation
  ): Violation[];

  // Whole-store validation: cross-graph edges, circular dependencies,
  // effectiveStatus-based checks (e.g. DEPENDENCY_ON_SUPERSEDED).
  validateStore(store: GraphStore): Violation[];
}
