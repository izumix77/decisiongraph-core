import type { Graph, Operation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";
import { type KernelError } from "./errors.js";
export type ApplyEvent = {
    type: "applied";
    opType: Operation["type"];
} | {
    type: "rejected";
    opType: Operation["type"];
    error: KernelError;
};
export type ApplyResult = {
    graph: Graph;
    events: ApplyEvent[];
};
export declare const emptyGraph: () => Graph;
export declare function apply(graph: Graph, op: Operation, policy: Policy): ApplyResult;
export declare function applyBatch(graph: Graph, ops: Operation[], policy: Policy): ApplyResult;
//# sourceMappingURL=apply.d.ts.map