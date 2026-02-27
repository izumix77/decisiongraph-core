import type { GraphStore, Operation } from "../domain/types.js";
import type { GraphId } from "../domain/ids.js";
import type { Policy } from "../policy/policy.js";
import { applyBatch, applyLogs, emptyStore, type GraphLog } from "./apply.js";

// Replay a sequence of GraphLogs into a GraphStore (NEW in v0.3)
export function replay(logs: GraphLog[], policy: Policy): GraphStore {
  return applyLogs(emptyStore(), logs, policy).store;
}

// Replay until (and including) the matching commitId
export function replayAt(logs: GraphLog[], commitId: string, policy: Policy): GraphStore {
  let store = emptyStore();
  outer: for (const { graphId, ops } of logs) {
    for (const op of ops) {
      const r = applyBatch(store, graphId, [op], policy);
      store = r.store;
      if (op.type === "commit" && String(op.commitId) === commitId) break outer;
    }
  }
  return store;
}

// resolve helpers (first-class kernel operations per Constitution v0.3)
export function resolveNode(
  store: GraphStore,
  nodeId: string
): { graphId: GraphId; node: NonNullable<unknown> } | null {
  for (const [gid, graph] of Object.entries(store.graphs)) {
    if (nodeId in graph.nodes) {
      return { graphId: gid as GraphId, node: graph.nodes[nodeId] };
    }
  }
  return null;
}

export function resolveEdge(
  store: GraphStore,
  edgeId: string
): { graphId: GraphId; edge: NonNullable<unknown> } | null {
  for (const [gid, graph] of Object.entries(store.graphs)) {
    if (edgeId in graph.edges) {
      return { graphId: gid as GraphId, edge: graph.edges[edgeId] };
    }
  }
  return null;
}
