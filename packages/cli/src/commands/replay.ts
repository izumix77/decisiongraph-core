import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";
import { normalizeDecisionLog, decodeDecisionLog } from "@decisiongraph/io-json";
import { ConstitutionalPolicy, replay, asGraphId } from "@decisiongraph/core";

export function cmdReplay(path: string) {
  const raw = readFileSync(path, "utf8");
  let json: unknown;
  try { json = JSON.parse(raw); }
  catch (e) { return { ok: false as const, errors: [`Invalid JSON in ${path}: ${(e as Error).message}`] }; }
  const vr = validateDecisionJson(json);
  if (!vr.ok) return { ok: false as const, errors: vr.errors };

  const normalized = normalizeDecisionLog(vr.value);
  const ops = decodeDecisionLog(normalized);
  const graphId = asGraphId((vr.value as any).graphId ?? path);

  const policy = new ConstitutionalPolicy();
  const store = replay([{ graphId, ops }], policy);

  return { ok: true as const, store };
}
