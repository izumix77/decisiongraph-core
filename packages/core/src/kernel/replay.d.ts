import type { Graph, Operation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";
export declare function replay(ops: Operation[], policy: Policy): Graph;
export declare function replayAt(ops: Operation[], commitId: string, policy: Policy): Graph;
//# sourceMappingURL=replay.d.ts.map