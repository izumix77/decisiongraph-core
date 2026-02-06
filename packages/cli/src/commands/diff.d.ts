export declare function cmdDiff(aPath: string, bPath: string): {
    ok: false;
    errors: string[];
    graph?: undefined;
} | {
    ok: true;
    diff: import("@decisiongraph/core").DiffResult;
};
//# sourceMappingURL=diff.d.ts.map