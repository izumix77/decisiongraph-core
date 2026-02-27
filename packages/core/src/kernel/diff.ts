import type { Graph, GraphStore } from "../domain/types.js";

export type DiffResult = {
  addedNodes: string[];
  removedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
  changedNodes: string[];
  changedEdges: string[];
};

const keys = (o: Record<string, unknown>) => Object.keys(o).sort();

// Diff two individual Graphs (unchanged from v0.2)
export function diff(a: Graph, b: Graph): DiffResult {
  const aN = keys(a.nodes);
  const bN = keys(b.nodes);
  const aE = keys(a.edges);
  const bE = keys(b.edges);

  const setA = new Set(aN), setB = new Set(bN);
  const addedNodes   = bN.filter(k => !setA.has(k));
  const removedNodes = aN.filter(k => !setB.has(k));
  const changedNodes = aN.filter(k => setB.has(k) && JSON.stringify(a.nodes[k]) !== JSON.stringify(b.nodes[k]));

  const setAE = new Set(aE), setBE = new Set(bE);
  const addedEdges   = bE.filter(k => !setAE.has(k));
  const removedEdges = aE.filter(k => !setBE.has(k));
  const changedEdges = aE.filter(k => setBE.has(k) && JSON.stringify(a.edges[k]) !== JSON.stringify(b.edges[k]));

  return { addedNodes, removedNodes, addedEdges, removedEdges, changedNodes, changedEdges };
}

// Diff two GraphStores (cross-graph aware, NEW in v0.3)
export function diffStore(a: GraphStore, b: GraphStore): DiffResult {
  // Flatten all nodes/edges across graphs for comparison
  const flatNodes = (store: GraphStore) =>
    Object.values(store.graphs).reduce((acc, g) => ({ ...acc, ...g.nodes }), {} as Record<string, unknown>);
  const flatEdges = (store: GraphStore) =>
    Object.values(store.graphs).reduce((acc, g) => ({ ...acc, ...g.edges }), {} as Record<string, unknown>);

  const aN = keys(flatNodes(a));
  const bN = keys(flatNodes(b));
  const aE = keys(flatEdges(a));
  const bE = keys(flatEdges(b));

  const setA = new Set(aN), setB = new Set(bN);
  const addedNodes   = bN.filter(k => !setA.has(k));
  const removedNodes = aN.filter(k => !setB.has(k));
  const changedNodes = aN.filter(k => setB.has(k) &&
    JSON.stringify(flatNodes(a)[k]) !== JSON.stringify(flatNodes(b)[k]));

  const setAE = new Set(aE), setBE = new Set(bE);
  const addedEdges   = bE.filter(k => !setAE.has(k));
  const removedEdges = aE.filter(k => !setBE.has(k));
  const changedEdges = aE.filter(k => setBE.has(k) &&
    JSON.stringify(flatEdges(a)[k]) !== JSON.stringify(flatEdges(b)[k]));

  return { addedNodes, removedNodes, addedEdges, removedEdges, changedNodes, changedEdges };
}
