import type { Graph, Violation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";
import { ConstitutionalPolicy } from "../policy/constitutional.js";

export type LintResult = { ok: true } | { ok: false; violations: Violation[] };

const constitutionalPolicy = new ConstitutionalPolicy();

export function lint(graph: Graph, policy: Policy): LintResult {
  // Non-bypassable constitutional lint + caller policy lint
  const constitutional = constitutionalPolicy.validateGraph(graph);
  const violations = [...constitutional, ...policy.validateGraph(graph)];

  if (violations.length > 0) {
    violations.sort((a, b) =>
      (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? ""))
    );
    return { ok: false, violations };
  }

  return { ok: true };
}
