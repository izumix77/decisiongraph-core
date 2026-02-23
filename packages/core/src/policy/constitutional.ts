import type { Policy } from "./policy.js";
import type { Graph, Operation, Violation } from "../domain/types.js";

const v = (
  code: string,
  message: string,
  path?: string,
  severity: Violation["severity"] = "ERROR"
): Violation => (path === undefined ? { code, message, severity } : { code, message, severity, path });

const isValidNodeStatus = (x: unknown) => x === "Active" || x === "Superseded" || x === "Deprecated";
const isValidEdgeStatus = (x: unknown) => x === "Active" || x === "Superseded" || x === "Deprecated";
const isValidEdgeType = (x: unknown) =>
  x === "depends_on" || x === "supports" || x === "refutes" || x === "overrides" || x === "supersedes";
const isActive = (x: unknown) => x === "Active";

export class ConstitutionalPolicy implements Policy {
  validateOperation(graph: Graph, op: Operation): Violation[] {
    const violations: Violation[] = [];
    const hasCommit = graph.commits.length > 0;

    // ---- Mutations forbidden after first commit (current Constitution v0.2 in this repo)
    const mutationOps: Operation["type"][] = ["add_node", "add_edge", "supersede_edge"];
    if (hasCommit && mutationOps.includes(op.type)) {
      violations.push(v("IMMUTABLE_AFTER_COMMIT", "graph is immutable after commit", "graph.commits"));
    }
    if (hasCommit && op.type === "commit") {
      violations.push(v("COMMIT_ALREADY_EXISTS", "commit already exists", "graph.commits"));
    }

    // ---- Author required on ops that carry author fields
    if (op.type === "add_node") {
      if (!op.node.author) violations.push(v("AUTHOR_REQUIRED", "author is required", "op.node.author"));
      if (!op.node.id) violations.push(v("NODE_ID_REQUIRED", "node id is required", "op.node.id"));
      if (graph.nodes[String(op.node.id)]) {
        violations.push(v("NODE_ID_DUP", "node id already exists", "op.node.id"));
      }
      if (!isValidNodeStatus(op.node.status))
        violations.push(v("INVALID_NODE_STATUS", "invalid node status", "op.node.status"));
    }

    if (op.type === "add_edge") {
      if (!op.edge.author) violations.push(v("AUTHOR_REQUIRED", "author is required", "op.edge.author"));
      if (!op.edge.id) violations.push(v("EDGE_ID_REQUIRED", "edge id is required", "op.edge.id"));
      if (graph.edges[String(op.edge.id)]) {
        violations.push(v("EDGE_ID_DUP", "edge id already exists", "op.edge.id"));
      }
      if (!isValidEdgeType(op.edge.type)) violations.push(v("INVALID_EDGE_TYPE", "invalid edge type", "op.edge.type"));
      if (!isValidEdgeStatus(op.edge.status))
        violations.push(v("INVALID_EDGE_STATUS", "invalid edge status", "op.edge.status"));
    }

    if (op.type === "supersede_edge") {
      if (!op.newEdge.author) violations.push(v("AUTHOR_REQUIRED", "author is required", "op.newEdge.author"));

      // old edge must exist
      const oldEdge = graph.edges[String(op.oldEdgeId)];
      if (!oldEdge) {
        violations.push(v("EDGE_NOT_FOUND", "oldEdgeId not found", "op.oldEdgeId"));
      } else if (!isActive(oldEdge.status)) {
        violations.push(v("EDGE_NOT_ACTIVE", "old edge must be Active to supersede", "op.oldEdgeId"));
      }

      // new edge id must be different (prevents overwrite)
      if (String(op.newEdge.id) === String(op.oldEdgeId)) {
        violations.push(
          v("SUPERSEDE_REQUIRES_NEW_EDGE_ID", "newEdge.id must differ from oldEdgeId", "op.newEdge.id")
        );
      }

      if (!op.newEdge.id) violations.push(v("EDGE_ID_REQUIRED", "edge id is required", "op.newEdge.id"));
      if (graph.edges[String(op.newEdge.id)]) {
        violations.push(v("EDGE_ID_DUP", "edge id already exists", "op.newEdge.id"));
      }
      if (!isValidEdgeType(op.newEdge.type))
        violations.push(v("INVALID_EDGE_TYPE", "invalid edge type", "op.newEdge.type"));
      if (!isValidEdgeStatus(op.newEdge.status))
        violations.push(v("INVALID_EDGE_STATUS", "invalid edge status", "op.newEdge.status"));
      if (!isActive(op.newEdge.status)) {
        violations.push(v("NEW_EDGE_NOT_ACTIVE", "new edge must be Active", "op.newEdge.status"));
      }
    }

    if (op.type === "commit") {
      if (!op.author) violations.push(v("AUTHOR_REQUIRED", "author is required", "op.author"));
      // only one commit allowed; commitId must be unique
      if (graph.commits.some(c => String(c.commitId) === String(op.commitId))) {
        violations.push(v("COMMIT_ID_DUP", "commitId already exists", "op.commitId"));
      }
    }

    // deterministic order
    violations.sort((a, b) => (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? "")));
    return violations;
  }

  validateGraph(graph: Graph): Violation[] {
    const violations: Violation[] = [];

    // Minimal runtime vocabulary checks (JS inputs may bypass TS)
    const seenNodeIds = new Set<string>();
    const seenEdgeIds = new Set<string>();
    const seenCommitIds = new Set<string>();

    for (const [id, n] of Object.entries(graph.nodes)) {
      if (!n.author) violations.push(v("AUTHOR_REQUIRED", "author is required", `nodes.${id}.author`));
      if (!n.id) violations.push(v("NODE_ID_REQUIRED", "node id is required", `nodes.${id}.id`));
      const nodeId = String(n.id);
      if (seenNodeIds.has(nodeId)) {
        violations.push(v("NODE_ID_DUP", "node id already exists", `nodes.${id}.id`));
      } else {
        seenNodeIds.add(nodeId);
      }
      if (!isValidNodeStatus(n.status))
        violations.push(v("INVALID_NODE_STATUS", "invalid node status", `nodes.${id}.status`));
    }

    for (const [id, e] of Object.entries(graph.edges)) {
      if (!e.author) violations.push(v("AUTHOR_REQUIRED", "author is required", `edges.${id}.author`));
      if (!e.id) violations.push(v("EDGE_ID_REQUIRED", "edge id is required", `edges.${id}.id`));
      const edgeId = String(e.id);
      if (seenEdgeIds.has(edgeId)) {
        violations.push(v("EDGE_ID_DUP", "edge id already exists", `edges.${id}.id`));
      } else {
        seenEdgeIds.add(edgeId);
      }
      if (!isValidEdgeType(e.type)) violations.push(v("INVALID_EDGE_TYPE", "invalid edge type", `edges.${id}.type`));
      if (!isValidEdgeStatus(e.status))
        violations.push(v("INVALID_EDGE_STATUS", "invalid edge status", `edges.${id}.status`));
    }

    for (const [idx, c] of graph.commits.entries()) {
      const cid = String(c.commitId);
      if (seenCommitIds.has(cid)) {
        violations.push(v("COMMIT_ID_DUP", "commitId already exists", `commits.${idx}.commitId`));
      } else {
        seenCommitIds.add(cid);
      }
    }
    if (graph.commits.length > 1) {
      violations.push(v("MULTIPLE_COMMITS", "only one commit is allowed", "graph.commits"));
    }

    violations.sort((a, b) => (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? "")));
    return violations;
  }
}
