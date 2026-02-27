import type { Policy } from "./policy.js";
import type { Graph, GraphStore, Operation, Violation } from "../domain/types.js";
import type { GraphId } from "../domain/ids.js";

const v = (
  code: string,
  message: string,
  path?: string,
  severity: Violation["severity"] = "ERROR",
  payload?: Record<string, string>
): Violation => ({
  code,
  message,
  severity,
  ...(path !== undefined ? { path } : {}),
  ...(payload !== undefined ? { payload } : {}),
});

const isValidNodeStatus = (x: unknown) => x === "Active" || x === "Superseded" || x === "Deprecated";
const isValidEdgeStatus = (x: unknown) => x === "Active" || x === "Superseded" || x === "Deprecated";
const isValidEdgeType   = (x: unknown) =>
  x === "depends_on" || x === "supports" || x === "refutes" || x === "overrides" || x === "supersedes";
const isActive = (x: unknown) => x === "Active";

// ---- helpers ----

function resolveNodeInStore(store: GraphStore, nodeId: string): boolean {
  return Object.values(store.graphs).some((g) => nodeId in g.nodes);
}

function resolveEdgeInStore(store: GraphStore, edgeId: string): Graph | undefined {
  return Object.values(store.graphs).find((g) => edgeId in g.edges);
}

// NodeId MUST be globally unique within GraphStore (Constitution v0.3).
function collectAllNodeIds(store: GraphStore): Set<string> {
  const ids = new Set<string>();
  for (const g of Object.values(store.graphs)) {
    for (const id of Object.keys(g.nodes)) ids.add(id);
  }
  return ids;
}

// EdgeId MUST be globally unique within GraphStore (Constitution v0.3).
function collectAllEdgeIds(store: GraphStore): Set<string> {
  const ids = new Set<string>();
  for (const g of Object.values(store.graphs)) {
    for (const id of Object.keys(g.edges)) ids.add(id);
  }
  return ids;
}

// commitId MUST be globally unique within GraphStore (Constitution v0.3).
// GraphStore = one world; commitId = a point in shared time.
// Graph-local commitId uniqueness is intentionally NOT supported in v0.x.
// See: docs/constitution/v0.3 — Commit Scope
function collectAllCommitIds(store: GraphStore): Set<string> {
  const ids = new Set<string>();
  for (const g of Object.values(store.graphs)) {
    for (const c of g.commits) ids.add(String(c.commitId));
  }
  return ids;
}

function findNodeInStore(store: GraphStore, nodeId: string) {
  for (const g of Object.values(store.graphs)) {
    const node = g.nodes[nodeId];
    if (node) return node;
  }
  return null;
}

// Circular dependency detection across graphs using DFS
function detectCycle(store: GraphStore): string | null {
  const adj = new Map<string, string[]>();
  for (const g of Object.values(store.graphs)) {
    for (const e of Object.values(g.edges)) {
      if (e.status !== "Active") continue;
      const from = String(e.from);
      const to   = String(e.to);
      if (!adj.has(from)) adj.set(from, []);
      adj.get(from)!.push(to);
    }
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  let cycleEdge: string | null = null;

  function dfs(node: string): boolean {
    color.set(node, GRAY);
    for (const next of (adj.get(node) ?? [])) {
      if (color.get(next) === GRAY) {
        cycleEdge = `${node} → ${next}`;
        return true;
      }
      if (!color.has(next) || color.get(next) === WHITE) {
        if (dfs(next)) return true;
      }
    }
    color.set(node, BLACK);
    return false;
  }

  for (const nodeId of adj.keys()) {
    if (!color.has(nodeId) || color.get(nodeId) === WHITE) {
      if (dfs(nodeId)) return cycleEdge;
    }
  }
  return null;
}

// ---- ConstitutionalPolicy ----

export class ConstitutionalPolicy implements Policy {
  validateOperation(store: GraphStore, graphId: GraphId, op: Operation): Violation[] {
    const violations: Violation[] = [];
    const graph = store.graphs[String(graphId)];
    const hasCommit = graph ? graph.commits.length > 0 : false;

    const allNodeIds   = collectAllNodeIds(store);
    const allEdgeIds   = collectAllEdgeIds(store);
    const allCommitIds = collectAllCommitIds(store);

    // ---- Immutability after commit (per-Graph)
    const mutationOps: Operation["type"][] = ["add_node", "add_edge", "supersede_edge"];
    if (hasCommit && mutationOps.includes(op.type)) {
      violations.push(v("IMMUTABLE_AFTER_COMMIT", "graph is immutable after commit", "graph.commits"));
    }
    if (hasCommit && op.type === "commit") {
      violations.push(v("COMMIT_ALREADY_EXISTS", "commit already exists", "graph.commits"));
    }

    // ---- add_node
    if (op.type === "add_node") {
      if (!op.node.author)
        violations.push(v("AUTHOR_REQUIRED", "author is required", "op.node.author"));
      if (!op.node.id)
        violations.push(v("NODE_ID_REQUIRED", "node id is required", "op.node.id"));
      if (allNodeIds.has(String(op.node.id)))
        violations.push(v("NODE_ID_DUP", "node id already exists in GraphStore", "op.node.id"));
      if (!isValidNodeStatus(op.node.status))
        violations.push(v("INVALID_NODE_STATUS", "invalid node status", "op.node.status"));
    }

    // ---- add_edge
    if (op.type === "add_edge") {
      if (!op.edge.author)
        violations.push(v("AUTHOR_REQUIRED", "author is required", "op.edge.author"));
      if (!op.edge.id)
        violations.push(v("EDGE_ID_REQUIRED", "edge id is required", "op.edge.id"));
      if (allEdgeIds.has(String(op.edge.id)))
        violations.push(v("EDGE_ID_DUP", "edge id already exists in GraphStore", "op.edge.id"));
      if (!isValidEdgeType(op.edge.type))
        violations.push(v("INVALID_EDGE_TYPE", "invalid edge type", "op.edge.type"));
      if (!isValidEdgeStatus(op.edge.status))
        violations.push(v("INVALID_EDGE_STATUS", "invalid edge status", "op.edge.status"));

      // Cross-graph edge resolution
      const fromExists = resolveNodeInStore(store, String(op.edge.from));
      const toExists   = resolveNodeInStore(store, String(op.edge.to));

      if (!fromExists && graph && !(String(op.edge.from) in graph.nodes)) {
        violations.push(v(
          "EDGE_NOT_RESOLVED",
          `from node '${op.edge.from}' not found in GraphStore`,
          "op.edge.from",
          "ERROR",
          { fromNodeId: String(op.edge.from) }
        ));
      }
      if (!toExists && graph && !(String(op.edge.to) in graph.nodes)) {
        violations.push(v(
          "EDGE_NOT_RESOLVED",
          `to node '${op.edge.to}' not found in GraphStore`,
          "op.edge.to",
          "ERROR",
          { fromNodeId: String(op.edge.from) }
        ));
      }
    }

    // ---- supersede_edge
    if (op.type === "supersede_edge") {
      if (!op.newEdge.author)
        violations.push(v("AUTHOR_REQUIRED", "author is required", "op.newEdge.author"));

      const owningGraph = resolveEdgeInStore(store, String(op.oldEdgeId));
      if (!owningGraph) {
        violations.push(v("EDGE_NOT_FOUND", "oldEdgeId not found in GraphStore", "op.oldEdgeId"));
      } else {
        const oldEdge = owningGraph.edges[String(op.oldEdgeId)];
        if (!isActive(oldEdge.status))
          violations.push(v("EDGE_NOT_ACTIVE", "old edge must be Active to supersede", "op.oldEdgeId"));
      }

      if (String(op.newEdge.id) === String(op.oldEdgeId))
        violations.push(v("SUPERSEDE_REQUIRES_NEW_EDGE_ID", "newEdge.id must differ from oldEdgeId", "op.newEdge.id"));
      if (!op.newEdge.id)
        violations.push(v("EDGE_ID_REQUIRED", "edge id is required", "op.newEdge.id"));
      if (allEdgeIds.has(String(op.newEdge.id)))
        violations.push(v("EDGE_ID_DUP", "edge id already exists in GraphStore", "op.newEdge.id"));
      if (!isValidEdgeType(op.newEdge.type))
        violations.push(v("INVALID_EDGE_TYPE", "invalid edge type", "op.newEdge.type"));
      if (!isValidEdgeStatus(op.newEdge.status))
        violations.push(v("INVALID_EDGE_STATUS", "invalid edge status", "op.newEdge.status"));
      if (!isActive(op.newEdge.status))
        violations.push(v("NEW_EDGE_NOT_ACTIVE", "new edge must be Active", "op.newEdge.status"));
    }

    // ---- commit
    if (op.type === "commit") {
      if (!op.author)
        violations.push(v("AUTHOR_REQUIRED", "author is required", "op.author"));
      if (allCommitIds.has(String(op.commitId)))
        violations.push(v("COMMIT_ID_DUP", "commitId already exists in GraphStore", "op.commitId"));
    }

    violations.sort((a, b) => (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? "")));
    return violations;
  }

  validateStore(store: GraphStore): Violation[] {
    const violations: Violation[] = [];
    const seenNodeIds   = new Set<string>();
    const seenEdgeIds   = new Set<string>();
    const seenCommitIds = new Set<string>();

    for (const [gid, graph] of Object.entries(store.graphs)) {
      // ---- Nodes
      for (const [id, n] of Object.entries(graph.nodes)) {
        if (!n.author)
          violations.push(v("AUTHOR_REQUIRED", "author is required", `graphs.${gid}.nodes.${id}.author`));
        if (!n.id)
          violations.push(v("NODE_ID_REQUIRED", "node id is required", `graphs.${gid}.nodes.${id}.id`));
        const nodeId = String(n.id);
        if (seenNodeIds.has(nodeId)) {
          violations.push(v("NODE_ID_DUP", "node id already exists in GraphStore", `graphs.${gid}.nodes.${id}.id`));
        } else {
          seenNodeIds.add(nodeId);
        }
        if (!isValidNodeStatus(n.status))
          violations.push(v("INVALID_NODE_STATUS", "invalid node status", `graphs.${gid}.nodes.${id}.status`));
      }

      // ---- Edges
      for (const [id, e] of Object.entries(graph.edges)) {
        if (!e.author)
          violations.push(v("AUTHOR_REQUIRED", "author is required", `graphs.${gid}.edges.${id}.author`));
        if (!e.id)
          violations.push(v("EDGE_ID_REQUIRED", "edge id is required", `graphs.${gid}.edges.${id}.id`));
        const edgeId = String(e.id);
        if (seenEdgeIds.has(edgeId)) {
          violations.push(v("EDGE_ID_DUP", "edge id already exists in GraphStore", `graphs.${gid}.edges.${id}.id`));
        } else {
          seenEdgeIds.add(edgeId);
        }
        if (!isValidEdgeType(e.type))
          violations.push(v("INVALID_EDGE_TYPE", "invalid edge type", `graphs.${gid}.edges.${id}.type`));
        if (!isValidEdgeStatus(e.status))
          violations.push(v("INVALID_EDGE_STATUS", "invalid edge status", `graphs.${gid}.edges.${id}.status`));

        // Cross-graph edge resolution + Superseded check（重複防止のため else if で連結）
        const fromResolved = resolveNodeInStore(store, String(e.from));
        const toResolved   = resolveNodeInStore(store, String(e.to));

        if (!fromResolved) {
          violations.push(v(
            "EDGE_NOT_RESOLVED",
            `from node '${e.from}' not found in GraphStore`,
            `graphs.${gid}.edges.${id}.from`,
            "ERROR",
            { fromNodeId: String(e.from) }
          ));
        }

        if (!toResolved) {
          violations.push(v(
            "EDGE_NOT_RESOLVED",
            `to node '${e.to}' not found in GraphStore`,
            `graphs.${gid}.edges.${id}.to`,
            "ERROR",
            { fromNodeId: String(e.from) }
          ));
        } else if (e.status === "Active" && e.type === "depends_on") {
          // toが解決できた場合のみSupersededチェック（EDGE_NOT_RESOLVEDとの重複防止）
          const toNode = findNodeInStore(store, String(e.to));
          if (toNode && toNode.status === "Superseded") {
            violations.push(v(
              "DEPENDENCY_ON_SUPERSEDED",
              `depends_on target '${e.to}' is Superseded`,
              `graphs.${gid}.edges.${id}.to`,
              "ERROR",
              { fromNodeId: String(e.from) }
            ));
          }
        }
      }

      // ---- Commits
      for (const [idx, c] of graph.commits.entries()) {
        const cid = String(c.commitId);
        if (seenCommitIds.has(cid)) {
          violations.push(v("COMMIT_ID_DUP", "commitId already exists in GraphStore", `graphs.${gid}.commits.${idx}.commitId`));
        } else {
          seenCommitIds.add(cid);
        }
      }
    }

    // Circular dependency detection
    const cycle = detectCycle(store);
    if (cycle) {
      violations.push(v("CIRCULAR_DEPENDENCY", `circular dependency detected: ${cycle}`, "store.edges"));
    }

    violations.sort((a, b) => (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? "")));
    return violations;
  }
}
