// Constitution v0.4
// - Node carries no stored status; supersession is derived from topology
// - EdgeStatus is binary: Active | Superseded (axiomatic ground)
// - EdgeType removes "overrides"; Core EdgeTypes are structural only
// - effectiveStatus is a derived read-only concept (see constitutional.ts)
// - GraphStore is the canonical top-level container (introduced v0.3, unchanged v0.4)

import type { AuthorId, CommitId, EdgeId, GraphId, NodeId } from "./ids.js";
import type { IsoTimestamp } from "./time.js";

// Node has no stored status — state is derived from graph topology (Constitution v0.4, Section 7.1)

// "overrides" removed — deprecation semantics belong to extension layers (Constitution v0.4, Section 2.4)
export type EdgeStatus = "Active" | "Superseded";
export type EdgeType = "depends_on" | "supports" | "refutes" | "supersedes";

// Derived Node state — computed by effectiveStatus(), never stored (Constitution v0.4, Section 7.1)
export type EffectiveNodeStatus = "Active" | "Superseded";

export type ViolationSeverity = "ERROR" | "WARN" | "INFO";

export type Node = {
  id: NodeId;
  kind: string;
  // No status field — Constitution v0.4 Section 2.3
  createdAt: IsoTimestamp;
  author: AuthorId;
  payload?: unknown;
};

export type Edge = {
  id: EdgeId;
  type: EdgeType;
  from: NodeId;
  to: NodeId;
  status: EdgeStatus; // Axiomatic ground — Constitution v0.4 Section 5.2
  createdAt: IsoTimestamp;
  author: AuthorId;
  payload?: unknown;
};

export type Commit = {
  commitId: CommitId;
  createdAt: IsoTimestamp;
  author: AuthorId;
};

// graphId is required on Graph (introduced v0.3, unchanged v0.4)
export type Graph = {
  graphId: GraphId;
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  commits: Commit[];
};

// GraphStore is the canonical top-level container (Constitution v0.3+)
export type GraphStore = {
  graphs: Record<string, Graph>;
};

export type AddNodeOp = { type: "add_node"; node: Node };
export type AddEdgeOp = { type: "add_edge"; edge: Edge };
export type SupersedeEdgeOp = { type: "supersede_edge"; oldEdgeId: EdgeId; newEdge: Edge };
export type CommitOp = { type: "commit"; commitId: CommitId; createdAt: IsoTimestamp; author: AuthorId };

export type Operation = AddNodeOp | AddEdgeOp | SupersedeEdgeOp | CommitOp;

export type Violation = {
  code: string;
  message: string;
  severity: ViolationSeverity;
  path?: string;
  payload?: Record<string, string>;
};

export type ResolvedNode = { graphId: GraphId; node: Node };
export type ResolvedEdge = { graphId: GraphId; edge: Edge };
