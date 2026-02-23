import type { Graph, Violation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";
import { ConstitutionalPolicy } from "../policy/constitutional.js";

export type LintResult = { ok: true } | { ok: false; violations: Violation[] };

export function lint(graph: Graph, policy: Policy): LintResult {
  // Non-bypassable constitutional lint + caller policy lint
  const constitutional = new ConstitutionalPolicy().validateGraph(graph);
  const violations = [...constitutional, ...policy.validateGraph(graph)];

  if (violations.length > 0) return { ok: false, violations };
  return { ok: true };
}
