import type { Graph, Operation, Violation } from "../domain/types.js";
export interface Policy {
    validateOperation(graph: Graph, op: Operation): Violation[];
    validateGraph(graph: Graph): Violation[];
}
//# sourceMappingURL=policy.d.ts.map