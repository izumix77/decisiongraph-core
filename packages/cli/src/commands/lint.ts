import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { validateDecisionJson } from "@decisiongraph/schema";
import { normalizeDecisionLog, decodeDecisionLog } from "@decisiongraph/io-json";
import {
  ConstitutionalPolicy,
  applyBatch,
  emptyStore,
  lintStore,
  asGraphId,
  type Violation,
  type GraphStore,
} from "@decisiongraph/core";

// ---- shared helpers ----

function loadAndDecode(path: string) {
  const raw = readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  const vr = validateDecisionJson(json);
  if (!vr.ok) return { ok: false as const, errors: vr.errors };
  const normalized = normalizeDecisionLog(vr.value);
  const ops = decodeDecisionLog(normalized);
  const graphId = asGraphId((vr.value as any).graphId ?? path);
  return { ok: true as const, graphId, ops };
}

function collectRejections(
  events: ReturnType<typeof applyBatch>["events"]
): { errors: string[]; violations: Violation[] } {
  const violations: Violation[] = [];
  const errors: string[] = [];

  for (const e of events.filter((e) => e.type === "rejected")) {
    const vs = (e as any).error?.violations as Violation[] | undefined;
    if (!vs || vs.length === 0) {
      errors.push(`REJECTED: ${e.opType}`);
    } else {
      for (const v of vs) {
        violations.push(v);
        errors.push(`${v.code}: ${v.message}${v.path ? `  at ${v.path}` : ""}`);
      }
    }
  }

  violations.sort((a, b) =>
    (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? ""))
  );

  return { errors, violations };
}

// ---- single file ----

export function cmdLint(path: string): { ok: true } | { ok: false; errors: string[] } {
  const loaded = loadAndDecode(path);
  if (!loaded.ok) return loaded;

  const { graphId, ops } = loaded;
  const policy = new ConstitutionalPolicy();
  const applied = applyBatch(emptyStore(), graphId, ops, policy);

  const { errors } = collectRejections(applied.events);
  if (errors.length > 0) return { ok: false, errors };

  const lr = lintStore(applied.store, policy);
  if (!lr.ok) return { ok: false, errors: lr.violations.map(v => `${v.code}: ${v.message}`) };

  return { ok: true };
}

// ---- directory ----

export type FileLintResult =
  | { file: string; ok: true }
  | { file: string; ok: false; warn: boolean; errors: string[]; violations: Violation[] };

export type DirLintResult = {
  results: FileLintResult[];
  store: GraphStore;
};

export function cmdLintDir(dir: string, options?: { strict?: boolean }): DirLintResult {
  const strict = options?.strict ?? false;
  const isError = (v: Violation) =>
    v.severity === "ERROR" || (strict && v.severity === "WARN");

  const isWarnOnly = (violations: Violation[]) =>
    violations.every(v => v.severity === "WARN");

  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".decisionlog.json"))
    .sort();

  const policy = new ConstitutionalPolicy();
  let store = emptyStore();
  const results: FileLintResult[] = [];

  for (const file of files) {
    const fullPath = join(dir, file);
    const loaded = loadAndDecode(fullPath);
    if (!loaded.ok) {
      results.push({ file, ok: false, warn: false, errors: loaded.errors, violations: [] });
      continue;
    }

    const { graphId, ops } = loaded;
    const applied = applyBatch(store, graphId, ops, policy);
    store = applied.store;
    const { errors, violations } = collectRejections(applied.events);

    if (errors.length > 0) {
      results.push({ file, ok: false, warn: isWarnOnly(violations), errors, violations });
      continue;
    }

    results.push({ file, ok: true });
  }

  // cross-graph lint
  const lr = lintStore(store, policy);
  if (!lr.ok) {
    results.push({
      file: "<store>",
      ok: false,
      warn: isWarnOnly(lr.violations),
      errors: lr.violations.map(v => `${v.code}: ${v.message}${v.path ? `  at ${v.path}` : ""}`),
      violations: lr.violations,
    });
  }

  return { results, store };
}
