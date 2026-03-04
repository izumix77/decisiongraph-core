// Constitution v0.4

import type { GraphId } from "../domain/ids.js";
import type { GraphStore, Operation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";
import { ConstitutionalPolicy } from "../policy/constitutional.js";
import { policyError, type KernelError } from "./errors.js";

export type ApplyEvent =
  | { type: "applied"; opType: Operation["type"] }
  | { type: "rejected"; opType: Operation["type"] | (string & {}); error: KernelError };

export type ApplyResult = { store: GraphStore; events: ApplyEvent[] };

export const emptyStore = (): GraphStore => ({ graphs: {} });

export const emptyGraph = (graphId: GraphId): GraphStore => ({
  graphs: { [String(graphId)]: { graphId, nodes: {}, edges: {}, commits: [] } },
});

const constitutionalPolicy = new ConstitutionalPolicy();

export function apply(
  store: GraphStore,
  graphId: GraphId,
  op: Operation,
  policy: Policy
): ApplyResult {
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

  const graph = store.graphs[String(graphId)];
  if (!graph) {
    return {
      store,
      events: [{
        type: "rejected",
        opType: op.type,
        error: { kind: "UnknownOperation", message: `graphId '${graphId}' not found in store` },
      }],
    };
  }

  const nextGraph = {
    ...graph,
    nodes: { ...graph.nodes },
    edges: { ...graph.edges },
    commits: [...graph.commits],
  };

  if (op.type === "add_node") {
    nextGraph.nodes[String(op.node.id)] = op.node;
  } else if (op.type === "add_edge") {
    nextGraph.edges[String(op.edge.id)] = op.edge;
  } else if (op.type === "supersede_edge") {
    const old = nextGraph.edges[String(op.oldEdgeId)];
    if (old) {
      nextGraph.edges[String(op.oldEdgeId)] = { ...old, status: "Superseded" };
    }
    nextGraph.edges[String(op.newEdge.id)] = op.newEdge;
  } else if (op.type === "commit") {
    nextGraph.commits.push({
      commitId: op.commitId,
      createdAt: op.createdAt,
      author: op.author,
    });
  } else {
    // Exhaustiveness guard — op satisfies never here if Operation union is complete
    const _exhaustive: never = op;
    return {
      store,
      events: [{
        type: "rejected",
        opType: (_exhaustive as { type: string }).type ?? "unknown",
        error: { kind: "UnknownOperation", message: "unknown operation" },
      }],
    };
  }

  const nextStore: GraphStore = {
    graphs: { ...store.graphs, [String(graphId)]: nextGraph },
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
