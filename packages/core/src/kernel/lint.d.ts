import type { Graph, Violation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";
export type LintResult = {
    ok: true;
} | {
    ok: false;
    violations: Violation[];
};
export declare function lint(graph: Graph, policy: Policy): LintResult;
//# sourceMappingURL=lint.d.ts.map