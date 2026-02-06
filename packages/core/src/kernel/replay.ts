import type { Graph, Operation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";
import { applyBatch, emptyGraph } from "./apply.js";

export function replay(ops: Operation[], policy: Policy): Graph {
  return applyBatch(emptyGraph(), ops, policy).graph;
}

export function replayAt(ops: Operation[], commitId: string, policy: Policy): Graph {
  // replay until matching commitId applied (inclusive)
  const g0 = emptyGraph();
  let g = g0;
  for (const op of ops) {
    const r = applyBatch(g, [op], policy);
    g = r.graph;
    if (op.type === "commit" && String(op.commitId) === commitId) break;
  }
  return g;
}
