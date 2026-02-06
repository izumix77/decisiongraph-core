export function lint(graph, policy) {
    const violations = policy.validateGraph(graph);
    if (violations.length > 0)
        return { ok: false, violations };
    return { ok: true };
}
//# sourceMappingURL=lint.js.map