import type { Graph, GraphStore, Operation } from "../domain/types.js";
import type { GraphId } from "../domain/ids.js";
import type { Policy } from "../policy/policy.js";
import { ConstitutionalPolicy } from "../policy/constitutional.js";
import { policyError, type KernelError } from "./errors.js";

export type ApplyEvent =
  | { type: "applied"; opType: Operation["type"] }
  | { type: "rejected"; opType: Operation["type"]; error: KernelError };

export type ApplyResult = { store: GraphStore; events: ApplyEvent[] };

// ---- factory functions ----

export const emptyGraph = (graphId: GraphId): Graph => ({
  graphId,
  nodes: {},
  edges: {},
  commits: [],
});

export const emptyStore = (): GraphStore => ({ graphs: {} });

// ---- core apply (GraphStore-based) ----

const constitutionalPolicy = new ConstitutionalPolicy();

export function apply(
  store: GraphStore,
  graphId: GraphId,
  op: Operation,
  policy: Policy
): ApplyResult {
  const graph = store.graphs[String(graphId)];

  if (!graph) {
    // Auto-create Graph if it doesn't exist yet
    const newGraph = emptyGraph(graphId);
    const newStore: GraphStore = {
      graphs: { ...store.graphs, [String(graphId)]: newGraph },
    };
    return apply(newStore, graphId, op, policy);
  }

  // Non-bypassable constitutional enforcement
  const constitutional = constitutionalPolicy.validateOperation(store, graphId, op);
  if (constitutional.length > 0) {
    return {
      store,
      events: [{ type: "rejected", opType: op.type, error: policyError(constitutional) }],
    };
  }

  const violations = policy.validateOperation(store, graphId, op);
  if (violations.length > 0) {
    return {
      store,
      events: [{ type: "rejected", opType: op.type, error: policyError(violations) }],
    };
  }

  // Apply op to the target graph
  const next: Graph = {
    graphId: graph.graphId,
    nodes: { ...graph.nodes },
    edges: { ...graph.edges },
    commits: [...graph.commits],
  };

  if (op.type === "add_node") {
    next.nodes[String(op.node.id)] = op.node;
  } else if (op.type === "add_edge") {
    next.edges[String(op.edge.id)] = op.edge;
  } else if (op.type === "supersede_edge") {
    const old = next.edges[String(op.oldEdgeId)];
    if (old) {
      next.edges[String(op.oldEdgeId)] = { ...old, status: "Superseded" };
    }
    next.edges[String(op.newEdge.id)] = op.newEdge;
  } else if (op.type === "commit") {
    next.commits.push({ commitId: op.commitId, createdAt: op.createdAt, author: op.author });
  } else {
    return {
      store,
      events: [{
        type: "rejected",
        opType: (op as any).type ?? "unknown",
        error: { kind: "UnknownOperation", message: "unknown operation" },
      }],
    };
  }

  const nextStore: GraphStore = {
    graphs: { ...store.graphs, [String(graphId)]: next },
  };

  return { store: nextStore, events: [{ type: "applied", opType: op.type }] };
}

export function applyBatch(
  store: GraphStore,
  graphId: GraphId,
  ops: Operation[],
  policy: Policy
): ApplyResult {
  let s = store;
  const events: ApplyEvent[] = [];
  for (const op of ops) {
    const r = apply(s, graphId, op, policy);
    s = r.store;
    events.push(...r.events);
  }
  return { store: s, events };
}

// ---- GraphLog replay (NEW in v0.3) ----

export type GraphLog = { graphId: GraphId; ops: Operation[] };

export function applyLogs(
  store: GraphStore,
  logs: GraphLog[],
  policy: Policy
): ApplyResult {
  let s = store;
  const events: ApplyEvent[] = [];
  for (const { graphId, ops } of logs) {
    const r = applyBatch(s, graphId, ops, policy);
    s = r.store;
    events.push(...r.events);
  }
  return { store: s, events };
}
