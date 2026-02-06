import type { Violation } from "../domain/types.js";
export type KernelError = {
    kind: "PolicyViolation" | "UnknownOperation";
    violations?: Violation[];
    message?: string;
};
export declare const policyError: (violations: Violation[]) => KernelError;
//# sourceMappingURL=errors.d.ts.map