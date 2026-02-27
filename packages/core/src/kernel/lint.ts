import type { GraphStore, Violation } from "../domain/types.js";
import type { GraphId } from "../domain/ids.js";
import type { Policy } from "../policy/policy.js";
import { ConstitutionalPolicy } from "../policy/constitutional.js";

export type LintResult = { ok: true } | { ok: false; violations: Violation[] };

const constitutionalPolicy = new ConstitutionalPolicy();

// Lint a single Graph within the store
export function lint(store: GraphStore, graphId: GraphId, policy: Policy): LintResult {
  const constitutional = constitutionalPolicy.validateStore(store);
  const violations = [...constitutional];

  // caller policy が ConstitutionalPolicy でなければ追加実行
  if (!(policy instanceof ConstitutionalPolicy)) {
    violations.push(...policy.validateStore(store));
  }

  const filtered = violations.filter((v) =>
    !v.path || v.path.startsWith(`graphs.${String(graphId)}`)
  );

  if (filtered.length > 0) {
    filtered.sort((a, b) => (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? "")));
    return { ok: false, violations: filtered };
  }
  return { ok: true };
}

// Lint the entire GraphStore (cross-graph validation)
export function lintStore(store: GraphStore, policy: Policy): LintResult {
  const constitutional = constitutionalPolicy.validateStore(store);
  const violations = [...constitutional];

  // caller policy が ConstitutionalPolicy でなければ追加実行
  if (!(policy instanceof ConstitutionalPolicy)) {
    violations.push(...policy.validateStore(store));
  }

  if (violations.length > 0) {
    violations.sort((a, b) => (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? "")));
    return { ok: false, violations };
  }
  return { ok: true };
}
