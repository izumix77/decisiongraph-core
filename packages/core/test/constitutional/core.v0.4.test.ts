/**
 * DecisionGraph Core — Golden Fixtures v0.4
 * Normative Reference: Constitution v0.4 RC
 *
 * Test coverage:
 *  [C01] valid single-graph commit — baseline
 *  [C02] AUTHOR_REQUIRED on node
 *  [C03] AUTHOR_REQUIRED on edge
 *  [C04] IMMUTABLE_AFTER_COMMIT — add_node rejected
 *  [C05] IMMUTABLE_AFTER_COMMIT — add_edge rejected
 *  [C06] NODE_ID_DUP — store-wide
 *  [C07] EDGE_ID_DUP — store-wide
 *  [C08] COMMIT_ID_DUP — store-wide
 *  [C09] SELF_LOOP — from === to
 *  [C10] CIRCULAR_DEPENDENCY — A depends_on B depends_on A
 *  [C11] CIRCULAR_DEPENDENCY — supersedes cycle (A supersedes B supersedes A)
 *  [C12] effectiveStatus derivation — supersedes edge makes node Superseded
 *  [C13] DEPENDENCY_ON_SUPERSEDED — topology-derived, not stored status
 *  [C14] cross-graph edge — valid resolution
 *  [C15] cross-graph edge — EDGE_NOT_RESOLVED
 *  [C16] cross-graph supersedes — effectiveStatus reflects cross-graph supersession
 *  [C17] replayAt — effectiveStatus correct at historical boundary
 *  [C18] multiple Active supersedes (fork) — both valid, effectiveStatus = Superseded
 *  [C19] supersede_edge atomicity — old edge Superseded, new edge Active
 *  [C20] INVALID_EDGE_TYPE — "overrides" is no longer valid in v0.4
 */

import { describe, test, expect } from "vitest";
import {
  apply,
  applyBatch,
  emptyStore,
  emptyGraph,
} from "../../src/kernel/apply.js";
import { lint, lintStore } from "../../src/kernel/lint.js";
import { replay, replayAt } from "../../src/kernel/replay.js";
import { effectiveStatus } from "../../src/policy/constitutional.js";
import { ConstitutionalPolicy } from "../../src/policy/constitutional.js";
import {
  asNodeId,
  asEdgeId,
  asAuthorId,
  asCommitId,
  asGraphId,
} from "../../src/domain/ids.js";
import type { GraphStore, Node, Edge, Operation } from "../../src/domain/types.js";

// ---- helpers ----

const policy = new ConstitutionalPolicy();

const GID  = asGraphId("G:default");
const GID2 = asGraphId("G:secondary");

const node = (id: string, kind = "Decision"): Node => ({
  id: asNodeId(id),
  kind,
  createdAt: "2026-01-01T00:00:00.000Z",
  author: asAuthorId("alice"),
});

const edge = (id: string, from: string, to: string, type: Edge["type"] = "depends_on"): Edge => ({
  id: asEdgeId(id),
  type,
  from: asNodeId(from),
  to: asNodeId(to),
  status: "Active",
  createdAt: "2026-01-01T00:00:00.000Z",
  author: asAuthorId("alice"),
});

const commitOp = (id: string): Operation => ({
  type: "commit",
  commitId: asCommitId(id),
  createdAt: "2026-01-01T00:00:00.000Z",
  author: asAuthorId("alice"),
});

// ---- C01: valid baseline ----

describe("[C01] valid single-graph commit", () => {
  test("applies add_node, add_edge, commit without violations", () => {
    const store = emptyGraph(GID);
    const ops: Operation[] = [
      { type: "add_node", node: node("N:a") },
      { type: "add_node", node: node("N:b") },
      { type: "add_edge", edge: edge("E:a-b", "N:a", "N:b") },
      commitOp("C:1"),
    ];
    const result = applyBatch(store, GID, ops, policy);
    expect(result.events.every(e => e.type === "applied")).toBe(true);
    expect(lintStore(result.store, policy)).toEqual({ ok: true });
  });
});

// ---- C02 / C03: AUTHOR_REQUIRED ----

describe("[C02] AUTHOR_REQUIRED on node", () => {
  test("rejects add_node with empty author", () => {
    const store = emptyGraph(GID);
    const bad: Node = { ...node("N:x"), author: asAuthorId("") };
    const result = apply(store, GID, { type: "add_node", node: bad }, policy);
    const rejected = result.events.find(e => e.type === "rejected");
    expect(rejected).toBeDefined();
    expect((rejected as any).error.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "AUTHOR_REQUIRED" })])
    );
  });
});

describe("[C03] AUTHOR_REQUIRED on edge", () => {
  test("rejects add_edge with empty author", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:a") },
      { type: "add_node", node: node("N:b") },
    ], policy).store;
    const bad: Edge = { ...edge("E:x", "N:a", "N:b"), author: asAuthorId("") };
    const result = apply(store, GID, { type: "add_edge", edge: bad }, policy);
    const rejected = result.events.find(e => e.type === "rejected");
    expect(rejected).toBeDefined();
    expect((rejected as any).error.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "AUTHOR_REQUIRED" })])
    );
  });
});

// ---- C04 / C05: IMMUTABLE_AFTER_COMMIT ----

describe("[C04] IMMUTABLE_AFTER_COMMIT — add_node", () => {
  test("rejects add_node after commit", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:a") },
      commitOp("C:1"),
    ], policy).store;
    const result = apply(store, GID, { type: "add_node", node: node("N:b") }, policy);
    const rejected = result.events.find(e => e.type === "rejected");
    expect((rejected as any).error.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "IMMUTABLE_AFTER_COMMIT" })])
    );
  });
});

describe("[C05] IMMUTABLE_AFTER_COMMIT — add_edge", () => {
  test("rejects add_edge after commit", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:a") },
      { type: "add_node", node: node("N:b") },
      commitOp("C:1"),
    ], policy).store;
    const bad = edge("E:ab", "N:a", "N:b");
    const result = apply(store, GID, { type: "add_edge", edge: bad }, policy);
    const rejected = result.events.find(e => e.type === "rejected");
    expect((rejected as any).error.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "IMMUTABLE_AFTER_COMMIT" })])
    );
  });
});

// ---- C06 / C07 / C08: ID uniqueness ----

describe("[C06] NODE_ID_DUP — store-wide", () => {
  test("rejects duplicate nodeId across graphs", () => {
    let store: GraphStore = { graphs: {} };
    store = applyBatch(
      { graphs: { [String(GID)]: { graphId: GID, nodes: {}, edges: {}, commits: [] } } },
      GID, [{ type: "add_node", node: node("N:shared") }], policy
    ).store;
    // add second graph
    store = { graphs: { ...store.graphs, [String(GID2)]: { graphId: GID2, nodes: {}, edges: {}, commits: [] } } };
    const result = apply(store, GID2, { type: "add_node", node: node("N:shared") }, policy);
    const rejected = result.events.find(e => e.type === "rejected");
    expect((rejected as any).error.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "NODE_ID_DUP" })])
    );
  });
});

describe("[C07] EDGE_ID_DUP — store-wide", () => {
  test("rejects duplicate edgeId across graphs", () => {
    let store: GraphStore = {
      graphs: {
        [String(GID)]:  { graphId: GID,  nodes: {}, edges: {}, commits: [] },
        [String(GID2)]: { graphId: GID2, nodes: {}, edges: {}, commits: [] },
      }
    };
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:a") },
      { type: "add_node", node: node("N:b") },
      { type: "add_edge", edge: edge("E:shared", "N:a", "N:b") },
    ], policy).store;
    store = applyBatch(store, GID2, [
      { type: "add_node", node: node("N:c") },
      { type: "add_node", node: node("N:d") },
    ], policy).store;
    const result = apply(store, GID2, { type: "add_edge", edge: edge("E:shared", "N:c", "N:d") }, policy);
    const rejected = result.events.find(e => e.type === "rejected");
    expect((rejected as any).error.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "EDGE_ID_DUP" })])
    );
  });
});

describe("[C08] COMMIT_ID_DUP — store-wide", () => {
  test("rejects duplicate commitId across graphs", () => {
    let store: GraphStore = {
      graphs: {
        [String(GID)]:  { graphId: GID,  nodes: {}, edges: {}, commits: [] },
        [String(GID2)]: { graphId: GID2, nodes: {}, edges: {}, commits: [] },
      }
    };
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:a") },
      commitOp("C:shared"),
    ], policy).store;
    store = applyBatch(store, GID2, [
      { type: "add_node", node: node("N:b") },
    ], policy).store;
    const result = apply(store, GID2, commitOp("C:shared"), policy);
    const rejected = result.events.find(e => e.type === "rejected");
    expect((rejected as any).error.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "COMMIT_ID_DUP" })])
    );
  });
});

// ---- C09: SELF_LOOP ----

describe("[C09] SELF_LOOP", () => {
  test("rejects edge where from === to", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [{ type: "add_node", node: node("N:a") }], policy).store;
    const selfLoop: Edge = edge("E:loop", "N:a", "N:a");
    const result = apply(store, GID, { type: "add_edge", edge: selfLoop }, policy);
    const rejected = result.events.find(e => e.type === "rejected");
    expect((rejected as any).error.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "SELF_LOOP" })])
    );
  });
});

// ---- C10: CIRCULAR_DEPENDENCY (depends_on) ----

describe("[C10] CIRCULAR_DEPENDENCY — depends_on cycle", () => {
  test("lintStore detects A depends_on B depends_on A", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:a") },
      { type: "add_node", node: node("N:b") },
      { type: "add_edge", edge: edge("E:a-b", "N:a", "N:b", "depends_on") },
      { type: "add_edge", edge: edge("E:b-a", "N:b", "N:a", "depends_on") },
    ], policy).store;
    const result = lintStore(store, policy);
    expect(result.ok).toBe(false);
    expect((result as any).violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "CIRCULAR_DEPENDENCY" })])
    );
  });
});

// ---- C11: CIRCULAR_DEPENDENCY (supersedes cycle) ----

describe("[C11] CIRCULAR_DEPENDENCY — supersedes cycle", () => {
  test("lintStore detects A supersedes B supersedes A", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:a") },
      { type: "add_node", node: node("N:b") },
      { type: "add_edge", edge: edge("E:a-sup-b", "N:a", "N:b", "supersedes") },
      { type: "add_edge", edge: edge("E:b-sup-a", "N:b", "N:a", "supersedes") },
    ], policy).store;
    const result = lintStore(store, policy);
    expect(result.ok).toBe(false);
    expect((result as any).violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "CIRCULAR_DEPENDENCY" })])
    );
  });
});

// ---- C12: effectiveStatus derivation ----

describe("[C12] effectiveStatus — topology-derived Superseded", () => {
  test("N:old is Superseded after N:new supersedes it", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:old") },
      { type: "add_node", node: node("N:new") },
      { type: "add_edge", edge: edge("E:sup", "N:new", "N:old", "supersedes") },
    ], policy).store;
    expect(effectiveStatus(store, asNodeId("N:old"))).toBe("Superseded");
    expect(effectiveStatus(store, asNodeId("N:new"))).toBe("Active");
  });

  test("N:old is Active before supersedes edge is added", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:old") },
    ], policy).store;
    expect(effectiveStatus(store, asNodeId("N:old"))).toBe("Active");
  });
});

// ---- C13: DEPENDENCY_ON_SUPERSEDED (topology-derived) ----

describe("[C13] DEPENDENCY_ON_SUPERSEDED — topology-based detection", () => {
  test("lintStore raises ERROR when depends_on target is topologically Superseded", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:old") },
      { type: "add_node", node: node("N:new") },
      { type: "add_node", node: node("N:consumer") },
      // N:new supersedes N:old → effectiveStatus(N:old) = Superseded
      { type: "add_edge", edge: edge("E:sup", "N:new", "N:old", "supersedes") },
      // N:consumer still depends_on N:old — should be ERROR
      { type: "add_edge", edge: edge("E:dep", "N:consumer", "N:old", "depends_on") },
    ], policy).store;
    const result = lintStore(store, policy);
    expect(result.ok).toBe(false);
    expect((result as any).violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "DEPENDENCY_ON_SUPERSEDED" })])
    );
  });

  test("supports edge to Superseded node does NOT raise error", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:old") },
      { type: "add_node", node: node("N:new") },
      { type: "add_node", node: node("N:evidence") },
      { type: "add_edge", edge: edge("E:sup", "N:new", "N:old", "supersedes") },
      // supports to a Superseded node is historically valid — NOT an error
      { type: "add_edge", edge: edge("E:spt", "N:evidence", "N:old", "supports") },
    ], policy).store;
    // lintStore must return ok:true — no violations of any kind
    // DEPENDENCY_ON_SUPERSEDED must not fire for supports edges
    expect(lintStore(store, policy)).toEqual({ ok: true });
  });
});

// ---- C14: cross-graph edge — valid ----

describe("[C14] cross-graph edge — valid resolution", () => {
  test("add_edge succeeds when to-node lives in another committed graph", () => {
    let store: GraphStore = {
      graphs: {
        [String(GID)]:  { graphId: GID,  nodes: {}, edges: {}, commits: [] },
        [String(GID2)]: { graphId: GID2, nodes: {}, edges: {}, commits: [] },
      }
    };
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:sec") },
      commitOp("C:sec"),
    ], policy).store;
    store = applyBatch(store, GID2, [
      { type: "add_node", node: node("N:adr") },
      { type: "add_edge", edge: edge("E:cross", "N:adr", "N:sec", "depends_on") },
      commitOp("C:adr"),
    ], policy).store;
    expect(lintStore(store, policy)).toEqual({ ok: true });
  });
});

// ---- C15: cross-graph edge — EDGE_NOT_RESOLVED ----

describe("[C15] cross-graph edge — EDGE_NOT_RESOLVED", () => {
  test("rejects edge referencing non-existent node in any graph", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:a") },
    ], policy).store;
    const result = apply(store, GID, {
      type: "add_edge",
      edge: edge("E:phantom", "N:a", "N:ghost", "depends_on"),
    }, policy);
    const rejected = result.events.find(e => e.type === "rejected");
    expect((rejected as any).error.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "EDGE_NOT_RESOLVED" })])
    );
  });
});

// ---- C16: cross-graph supersedes ----

describe("[C16] cross-graph supersedes — effectiveStatus reflects cross-graph supersession", () => {
  test("supersedes edge in G:secondary makes node in G:default Superseded", () => {
    let store: GraphStore = {
      graphs: {
        [String(GID)]:  { graphId: GID,  nodes: {}, edges: {}, commits: [] },
        [String(GID2)]: { graphId: GID2, nodes: {}, edges: {}, commits: [] },
      }
    };
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:old") },
      commitOp("C:g1"),
    ], policy).store;
    store = applyBatch(store, GID2, [
      { type: "add_node", node: node("N:replacement") },
      // cross-graph supersedes: N:replacement (G2) supersedes N:old (G1)
      { type: "add_edge", edge: edge("E:cross-sup", "N:replacement", "N:old", "supersedes") },
      commitOp("C:g2"),
    ], policy).store;
    expect(effectiveStatus(store, asNodeId("N:old"))).toBe("Superseded");
    expect(effectiveStatus(store, asNodeId("N:replacement"))).toBe("Active");
  });
});

// ---- C17: replayAt — effectiveStatus at historical boundary ----
//
// This is the proof test for Constitution v0.4 Section 7.1:
// "effectiveStatus(replayAt(S, commitId), n) correctly reflects
//  supersession state at that historical boundary."
//
// Two sub-tests:
//   C17a — single-graph: supersedes edge added in second commit
//   C17b — cross-graph: supersedes edge lives in a different graph (G2)
//           replayAt(C:g1-only) must NOT include G2's supersedes edge

describe("[C17] replayAt — effectiveStatus correct at historical boundary", () => {

  // C17a: 2-graph replay boundary
  // G1: N:r17-old, N:r17-new committed at C:r17-g1 (no supersedes edge yet)
  // G2: supersedes edge added at C:r17-g2
  // replayAt(C:r17-g1) → N:old is Active (G2 ops not yet applied)
  // replayAt(C:r17-g2) → N:old is Superseded (supersedes edge applied)
  test("[C17a] single-graph: N:old Active before supersedes commit, Superseded after", () => {
    const logs = [
      {
        graphId: GID,
        ops: [
          { type: "add_node" as const, node: node("N:r17-old") },
          { type: "add_node" as const, node: node("N:r17-new") },
          commitOp("C:r17-g1"),
        ] as Operation[],
      },
      {
        graphId: GID2,
        ops: [
          { type: "add_node" as const, node: node("N:r17-dummy") },
          { type: "add_edge" as const, edge: edge("E:r17-sup", "N:r17-new", "N:r17-old", "supersedes") },
          commitOp("C:r17-g2"),
        ] as Operation[],
      },
    ];

    const storeBefore = replayAt(logs, "C:r17-g1", policy);
    const storeAfter  = replayAt(logs, "C:r17-g2",  policy);

    // Before supersedes edge is committed: N:old is Active
    expect(effectiveStatus(storeBefore, asNodeId("N:r17-old"))).toBe("Active");
    // After supersedes edge is committed: N:old is Superseded
    expect(effectiveStatus(storeAfter,  asNodeId("N:r17-old"))).toBe("Superseded");
    // N:new is always Active (nothing supersedes it)
    expect(effectiveStatus(storeAfter,  asNodeId("N:r17-new"))).toBe("Active");
  });

  // C17b: cross-graph replay boundary
  // N:base lives in G1 (committed at C:g1).
  // N:successor lives in G2 and supersedes N:base (committed at C:g2).
  // logs = [G1, G2] — G1 committed before G2.
  //
  // replayAt(C:g1) must stop before G2 ops are applied.
  // Therefore effectiveStatus(N:base) = Active at C:g1 boundary.
  // effectiveStatus(N:base) = Superseded at C:g2 boundary.
  test("[C17b] cross-graph: supersedes in G2 does not bleed into replayAt(C:g1)", () => {
    const logs = [
      {
        graphId: GID,
        ops: [
          { type: "add_node" as const, node: node("N:base") },
          commitOp("C:g1"),
        ] as Operation[],
      },
      {
        graphId: GID2,
        ops: [
          { type: "add_node" as const, node: node("N:successor") },
          // cross-graph supersedes: N:successor (G2) supersedes N:base (G1)
          { type: "add_edge" as const, edge: edge("E:cross-sup2", "N:successor", "N:base", "supersedes") },
          commitOp("C:g2"),
        ] as Operation[],
      },
    ];

    // At C:g1: G2 not yet applied → supersedes edge does not exist
    const storeAtG1 = replayAt(logs, "C:g1", policy);
    expect(effectiveStatus(storeAtG1, asNodeId("N:base"))).toBe("Active");

    // At C:g2: G2 fully applied → supersedes edge exists
    const storeAtG2 = replayAt(logs, "C:g2", policy);
    expect(effectiveStatus(storeAtG2, asNodeId("N:base"))).toBe("Superseded");
    expect(effectiveStatus(storeAtG2, asNodeId("N:successor"))).toBe("Active");
  });
});

// ---- C18: multiple Active supersedes (fork) ----

describe("[C18] multiple Active supersedes — fork is valid", () => {
  test("two nodes superseding the same node both valid; original is Superseded", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:original") },
      { type: "add_node", node: node("N:fork-a") },
      { type: "add_node", node: node("N:fork-b") },
      { type: "add_edge", edge: edge("E:sup-a", "N:fork-a", "N:original", "supersedes") },
      { type: "add_edge", edge: edge("E:sup-b", "N:fork-b", "N:original", "supersedes") },
    ], policy).store;
    expect(lintStore(store, policy)).toEqual({ ok: true });
    expect(effectiveStatus(store, asNodeId("N:original"))).toBe("Superseded");
    expect(effectiveStatus(store, asNodeId("N:fork-a"))).toBe("Active");
    expect(effectiveStatus(store, asNodeId("N:fork-b"))).toBe("Active");
  });
});

// ---- C19: supersede_edge atomicity ----

describe("[C19] supersede_edge atomicity", () => {
  // Atomicity proof: Constitution v0.4 Section 5.2
  // "A supersede_edge operation MUST be atomic: old edge Superseded AND
  //  new Active edge added in a single indivisible transition."
  // Verified by:
  //   (1) exactly one event, type "applied" — no partial rejection
  //   (2) old edge status = Superseded in the resulting store
  //   (3) new edge status = Active in the resulting store
  //   (4) the store before the operation is unchanged (no intermediate state leaked)
  test("supersede_edge applies as single event; old=Superseded and new=Active atomically", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:a") },
      { type: "add_node", node: node("N:b") },
      { type: "add_edge", edge: edge("E:old", "N:a", "N:b", "depends_on") },
    ], policy).store;

    // Capture pre-operation state
    const storeBefore = store;

    const result = apply(store, GID, {
      type: "supersede_edge",
      oldEdgeId: asEdgeId("E:old"),
      newEdge: edge("E:new", "N:a", "N:b", "depends_on"),
    }, policy);

    // (1) Exactly one event, no rejection — single indivisible transition
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("applied");

    const g = result.store.graphs[String(GID)]!;

    // (2) old edge is Superseded
    expect(g.edges["E:old"].status).toBe("Superseded");

    // (3) new edge is Active
    expect(g.edges["E:new"].status).toBe("Active");

    // (4) pre-operation store is unchanged — no intermediate state observable
    expect(storeBefore.graphs[String(GID)]!.edges["E:old"].status).toBe("Active");
    expect(storeBefore.graphs[String(GID)]!.edges["E:new"]).toBeUndefined();
  });

  test("supersede_edge fails entirely when oldEdgeId does not exist — no partial mutation", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:a") },
      { type: "add_node", node: node("N:b") },
    ], policy).store;

    const result = apply(store, GID, {
      type: "supersede_edge",
      oldEdgeId: asEdgeId("E:nonexistent"),
      newEdge: edge("E:new2", "N:a", "N:b", "depends_on"),
    }, policy);

    // Rejected entirely — new edge must NOT appear in store
    expect(result.events[0].type).toBe("rejected");
    expect(result.store.graphs[String(GID)]!.edges["E:new2"]).toBeUndefined();
  });
});

// ---- C20: overrides is no longer a valid EdgeType ----

describe("[C20] INVALID_EDGE_TYPE — overrides removed in v0.4", () => {
  test("rejects edge with type 'overrides'", () => {
    let store = emptyGraph(GID);
    store = applyBatch(store, GID, [
      { type: "add_node", node: node("N:a") },
      { type: "add_node", node: node("N:b") },
    ], policy).store;
    const bad = {
      ...edge("E:ov", "N:a", "N:b"),
      type: "overrides" as Edge["type"],
    };
    const result = apply(store, GID, { type: "add_edge", edge: bad }, policy);
    const rejected = result.events.find(e => e.type === "rejected");
    expect((rejected as any).error.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "INVALID_EDGE_TYPE" })])
    );
  });
});
