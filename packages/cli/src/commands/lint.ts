import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";
import { normalizeDecisionLog, decodeDecisionLog } from "@decisiongraph/io-json";
import { ConstitutionalPolicy, replay, lint } from "@decisiongraph/core";

export function cmdLint(path: string) {
  const raw = readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  const vr = validateDecisionJson(json);
  if (!vr.ok) return { ok: false as const, errors: vr.errors };

  const normalized = normalizeDecisionLog(vr.value);
  const ops = decodeDecisionLog(normalized);
  const policy = new ConstitutionalPolicy();
  const g = replay(ops, policy);
  const lr = lint(g, policy);

  if (!lr.ok) return { ok: false as const, errors: lr.violations.map(v => `${v.code}: ${v.message}`) };
  return { ok: true as const };
}
