import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Graph, Violation } from "../../src/domain/types.js";
import { emptyGraph, apply } from "../../src/kernel/apply.js";
import { lint } from "../../src/kernel/lint.js";
import { ConstitutionalPolicy } from "../../src/policy/constitutional.js";

type PassFixture = {
  name: string;
  ops: unknown[];
  expect: {
    final: { ok: true };
    lintOk: true;
    graph: NormalizedGraph;
  };
};

type FailFixture = {
  name: string;
  ops: unknown[];
  expect: {
    final: { ok: false; rejectAt: number };
    violations: Array<{ code: string; severity: Violation["severity"]; path?: string }>;
  };
};

type NormalizedGraph = {
  nodes: Array<Graph["nodes"][string]>;
  edges: Array<Graph["edges"][string]>;
  commits: Graph["commits"];
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_ROOT = resolve(__dirname, "v0.2");
const PASS_DIR = resolve(FIXTURES_ROOT, "pass");
const FAIL_DIR = resolve(FIXTURES_ROOT, "fail");

const listJsonFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isFile() && d.name.endsWith(".json"))
    .map(d => resolve(dir, d.name))
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

const normalizeViolations = (violations: Violation[]) =>
  violations
    .map(v => ({ code: v.code, severity: v.severity, path: v.path }))
    .sort((a, b) => (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? "")));

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

      expect(rejectedAt, `${fixture.name} should reject`).toBe(fixture.expect.final.rejectAt);
      if (!violations || violations.length === 0) {
        throw new Error(`${fixture.name} expected violations but none found`);
      }
      expect(
        normalizeViolations(violations),
        `${fixture.name} violations mismatch`
      ).toEqual(normalizeViolations(fixture.expect.violations as Violation[]));
    }
  });
});
