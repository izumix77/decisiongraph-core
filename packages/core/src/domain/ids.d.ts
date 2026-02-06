export type Brand<T, B extends string> = T & {
    readonly __brand: B;
};
export type NodeId = Brand<string, "NodeId">;
export type EdgeId = Brand<string, "EdgeId">;
export type AuthorId = Brand<string, "AuthorId">;
export type CommitId = Brand<string, "CommitId">;
export declare const asNodeId: (s: string) => NodeId;
export declare const asEdgeId: (s: string) => EdgeId;
export declare const asAuthorId: (s: string) => AuthorId;
export declare const asCommitId: (s: string) => CommitId;
//# sourceMappingURL=ids.d.ts.map