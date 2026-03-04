import type { Operation } from "@decisiongraph/core";
import type { DecisionLogJson } from "@decisiongraph/schema";

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
  options: { graphId: string }
): DecisionLogJson {
  return {
    version: CURRENT_SCHEMA_VERSION,
    graphId: options.graphId,
    ops: ops as any
  };
}

