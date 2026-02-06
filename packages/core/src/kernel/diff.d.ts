import type { Graph } from "../domain/types.js";
export type DiffResult = {
    addedNodes: string[];
    removedNodes: string[];
    addedEdges: string[];
    removedEdges: string[];
    changedNodes: string[];
    changedEdges: string[];
};
export declare function diff(a: Graph, b: Graph): DiffResult;
//# sourceMappingURL=diff.d.ts.map