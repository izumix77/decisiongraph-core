import { applyBatch, emptyGraph } from "./apply.js";
export function replay(ops, policy) {
    return applyBatch(emptyGraph(), ops, policy).graph;
}
export function replayAt(ops, commitId, policy) {
    // replay until matching commitId applied (inclusive)
    const g0 = emptyGraph();
    let g = g0;
    for (const op of ops) {
        const r = applyBatch(g, [op], policy);
        g = r.graph;
        if (op.type === "commit" && String(op.commitId) === commitId)
            break;
    }
    return g;
}
//# sourceMappingURL=replay.js.map