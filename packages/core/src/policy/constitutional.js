const v = (code, message, path) => (path === undefined ? { code, message } : { code, message, path });
export class ConstitutionalPolicy {
    validateOperation(graph, op) {
        const violations = [];
        const hasCommit = graph.commits.length > 0;
        // author required for mutating ops
        if (op.type === "add_node") {
            if (!op.node.author)
                violations.push(v("AUTHOR_REQUIRED", "author is required", "op.node.author"));
            if (hasCommit)
                violations.push(v("IMMUTABLE_AFTER_COMMIT", "graph is immutable after commit", "graph.commits"));
        }
        if (op.type === "add_edge") {
            if (!op.edge.author)
                violations.push(v("AUTHOR_REQUIRED", "author is required", "op.edge.author"));
            if (hasCommit)
                violations.push(v("IMMUTABLE_AFTER_COMMIT", "graph is immutable after commit", "graph.commits"));
        }
        if (op.type === "supersede_edge") {
            if (!op.newEdge.author)
                violations.push(v("AUTHOR_REQUIRED", "author is required", "op.newEdge.author"));
            if (hasCommit)
                violations.push(v("IMMUTABLE_AFTER_COMMIT", "graph is immutable after commit", "graph.commits"));
            // old edge must exist
            if (!graph.edges[String(op.oldEdgeId)]) {
                violations.push(v("EDGE_NOT_FOUND", "oldEdgeId not found", "op.oldEdgeId"));
            }
        }
        if (op.type === "commit") {
            if (!op.author)
                violations.push(v("AUTHOR_REQUIRED", "author is required", "op.author"));
            // allow multiple commits; append-only
            // but commitId must be unique
            if (graph.commits.some(c => String(c.commitId) === String(op.commitId))) {
                violations.push(v("COMMIT_ID_DUP", "commitId already exists", "op.commitId"));
            }
        }
        // deterministic order
        violations.sort((a, b) => (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? "")));
        return violations;
    }
    validateGraph(_graph) {
        // keep minimal: graph-level checks can be added later
        return [];
    }
}
//# sourceMappingURL=constitutional.js.map