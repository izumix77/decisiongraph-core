import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";

export function cmdValidate(path: string): { ok: true } | { ok: false; errors: string[] } {
  const raw = readFileSync(path, "utf8");
  let json: unknown;
  try { json = JSON.parse(raw); }
  catch (e) { return { ok: false, errors: [`Invalid JSON in ${path}: ${(e as Error).message}`] }; }
  const r = validateDecisionJson(json);
  if (!r.ok) return { ok: false, errors: r.errors };
  return { ok: true };
}
