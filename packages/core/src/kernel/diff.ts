// Constitution v0.4
// diff()      — compare two individual Graphs (unchanged from v0.2)
// diffStore() — compare two GraphStores (cross-graph aware, introduced v0.3)

import type { Graph, GraphStore } from "../domain/types.js";

export type DiffResult = {
  addedNodes:   string[];
  removedNodes: string[];
  addedEdges:   string[];
  removedEdges: string[];
  changedNodes: string[];
  changedEdges: string[];
};

const keys = (o: Record<string, unknown>) => Object.keys(o).sort();

// Compare two individual Graphs.
// Used for per-graph diffing; does not cross graph boundaries.
export function diff(a: Graph, b: Graph): DiffResult {
  const aN = keys(a.nodes);
  const bN = keys(b.nodes);
  const aE = keys(a.edges);
  const bE = keys(b.edges);

  const setAN = new Set(aN), setBN = new Set(bN);
  const addedNodes   = bN.filter(k => !setAN.has(k));
  const removedNodes = aN.filter(k => !setBN.has(k));
  const changedNodes = aN.filter(
    k => setBN.has(k) && JSON.stringify(a.nodes[k]) !== JSON.stringify(b.nodes[k])
  );

  const setAE = new Set(aE), setBE = new Set(bE);
  const addedEdges   = bE.filter(k => !setAE.has(k));
  const removedEdges = aE.filter(k => !setBE.has(k));
  const changedEdges = aE.filter(
    k => setBE.has(k) && JSON.stringify(a.edges[k]) !== JSON.stringify(b.edges[k])
  );

  return { addedNodes, removedNodes, addedEdges, removedEdges, changedNodes, changedEdges };
}

// Compare two GraphStores across all graphs.
// Node/Edge IDs are store-wide unique (Constitution v0.4, Section 2.1),
// so the diff is computed over the flattened ID space.
export function diffStore(a: GraphStore, b: GraphStore): DiffResult {
  // Flatten all nodes and edges from all graphs
  const flatNodes = (store: GraphStore): Record<string, unknown> => {
    const acc: Record<string, unknown> = {};
    for (const g of Object.values(store.graphs)) {
      for (const [k, v] of Object.entries(g.nodes)) acc[k] = v;
    }
    return acc;
  };

  const flatEdges = (store: GraphStore): Record<string, unknown> => {
    const acc: Record<string, unknown> = {};
    for (const g of Object.values(store.graphs)) {
      for (const [k, v] of Object.entries(g.edges)) acc[k] = v;
    }
    return acc;
  };

  const aN = flatNodes(a), bN = flatNodes(b);
  const aE = flatEdges(a), bE = flatEdges(b);

  const aNodeKeys = keys(aN), bNodeKeys = keys(bN);
  const aEdgeKeys = keys(aE), bEdgeKeys = keys(bE);

  const setAN = new Set(aNodeKeys), setBN = new Set(bNodeKeys);
  const addedNodes   = bNodeKeys.filter(k => !setAN.has(k));
  const removedNodes = aNodeKeys.filter(k => !setBN.has(k));
  const changedNodes = aNodeKeys.filter(
    k => setBN.has(k) && JSON.stringify(aN[k]) !== JSON.stringify(bN[k])
  );

  const setAE = new Set(aEdgeKeys), setBE = new Set(bEdgeKeys);
  const addedEdges   = bEdgeKeys.filter(k => !setAE.has(k));
  const removedEdges = aEdgeKeys.filter(k => !setBE.has(k));
  const changedEdges = aEdgeKeys.filter(
    k => setBE.has(k) && JSON.stringify(aE[k]) !== JSON.stringify(bE[k])
  );

  return { addedNodes, removedNodes, addedEdges, removedEdges, changedNodes, changedEdges };
}
