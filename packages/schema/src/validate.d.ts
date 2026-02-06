export type DecisionLogJson = {
    version: "0.2";
    ops: unknown[];
};
export declare function validateDecisionJson(input: unknown): {
    ok: true;
    value: DecisionLogJson;
} | {
    ok: false;
    errors: string[];
};
//# sourceMappingURL=validate.d.ts.map