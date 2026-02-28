import type { Operation } from "@decisiongraph/core";
import type {
  DecisionLogJson,
  DecisionLogJsonV02,
  DecisionLogJsonV03
} from "@decisiongraph/schema";

import {
  CURRENT_SCHEMA_VERSION,
  type DecisionLogVersion
} from "./version.js";

/**
 * Encode core Operations into DecisionLogJson.
 *
 * version is the JSON wire format version (schema version),
 * not the npm package version.
 */
export function encodeDecisionLog(
  ops: Operation[],
  options?: { version?: DecisionLogVersion; graphId?: string }
): DecisionLogJson {
  const version = options?.version ?? CURRENT_SCHEMA_VERSION;

  if (version === "0.3") {
    if (!options?.graphId) {
      throw new Error(
        "encodeDecisionLog: graphId is required for schema version 0.3"
      );
    }

    const log: DecisionLogJsonV03 = {
      version: "0.3",
      graphId: options.graphId,
      ops: ops as any
    };

    return log;
  }

  // v0.2 (legacy single-graph format)
  const log: DecisionLogJsonV02 = {
    version: "0.2",
    ops: ops as any
  };

  return log;
}
