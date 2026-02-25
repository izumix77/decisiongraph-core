import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";
import { normalizeDecisionLog, decodeDecisionLog } from "@decisiongraph/io-json";
import {
  ConstitutionalPolicy,
  applyBatch,
  emptyGraph,
  lint as lintGraph,
  type Violation
} from "@decisiongraph/core";

export function cmdLint(path: string) {
  const raw = readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  const vr = validateDecisionJson(json);
  if (!vr.ok) return { ok: false as const, errors: vr.errors };

  const normalized = normalizeDecisionLog(vr.value);
  const ops = decodeDecisionLog(normalized);
  const policy = new ConstitutionalPolicy();

  // 1) ✅ operation-level enforcement: fail if any op was rejected
  const applied = applyBatch(emptyGraph(), ops, policy);
  const rejected = applied.events.filter((e) => e.type === "rejected");

  if (rejected.length > 0) {
    const errors = rejected.flatMap((e) => {
      const vs = (e as any).error?.violations as Violation[] | undefined;
      if (!vs || vs.length === 0) return [`REJECTED: ${e.opType}`];
      return vs.map((v) => `${v.code}: ${v.message}`);
    });

    // stable output helps CI diffs
    errors.sort();
    return { ok: false as const, errors };
  }

  // 2) (optional) graph-level lint (currently empty, but keep it)
  const lr = lintGraph(applied.graph, policy);
  if (!lr.ok) return { ok: false as const, errors: lr.violations.map(v => `${v.code}: ${v.message}`) };

  return { ok: true as const };
}
