export type Brand<T, B extends string> = T & { readonly __brand: B };

export type NodeId   = Brand<string, "NodeId">;
export type EdgeId   = Brand<string, "EdgeId">;
export type AuthorId = Brand<string, "AuthorId">;
export type CommitId = Brand<string, "CommitId">;
export type GraphId  = Brand<string, "GraphId">;  // NEW in v0.3

export const asNodeId   = (s: string): NodeId   => s as NodeId;
export const asEdgeId   = (s: string): EdgeId   => s as EdgeId;
export const asAuthorId = (s: string): AuthorId => s as AuthorId;
export const asCommitId = (s: string): CommitId => s as CommitId;
export const asGraphId  = (s: string): GraphId  => s as GraphId;  // NEW in v0.3
