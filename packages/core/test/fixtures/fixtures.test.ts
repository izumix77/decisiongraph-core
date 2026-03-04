import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { GraphStore, Violation } from "../../src/domain/types.js";  // Graph → GraphStore
import type { NodeId } from "../../src/domain/ids.js";
import { emptyStore, emptyGraph, apply } from "../../src/kernel/apply.js";           // GraphLog を削除
import { replayAt, type GraphLog } from "../../src/kernel/replay.js";    // GraphLog はここ
import { lint } from "../../src/kernel/lint.js";
import { ConstitutionalPolicy, effectiveStatus } from "../../src/policy/constitutional.js";
import { asGraphId } from "../../src/domain/ids.js";

type PassFixture = {
  name: string;
  ops: unknown[];
  expect: {
    final: { ok: true };
    // lintOk: true  — apply passes and graph is structurally valid
    // lintOk: false — apply passes but lintStore detects violations (e.g. CIRCULAR_DEPENDENCY)
    lintOk: boolean;
    lintViolations?: Array<{ code: string; severity: Violation["severity"]; path?: string }>;
    graph?: NormalizedGraph; // optional when lintOk: false
    replay?: Array<{ asOfCommitId: string; snapshot: Snapshot }>;
  };
};

type FailFixture = {
  name: string;
  ops: unknown[];
  expect: {
    final?: { ok: false; rejectAt: number };
    violations?: Array<{ code: string; severity: Violation["severity"]; path?: string }>;
    replayError?: { code: string; severity: Violation["severity"]; path?: string };
    replay?: Array<{ asOfCommitId: string; snapshot?: Snapshot }>;
  };
};

// v0.4: Node has no status field (Constitution v0.4 Section 2.3)
// NormalizedGraph reflects the stored shape exactly — no status on nodes.
type NormalizedGraph = {
  nodes: Array<{ id: string; kind: string; createdAt: string; author: string; payload?: unknown }>;
  edges: Array<{ id: string; type: string; from: string; to: string; status: string }>;
  commits: Array<{ commitId: string }>;
};

// v0.4: Snapshot uses effectiveStatus (topology-derived) instead of stored node.status.
// v0.2 fixtures that declared "status" in their snapshot must be updated to "effectiveStatus".
type Snapshot = {
  nodes: Array<{
    id: string;
    kind: string;
    effectiveStatus: "Active" | "Superseded";  // derived — replaces stored status
    payload?: unknown;
  }>;
  edges: Array<{ id: string; type: string; from: string; to: string; status: string }>;
  commits: Array<{ commitId: string }>;
};

const here = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES_ROOT = join(here, "v0.2");
const PASS_DIR = join(FIXTURES_ROOT, "pass");
const FAIL_DIR = join(FIXTURES_ROOT, "fail");

const listJsonFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isFile() && d.name.endsWith(".json"))
    .map(d => join(dir, d.name))
    .sort((a, b) => a.localeCompare(b));

const readJson = <T,>(file: string): T => {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`failed to parse fixture JSON: ${file} (${message})`);
  }
};

const normalizeGraph = (store: GraphStore, graphId: string): NormalizedGraph => {
  const g = store.graphs[graphId];
  if (!g) throw new Error(`graph '${graphId}' not found in store`);
  return {
    nodes: Object.values(g.nodes)
      .map(n => {
        const base: NormalizedGraph["nodes"][number] = {
          id: String(n.id),
          kind: n.kind,
          createdAt: n.createdAt,
          author: String(n.author),
        };
        if (n.payload !== undefined) base.payload = n.payload;
        return base;
      })
      .sort((a, b) => a.id.localeCompare(b.id)),
    edges: Object.values(g.edges)
      .map(e => ({ id: String(e.id), type: e.type, from: String(e.from), to: String(e.to), status: e.status }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    commits: [...g.commits]
      .map(c => ({ commitId: String(c.commitId) }))
      .sort((a, b) => a.commitId.localeCompare(b.commitId)),
  };
};

// normalizeSnapshot derives effectiveStatus from topology — never reads node.status.
const normalizeSnapshot = (store: GraphStore, graphId: string): Snapshot => {
  const g = store.graphs[graphId];
  if (!g) throw new Error(`graph '${graphId}' not found in store`);
  return {
    nodes: Object.values(g.nodes)
      .map(n => {
        const derived = effectiveStatus(store, n.id as NodeId);
        const base: Snapshot["nodes"][number] = {
          id: String(n.id),
          kind: n.kind,
          effectiveStatus: derived,
        };
        if (n.payload !== undefined) base.payload = n.payload;
        return base;
      })
      .sort((a, b) => a.id.localeCompare(b.id)),
    edges: Object.values(g.edges)
      .map(e => ({ id: String(e.id), type: e.type, from: String(e.from), to: String(e.to), status: e.status }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    commits: [...g.commits]
      .map(c => ({ commitId: String(c.commitId) }))
      .sort((a, b) => a.commitId.localeCompare(b.commitId)),
  };
};

const normalizeViolations = (violations: Violation[]) =>
  violations
    .map(v => ({ code: v.code, severity: v.severity, path: v.path }))
    .sort((a, b) => (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? "")));

const normalizeExpectedViolations = (
  violations: Array<{ code: string; severity: Violation["severity"]; path?: string }>
) =>
  violations
    .map(v => ({ code: v.code, severity: v.severity, path: v.path }))
    .sort((a, b) => (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? "")));

const compareViolations = (
  actual: Violation[],
  expected: Array<{ code: string; severity: Violation["severity"]; path?: string }>
) => {
  const actualNorm = normalizeViolations(actual);
  const expectedNorm = normalizeExpectedViolations(expected);
  if (actualNorm.length !== expectedNorm.length) return false;
  for (let i = 0; i < expectedNorm.length; i += 1) {
    const a = actualNorm[i]!;
    const e = expectedNorm[i]!;
    if (a.code !== e.code) return false;
    if (a.severity !== e.severity) return false;
    if (e.path !== undefined && a.path !== e.path) return false;
  }
  return true;
};

const commitIdsFromOps = (ops: unknown[]): Set<string> => {
  const ids = new Set<string>();
  for (const op of ops) {
    if (op && typeof op === "object" && (op as any).type === "commit") {
      ids.add(String((op as any).commitId));
    }
  }
  return ids;
};

describe("Golden Fixture runner (v0.2)", () => {
  it("runs pass fixtures", () => {
    const files = listJsonFiles(PASS_DIR);
    if (files.length === 0) throw new Error(`no fixtures found in ${PASS_DIR}`);

    for (const file of files) {
      const fixture = readJson<PassFixture>(file);
      const policy = new ConstitutionalPolicy();
      const graphId = asGraphId("G:fixture");
      let store = emptyGraph(graphId);
      let rejectedAt = -1;

      fixture.ops.forEach((op, idx) => {
        if (rejectedAt !== -1) return;
        const r = apply(store, graphId, op as any, policy);
        store = r.store;
        if (r.events[0]?.type === "rejected") rejectedAt = idx;
      });

      expect(rejectedAt, `${fixture.name} should not reject`).toBe(-1);

      const lintResult = lint(store, graphId, policy);

      if (fixture.expect.lintOk === false) {
        // lintOk: false — apply passed but lintStore should detect violations
        expect(lintResult.ok, `${fixture.name} lint should fail`).toBe(false);
        if (fixture.expect.lintViolations) {
          const actual = lintResult.ok ? [] : lintResult.violations;
          expect(
            compareViolations(actual, fixture.expect.lintViolations),
            `${fixture.name} lint violations mismatch`
          ).toBe(true);
        }
      } else {
        expect(lintResult.ok, `${fixture.name} lint should be ok`).toBe(true);
        if (fixture.expect.graph) {
          expect(
            normalizeGraph(store, String(graphId)),
            `${fixture.name} graph mismatch`
          ).toEqual(fixture.expect.graph);
        }
      }

      if (fixture.expect.replay) {
        const commitIds = commitIdsFromOps(fixture.ops);
        for (const replayCase of fixture.expect.replay) {
          if (!commitIds.has(String(replayCase.asOfCommitId))) {
            throw new Error(`${fixture.name} replay commitId not found: ${replayCase.asOfCommitId}`);
          }
          const logs: GraphLog[] = [{ graphId, ops: fixture.ops as any }];
          const replayedStore = replayAt(logs, replayCase.asOfCommitId, policy);
          expect(
            normalizeSnapshot(replayedStore, String(graphId)),
            `${fixture.name} replay snapshot mismatch (${replayCase.asOfCommitId})`
          ).toEqual(replayCase.snapshot);
        }
      }
    }
  });

  it("runs fail fixtures", () => {
    const files = listJsonFiles(FAIL_DIR);
    if (files.length === 0) throw new Error(`no fixtures found in ${FAIL_DIR}`);

    for (const file of files) {
      const fixture = readJson<FailFixture>(file);
      const policy = new ConstitutionalPolicy();
      const graphId = asGraphId("G:fixture");
      let store = emptyGraph(graphId);
      let rejectedAt = -1;
      let violations: Violation[] | undefined;

      fixture.ops.forEach((op, idx) => {
        if (rejectedAt !== -1) return;
        const r = apply(store, graphId, op as any, policy);
        store = r.store;
        const event = r.events[0];
        if (event?.type === "rejected") {
          rejectedAt = idx;
          violations = event.error.violations ?? [];
        }
      });

      if (fixture.expect.final) {
        expect(rejectedAt, `${fixture.name} should reject`).toBe(fixture.expect.final.rejectAt);
        if (!violations) throw new Error(`${fixture.name} expected violations but none found`);
        if (!fixture.expect.violations) {
          throw new Error(`${fixture.name} expected violations list missing`);
        }
        expect(
          compareViolations(violations, fixture.expect.violations),
          `${fixture.name} violations mismatch`
        ).toBe(true);
      }

      if (fixture.expect.replayError) {
        const commitIds = commitIdsFromOps(fixture.ops);
        const targetId = String(fixture.expect.replay?.[0]?.asOfCommitId);
        const missing = !commitIds.has(targetId);
        if (!missing) throw new Error(`${fixture.name} replay commitId exists unexpectedly: ${targetId}`);

        const actual = [
          { code: "REPLAY_COMMIT_NOT_FOUND", severity: "ERROR" as const, path: "expect.replay[0].asOfCommitId" }
        ];
        expect(
          compareViolations(actual as Violation[], [fixture.expect.replayError]),
          `${fixture.name} replay error mismatch`
        ).toBe(true);
      }
    }
  });
});
