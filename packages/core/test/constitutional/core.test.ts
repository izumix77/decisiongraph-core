import { describe, it, expect } from "vitest";
import { ConstitutionalPolicy } from "../../src/policy/constitutional.js";
import { emptyGraph, apply } from "../../src/kernel/apply.js";
import { asAuthorId, asCommitId, asEdgeId, asNodeId } from "../../src/domain/ids.js";

describe("ConstitutionalPolicy invariants", () => {
  it("missing author on add_node => rejected", () => {
    const policy = new ConstitutionalPolicy();
    const g = emptyGraph();
    const r = apply(g, {
      type: "add_node",
      node: {
        id: asNodeId("N:1"),
        kind: "Test",
        status: "Active",
        createdAt: "2026-02-06T00:00:00.000Z",
        author: undefined
      }
    } as any, policy);

    expect(r.events[0]?.type).toBe("rejected");
  });

  it("supersede_edge does not delete old edge", () => {
    const policy = new ConstitutionalPolicy();
    let g = emptyGraph();

    g = apply(g, {
      type: "add_node",
      node: { id: asNodeId("N:1"), kind: "K", status: "Active", createdAt: "2026-02-06T00:00:00.000Z", author: asAuthorId("A:x") }
    }, policy).graph;

    g = apply(g, {
      type: "add_node",
      node: { id: asNodeId("N:2"), kind: "K", status: "Active", createdAt: "2026-02-06T00:00:00.000Z", author: asAuthorId("A:x") }
    }, policy).graph;

    g = apply(g, {
      type: "add_edge",
      edge: { id: asEdgeId("E:1"), type: "supports", from: asNodeId("N:1"), to: asNodeId("N:2"), status: "Active", createdAt: "2026-02-06T00:00:00.000Z", author: asAuthorId("A:x") }
    }, policy).graph;

    g = apply(g, {
      type: "supersede_edge",
      oldEdgeId: asEdgeId("E:1"),
      newEdge: { id: asEdgeId("E:2"), type: "supports", from: asNodeId("N:1"), to: asNodeId("N:2"), status: "Active", createdAt: "2026-02-06T00:00:01.000Z", author: asAuthorId("A:x") }
    }, policy).graph;

    expect(g.edges["E:1"]?.status).toBe("Superseded");
    expect(g.edges["E:2"]?.status).toBe("Active");
  });

  it("after commit, add_edge is rejected", () => {
    const policy = new ConstitutionalPolicy();
    let g = emptyGraph();

    g = apply(g, {
      type: "commit",
      commitId: asCommitId("C:1"),
      createdAt: "2026-02-06T00:00:00.000Z",
      author: asAuthorId("A:x")
    }, policy).graph;

    const r = apply(g, {
      type: "add_edge",
      edge: { id: asEdgeId("E:1"), type: "supports", from: asNodeId("N:1"), to: asNodeId("N:2"), status: "Active", createdAt: "2026-02-06T00:00:01.000Z", author: asAuthorId("A:x") }
    }, policy);

    expect(r.events[0]?.type).toBe("rejected");
  });
});
