import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";
import { normalizeDecisionLog, decodeDecisionLog } from "@decisiongraph/io-json";
import { ConstitutionalPolicy, replay, diffStore, asGraphId } from "@decisiongraph/core";

function load(path: string) {
  const raw = readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  const vr = validateDecisionJson(json);
  if (!vr.ok) return { ok: false as const, errors: vr.errors };

  const normalized = normalizeDecisionLog(vr.value);
  const ops = decodeDecisionLog(normalized);
  const graphId = asGraphId((vr.value as any).graphId ?? path);

  const policy = new ConstitutionalPolicy();
  const store = replay([{ graphId, ops }], policy);

  return { ok: true as const, store };
}

export function cmdDiff(aPath: string, bPath: string) {
  const a = load(aPath); if (!a.ok) return a;
  const b = load(bPath); if (!b.ok) return b;
  return { ok: true as const, diff: diffStore(a.store, b.store) };
}
