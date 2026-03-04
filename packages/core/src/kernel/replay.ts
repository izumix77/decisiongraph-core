// Constitution v0.4
// replay / replayAt operate on GraphStore (not single Graph).
//
// Key invariants:
//   - replay() applies all ops from all logs in declaration order
//   - replayAt() applies ops up to and including the commit with the given commitId
//   - commitId is store-wide unique (Constitution v0.4, Section 2.5)
//   - replayAt boundary is store-wide: once the target commitId is seen,
//     ALL remaining ops across ALL logs are dropped
//   - effectiveStatus(replayAt(logs, cid), n) is correct at that boundary
//     because topology derivation reads only the reconstructed store — no cache

import type { GraphId } from "../domain/ids.js";
import type { GraphStore, Operation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";
import { applyBatch, emptyStore } from "./apply.js";

export type GraphLog = {
  graphId: GraphId;
  ops: Operation[];
};

// Replay all logs into a fresh GraphStore.
// Logs are applied in declaration order; each log targets its own graphId.
// The resulting GraphStore is the canonical state after all operations.
//
// ORDERING CONTRACT:
// Logs MUST be provided in deterministic chronological order.
// The declaration order of logs defines the replay time axis.
// createdAt timestamps are preserved for audit purposes but do NOT
// drive replay ordering — only log array position does.
// Callers are responsible for sorting logs before passing them to replay().
export function replay(logs: GraphLog[], policy: Policy): GraphStore {
  // Initialise store with all declared graphs so cross-graph edge resolution
  // works even when a referenced graph has not yet received any ops.
  let store = initStore(logs);
  for (const { graphId, ops } of logs) {
    store = applyBatch(store, graphId, ops, policy).store;
  }
  return store;
}

// Replay logs up to and including the commit identified by commitId.
// commitId is store-wide unique — once it is encountered, no further ops
// from any log are applied.
//
// Boundary semantics (Constitution v0.4, Section 3.3):
//   - ops BEFORE the boundary commit in any log: applied
//   - the boundary commit itself: applied (inclusive)
//   - ops AFTER the boundary commit in any log: dropped
//   - ops in other logs that have not yet seen the boundary: dropped as well
//     (the boundary is a global point-in-time, not per-graph)
export function replayAt(
  logs: GraphLog[],
  commitId: string,
  policy: Policy
): GraphStore {
  let store = initStore(logs);
  let boundaryReached = false;

  outer:
  for (const { graphId, ops } of logs) {
    for (const op of ops) {
      if (boundaryReached) break outer;

      const r = applyBatch(store, graphId, [op], policy);
      store = r.store;

      if (op.type === "commit" && String(op.commitId) === commitId) {
        boundaryReached = true;
        break outer;
      }
    }
  }

  return store;
}

// Initialise a GraphStore with empty graphs for all graphIds in the logs.
// This ensures cross-graph edge resolution does not fail on forward references
// when logs are applied sequentially.
function initStore(logs: GraphLog[]): GraphStore {
  const graphs: GraphStore["graphs"] = {};
  for (const { graphId } of logs) {
    const key = String(graphId);
    if (!graphs[key]) {
      graphs[key] = { graphId, nodes: {}, edges: {}, commits: [] };
    }
  }
  return { graphs };
}
