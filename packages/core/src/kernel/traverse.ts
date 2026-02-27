import type { NodeId, EdgeId, GraphId } from "../domain/ids.js";
import type { GraphStore, ResolvedNode, ResolvedEdge } from "../domain/types.js";

export type ResolvedPath = {
  nodeId: NodeId;
  graphId: GraphId;
  edgeId?: EdgeId;
  edgeType?: string;
  edgeStatus?: string;
};

/**
 * Trace the dependency path starting from a given Node.
 * Follows `depends_on` / `supersedes` edges across GraphStore.
 * Returns the traversal path as an ordered list of steps.
 */
export function traceDependencyPath(
  store: GraphStore,
  startNodeId: NodeId,
  maxDepth = 10
): ResolvedPath[] {
  const path: ResolvedPath[] = [];
  const visited = new Set<string>();

  // Resolve which graph contains this node
  const findGraph = (nodeId: NodeId) => {
    for (const [graphId, graph] of Object.entries(store.graphs)) {
      if (graph.nodes[String(nodeId)]) {
        return { graphId: graphId as GraphId, graph };
      }
    }
    return null;
  };

  const start = findGraph(startNodeId);
  if (!start) return path;

  path.push({ nodeId: startNodeId, graphId: start.graphId });
  visited.add(String(startNodeId));

  let currentNodeId = startNodeId;
  let depth = 0;

  while (depth < maxDepth) {
    depth++;
    let found = false;

    // Search all graphs for edges FROM currentNode
    for (const [graphId, graph] of Object.entries(store.graphs)) {
      for (const edge of Object.values(graph.edges)) {
        if (
          String(edge.from) === String(currentNodeId) &&
          (edge.type === "depends_on" || edge.type === "supersedes") &&
          !visited.has(String(edge.to))
        ) {
          const target = findGraph(edge.to as NodeId);
          if (!target) continue;

          path.push({
            nodeId: edge.to as NodeId,
            graphId: target.graphId,
            edgeId: edge.id,
            edgeType: edge.type,
            edgeStatus: edge.status,
          });

          visited.add(String(edge.to));
          currentNodeId = edge.to as NodeId;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) break;
  }

  return path;
}

/**
 * For a given violation, build the relevant dependency chain
 * that caused it.
 */
export type ViolationTrace = {
  code: string;
  message: string;
  severity: string;
  path?: string;
  chain: ResolvedPath[];
};

export function buildViolationTraces(
  store: GraphStore,
  violations: Array<{ code: string; message: string; severity: string; path?: string }>
): ViolationTrace[] {
  return violations.map((v) => {
    // Try to extract a nodeId from the violation path
    // e.g. "graphs.G:adr.nodes.N:adr-001.status"
    const nodeMatch = v.path?.match(/nodes\.([^.]+)/);
    const edgeMatch = v.path?.match(/edges\.([^.]+)/);

    let chain: ResolvedPath[] = [];

    if (nodeMatch) {
      const nodeId = nodeMatch[1] as NodeId;
      chain = traceDependencyPath(store, nodeId);
    } else if (edgeMatch) {
      // Find the node that owns this edge and trace from there
      const edgeId = edgeMatch[1] as EdgeId;
      outer: for (const [graphId, graph] of Object.entries(store.graphs)) {
        for (const edge of Object.values(graph.edges)) {
          if (String(edge.id) === edgeId) {
            chain = traceDependencyPath(store, edge.from as NodeId);
            break outer;
          }
        }
      }
    }

    return { ...v, chain };
  });
}
