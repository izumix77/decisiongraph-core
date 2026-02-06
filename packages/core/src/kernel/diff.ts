import type { Graph } from "../domain/types.js";

export type DiffResult = {
  addedNodes: string[];
  removedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
  changedNodes: string[];
  changedEdges: string[];
};

const keys = (o: Record<string, unknown>) => Object.keys(o).sort();

export function diff(a: Graph, b: Graph): DiffResult {
  const aN = keys(a.nodes);
  const bN = keys(b.nodes);
  const aE = keys(a.edges);
  const bE = keys(b.edges);

  const setA = new Set(aN), setB = new Set(bN);
  const addedNodes = bN.filter(k => !setA.has(k));
  const removedNodes = aN.filter(k => !setB.has(k));
  const changedNodes = aN.filter(k => setB.has(k) && JSON.stringify(a.nodes[k]) !== JSON.stringify(b.nodes[k]));

  const setAE = new Set(aE), setBE = new Set(bE);
  const addedEdges = bE.filter(k => !setAE.has(k));
  const removedEdges = aE.filter(k => !setBE.has(k));
  const changedEdges = aE.filter(k => setBE.has(k) && JSON.stringify(a.edges[k]) !== JSON.stringify(b.edges[k]));

  return { addedNodes, removedNodes, addedEdges, removedEdges, changedNodes, changedEdges };
}
