import type { GraphStore, Operation, Violation } from "../domain/types.js";
import type { GraphId } from "../domain/ids.js";

export interface Policy {
  // Single-graph operation validation
  validateOperation(store: GraphStore, graphId: GraphId, op: Operation): Violation[];

  // Whole-store validation (cross-graph edges, circular dependencies)
  validateStore(store: GraphStore): Violation[];
}
