import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";
import { normalizeDecisionLog, decodeDecisionLog } from "@decisiongraph/io-json";
import { ConstitutionalPolicy, replay, diff } from "@decisiongraph/core";

function load(path: string) {
  const raw = readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  const vr = validateDecisionJson(json);
  if (!vr.ok) return { ok: false as const, errors: vr.errors };
  const ops = decodeDecisionLog(normalizeDecisionLog(vr.value));
  const policy = new ConstitutionalPolicy();
  const g = replay(ops, policy);
  return { ok: true as const, graph: g };
}

export function cmdDiff(aPath: string, bPath: string) {
  const a = load(aPath); if (!a.ok) return a;
  const b = load(bPath); if (!b.ok) return b;
  return { ok: true as const, diff: diff(a.graph, b.graph) };
}
