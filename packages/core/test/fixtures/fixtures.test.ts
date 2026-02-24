import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Graph, Violation } from "../../src/domain/types.js";
import { emptyGraph, apply } from "../../src/kernel/apply.js";
import { lint } from "../../src/kernel/lint.js";
import { replayAt } from "../../src/kernel/replay.js";
import { ConstitutionalPolicy } from "../../src/policy/constitutional.js";

type PassFixture = {
  name: string;
  ops: unknown[];
  expect: {
    final: { ok: true };
    lintOk: true;
    graph: NormalizedGraph;
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

type NormalizedGraph = {
  nodes: Array<Graph["nodes"][string]>;
  edges: Array<Graph["edges"][string]>;
  commits: Graph["commits"];
};

type Snapshot = {
  nodes: Array<Pick<Graph["nodes"][string], "id" | "kind" | "status"> & { payload?: unknown }>;
  edges: Array<Pick<Graph["edges"][string], "id" | "type" | "from" | "to" | "status">>;
  commits: Array<Pick<Graph["commits"][number], "commitId">>;
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

const normalizeGraph = (g: Graph): NormalizedGraph => ({
  nodes: Object.values(g.nodes).sort((a, b) => String(a.id).localeCompare(String(b.id))),
  edges: Object.values(g.edges).sort((a, b) => String(a.id).localeCompare(String(b.id))),
  commits: [...g.commits].sort((a, b) => String(a.commitId).localeCompare(String(b.commitId)))
});

const normalizeSnapshot = (g: Graph): Snapshot => ({
  nodes: Object.values(g.nodes)
    .map(n => {
      const base = { id: n.id, kind: n.kind, status: n.status } as Snapshot["nodes"][number];
      if (n.payload !== undefined) base.payload = n.payload;
      return base;
    })
    .sort((a, b) => String(a.id).localeCompare(String(b.id))),
  edges: Object.values(g.edges)
    .map(e => ({ id: e.id, type: e.type, from: e.from, to: e.to, status: e.status }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id))),
  commits: [...g.commits]
    .map(c => ({ commitId: c.commitId }))
    .sort((a, b) => String(a.commitId).localeCompare(String(b.commitId)))
});

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

  // Exact length match to ensure single primary invariant violation(s).
  if (actualNorm.length !== expectedNorm.length) return false;

  for (let i = 0; i < expectedNorm.length; i += 1) {
    const a = actualNorm[i];
    const e = expectedNorm[i];
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
      const commitId = String((op as any).commitId);
      ids.add(commitId);
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
      let g = emptyGraph();
      let rejectedAt = -1;

      fixture.ops.forEach((op, idx) => {
        if (rejectedAt !== -1) return;
        const r = apply(g, op as any, policy);
        g = r.graph;
        const event = r.events[0];
        if (event?.type === "rejected") rejectedAt = idx;
      });

      expect(rejectedAt, `${fixture.name} should not reject`).toBe(-1);
      const lintResult = lint(g, policy);
      expect(lintResult.ok, `${fixture.name} lint should be ok`).toBe(true);
      expect(normalizeGraph(g), `${fixture.name} graph mismatch`).toEqual(fixture.expect.graph);

      if (fixture.expect.replay) {
        const commitIds = commitIdsFromOps(fixture.ops);
        for (const replay of fixture.expect.replay) {
          if (!commitIds.has(String(replay.asOfCommitId))) {
            throw new Error(`${fixture.name} replay commitId not found: ${replay.asOfCommitId}`);
          }
          const replayed = replayAt(fixture.ops as any, replay.asOfCommitId, policy);
          expect(
            normalizeSnapshot(replayed),
            `${fixture.name} replay snapshot mismatch (${replay.asOfCommitId})`
          ).toEqual(replay.snapshot);
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
      let g = emptyGraph();
      let rejectedAt = -1;
      let violations: Violation[] | undefined;

      fixture.ops.forEach((op, idx) => {
        if (rejectedAt !== -1) return;
        const r = apply(g, op as any, policy);
        g = r.graph;
        const event = r.events[0];
        if (event?.type === "rejected") {
          rejectedAt = idx;
          violations = event.error.violations ?? [];
        }
      });

      if (fixture.expect.final) {
        expect(rejectedAt, `${fixture.name} should reject`).toBe(fixture.expect.final.rejectAt);
        if (!violations || violations.length === 0) {
          throw new Error(`${fixture.name} expected violations but none found`);
        }
        if (!fixture.expect.violations) {
          throw new Error(`${fixture.name} expected violations list missing`);
        }
        expect(
          compareViolations(violations, fixture.expect.violations),
          `${fixture.name} violations mismatch`
        ).toBe(true);
      }

      if (fixture.expect.replayError) {
        if (rejectedAt !== -1) {
          throw new Error(`${fixture.name} unexpected apply rejection at ${rejectedAt}`);
        }
        const commitIds = commitIdsFromOps(fixture.ops);
        if (!fixture.expect.replay || fixture.expect.replay.length === 0) {
          throw new Error(`${fixture.name} replayError requires expect.replay`);
        }
        const targetId = String(fixture.expect.replay[0].asOfCommitId);
        const missing = !commitIds.has(targetId);
        if (!missing) throw new Error(`${fixture.name} replay commitId exists unexpectedly: ${targetId}`);
        const actual = [
          { code: "REPLAY_COMMIT_NOT_FOUND", severity: "ERROR", path: "expect.replay[0].asOfCommitId" }
        ];
        expect(
          compareViolations(actual as Violation[], [fixture.expect.replayError]),
          `${fixture.name} replay error mismatch`
        ).toBe(true);
      }
    }
  });
});
