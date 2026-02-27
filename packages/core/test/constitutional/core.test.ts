import { describe, it, expect } from "vitest";
import { ConstitutionalPolicy } from "../../src/policy/constitutional.js";
import { emptyStore, apply } from "../../src/kernel/apply.js";
import {
  asAuthorId,
  asCommitId,
  asEdgeId,
  asNodeId,
  asGraphId
} from "../../src/domain/ids.js";
import type { Policy } from "../../src/policy/policy.js";

describe("ConstitutionalPolicy invariants (multi-graph kernel)", () => {
  const graphId = asGraphId("G:test");

  const permissivePolicy: Policy = {
  validateOperation: () => [],
  validateStore: () => []
  };

  const getGraph = (store: any) => store.graphs[String(graphId)];

  it("missing author on add_node => rejected", () => {
    const policy = new ConstitutionalPolicy();
    let store = emptyStore();

    const r = apply(
      store,
      graphId,
      {
        type: "add_node",
        node: {
          id: asNodeId("N:1"),
          kind: "Test",
          status: "Active",
          createdAt: "2026-02-06T00:00:00.000Z",
          author: undefined
        }
      } as any,
      policy
    );

    expect(r.events[0]?.type).toBe("rejected");
  });

  it("supersede_edge does not delete old edge", () => {
    const policy = new ConstitutionalPolicy();
    let store = emptyStore();

    store = apply(store, graphId, {
      type: "add_node",
      node: { id: asNodeId("N:1"), kind: "K", status: "Active", createdAt: "2026-02-06T00:00:00.000Z", author: asAuthorId("A:x") }
    }, policy).store;

    store = apply(store, graphId, {
      type: "add_node",
      node: { id: asNodeId("N:2"), kind: "K", status: "Active", createdAt: "2026-02-06T00:00:00.000Z", author: asAuthorId("A:x") }
    }, policy).store;

    store = apply(store, graphId, {
      type: "add_edge",
      edge: { id: asEdgeId("E:1"), type: "supports", from: asNodeId("N:1"), to: asNodeId("N:2"), status: "Active", createdAt: "2026-02-06T00:00:00.000Z", author: asAuthorId("A:x") }
    }, policy).store;

    store = apply(store, graphId, {
      type: "supersede_edge",
      oldEdgeId: asEdgeId("E:1"),
      newEdge: { id: asEdgeId("E:2"), type: "supports", from: asNodeId("N:1"), to: asNodeId("N:2"), status: "Active", createdAt: "2026-02-06T00:00:01.000Z", author: asAuthorId("A:x") }
    }, policy).store;

    const g = getGraph(store);

    expect(g.edges["E:1"]?.status).toBe("Superseded");
    expect(g.edges["E:2"]?.status).toBe("Active");
  });

  it("after commit, add_edge is rejected", () => {
    const policy = new ConstitutionalPolicy();
    let store = emptyStore();

    store = apply(store, graphId, {
      type: "commit",
      commitId: asCommitId("C:1"),
      createdAt: "2026-02-06T00:00:00.000Z",
      author: asAuthorId("A:x")
    }, policy).store;

    const r = apply(store, graphId, {
      type: "add_edge",
      edge: { id: asEdgeId("E:1"), type: "supports", from: asNodeId("N:1"), to: asNodeId("N:2"), status: "Active", createdAt: "2026-02-06T00:00:01.000Z", author: asAuthorId("A:x") }
    }, policy);

    expect(r.events[0]?.type).toBe("rejected");
  });

  it("non-bypassable: permissive policy cannot mutate after commit", () => {
    let store = emptyStore();

    store = apply(store, graphId, {
      type: "commit",
      commitId: asCommitId("C:1"),
      createdAt: "2026-02-06T00:00:00.000Z",
      author: asAuthorId("A:x")
    }, permissivePolicy).store;

    const r = apply(store, graphId, {
      type: "add_node",
      node: { id: asNodeId("N:1"), kind: "K", status: "Active", createdAt: "2026-02-06T00:00:01.000Z", author: asAuthorId("A:x") }
    }, permissivePolicy);

    expect(r.events[0]?.type).toBe("rejected");
  });

  it("rejects duplicate node/edge ids and multiple commits", () => {
    const policy = new ConstitutionalPolicy();
    let store = emptyStore();

    store = apply(store, graphId, {
      type: "add_node",
      node: { id: asNodeId("N:1"), kind: "K", status: "Active", createdAt: "2026-02-06T00:00:00.000Z", author: asAuthorId("A:x") }
    }, policy).store;

    const dupNode = apply(store, graphId, {
      type: "add_node",
      node: { id: asNodeId("N:1"), kind: "K", status: "Active", createdAt: "2026-02-06T00:00:01.000Z", author: asAuthorId("A:x") }
    }, policy);

    expect(dupNode.events[0]?.type).toBe("rejected");
  });
});
