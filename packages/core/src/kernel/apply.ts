import type { Graph, Operation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";
import { ConstitutionalPolicy } from "../policy/constitutional.js";
import { policyError, type KernelError } from "./errors.js";

export type ApplyEvent =
  | { type: "applied"; opType: Operation["type"] }
  | { type: "rejected"; opType: Operation["type"]; error: KernelError };

export type ApplyResult = { graph: Graph; events: ApplyEvent[] };

export const emptyGraph = (): Graph => ({ nodes: {}, edges: {}, commits: [] });

const constitutionalPolicy = new ConstitutionalPolicy();

export function apply(graph: Graph, op: Operation, policy: Policy): ApplyResult {
  // Non-bypassable constitutional enforcement (runs regardless of caller policy)
  const constitutional = constitutionalPolicy.validateOperation(graph, op);
  if (constitutional.length > 0) {
    return {
      graph,
      events: [{ type: "rejected", opType: op.type, error: policyError(constitutional) }]
    };
  }

  const violations = policy.validateOperation(graph, op);
  if (violations.length > 0) {
    return {
      graph,
      events: [{ type: "rejected", opType: op.type, error: policyError(violations) }]
    };
  }

  const next: Graph = {
    nodes: { ...graph.nodes },
    edges: { ...graph.edges },
    commits: [...graph.commits]
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
      graph,
      events: [{ type: "rejected", opType: (op as any).type ?? "unknown", error: { kind: "UnknownOperation", message: "unknown operation" } }]
    };
  }

  return { graph: next, events: [{ type: "applied", opType: op.type }] };
}

export function applyBatch(graph: Graph, ops: Operation[], policy: Policy): ApplyResult {
  let g = graph;
  const events: ApplyEvent[] = [];
  for (const op of ops) {
    const r = apply(g, op, policy);
    g = r.graph;
    events.push(...r.events);
  }
  return { graph: g, events };
}
