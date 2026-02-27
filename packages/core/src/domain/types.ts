import type { AuthorId, CommitId, EdgeId, GraphId, NodeId } from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type NodeStatus = "Active" | "Superseded" | "Deprecated";
export type EdgeStatus = "Active" | "Superseded" | "Deprecated";
export type EdgeType = "depends_on" | "supports" | "refutes" | "overrides" | "supersedes";

export type ViolationSeverity = "ERROR" | "WARN" | "INFO";

export type Node = {
  id: NodeId;
  kind: string;
  status: NodeStatus;
  createdAt: IsoTimestamp;
  author: AuthorId;
  payload?: unknown;
};

export type Edge = {
  id: EdgeId;
  type: EdgeType;
  from: NodeId;   // MAY refer to a Node in a different Graph (cross-graph edge)
  to: NodeId;     // MAY refer to a Node in a different Graph (cross-graph edge)
  status: EdgeStatus;
  createdAt: IsoTimestamp;
  author: AuthorId;
  payload?: unknown;
};

export type Commit = {
  commitId: CommitId;
  createdAt: IsoTimestamp;
  author: AuthorId;
};

export type Graph = {
  graphId: GraphId;              // NEW in v0.3 — stable identifier within GraphStore
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  commits: Commit[];
};

// NEW in v0.3 — top-level container for multiple Graphs
export type GraphStore = {
  graphs: Record<string, Graph>;  // keyed by graphId
};

// NEW in v0.3 — result of cross-graph resolution
export type ResolvedNode = { graphId: GraphId; node: Node };
export type ResolvedEdge = { graphId: GraphId; edge: Edge };

export type AddNodeOp      = { type: "add_node"; node: Node };
export type AddEdgeOp      = { type: "add_edge"; edge: Edge };
export type SupersedeEdgeOp = { type: "supersede_edge"; oldEdgeId: EdgeId; newEdge: Edge };
export type CommitOp       = { type: "commit"; commitId: CommitId; createdAt: IsoTimestamp; author: AuthorId };

export type Operation = AddNodeOp | AddEdgeOp | SupersedeEdgeOp | CommitOp;

export type Violation = {
  code: string;
  message: string;
  severity: ViolationSeverity;
  path?: string;
  payload?: Record<string, string>;
};
