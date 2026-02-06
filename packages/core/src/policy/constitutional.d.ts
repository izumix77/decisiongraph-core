import type { Policy } from "./policy.js";
import type { Graph, Operation, Violation } from "../domain/types.js";
export declare class ConstitutionalPolicy implements Policy {
    validateOperation(graph: Graph, op: Operation): Violation[];
    validateGraph(_graph: Graph): Violation[];
}
//# sourceMappingURL=constitutional.d.ts.map