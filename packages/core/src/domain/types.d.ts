import type { AuthorId, CommitId, EdgeId, NodeId } from "./ids.js";
import type { IsoTimestamp } from "./time.js";
export type NodeStatus = "Active" | "Superseded" | "Deprecated";
export type EdgeStatus = "Active" | "Superseded" | "Deprecated";
export type EdgeType = "depends_on" | "supports" | "refutes" | "overrides" | "supersedes";
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
    from: NodeId;
    to: NodeId;
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
    nodes: Record<string, Node>;
    edges: Record<string, Edge>;
    commits: Commit[];
};
export type AddNodeOp = {
    type: "add_node";
    node: Node;
};
export type AddEdgeOp = {
    type: "add_edge";
    edge: Edge;
};
export type SupersedeEdgeOp = {
    type: "supersede_edge";
    oldEdgeId: EdgeId;
    newEdge: Edge;
};
export type CommitOp = {
    type: "commit";
    commitId: CommitId;
    createdAt: IsoTimestamp;
    author: AuthorId;
};
export type Operation = AddNodeOp | AddEdgeOp | SupersedeEdgeOp | CommitOp;
export type Violation = {
    code: string;
    message: string;
    path?: string;
};
//# sourceMappingURL=types.d.ts.map