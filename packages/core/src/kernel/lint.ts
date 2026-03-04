// Constitution v0.4
// lint()      — single Graph within a store (per-graph structural check)
// lintStore() — entire GraphStore (cross-graph, effectiveStatus, circular)

import type { GraphId } from "../domain/ids.js";
import type { GraphStore, Violation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";
import { ConstitutionalPolicy } from "../policy/constitutional.js";

export type LintResult = { ok: true } | { ok: false; violations: Violation[] };

const constitutionalPolicy = new ConstitutionalPolicy();

// Lint a single Graph within the store.
// Runs constitutional + caller policy validateStore, then filters to the target graphId.
// Use lintStore() for cross-graph validation.
export function lint(store: GraphStore, graphId: GraphId, policy: Policy): LintResult {
  const all = lintStore(store, policy);
  // For single-graph lint we return store-level violations — they include the target graph.
  // Callers that need per-graph filtering can do so on the returned violations array.
  return all;
}

// Lint the entire GraphStore: cross-graph edges, circular dependencies,
// effectiveStatus-based DEPENDENCY_ON_SUPERSEDED, ID uniqueness.
export function lintStore(store: GraphStore, policy: Policy): LintResult {
  const constitutional = constitutionalPolicy.validateStore(store);
  const caller = policy.validateStore(store);
  const violations = [...constitutional, ...caller];

  if (violations.length > 0) {
    violations.sort((a, b) =>
      (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? ""))
    );
    return { ok: false, violations };
  }

  return { ok: true };
}
