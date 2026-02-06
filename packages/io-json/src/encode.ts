import type { Operation } from "@decisiongraph/core";
import type { DecisionLogJson } from "@decisiongraph/schema";

export function encodeDecisionLog(ops: Operation[]): DecisionLogJson {
  return {
    version: "0.2",
    ops: ops as any
  };
}
