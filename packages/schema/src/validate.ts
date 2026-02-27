import { buildAjv, schemaIdV02, schemaIdV03 } from "./ajv.js";
import { formatAjvErrors } from "./errors.js";

export type DecisionLogJsonV02 = { version: "0.2"; ops: unknown[] };
export type DecisionLogJsonV03 = { version: "0.3"; graphId: string; ops: unknown[] };
export type DecisionLogJson = DecisionLogJsonV02 | DecisionLogJsonV03;

export function validateDecisionJson(input: unknown):
  | { ok: true; value: DecisionLogJson }
  | { ok: false; errors: string[] } {

  // peek at version to select schema
  const version = (input as any)?.version;
  const ajv = buildAjv();

  if (version === "0.3") {
    const validate = ajv.getSchema(schemaIdV03);
    if (!validate) return { ok: false, errors: ["Validator v0.3 not found"] };
    const ok = validate(input);
    if (!ok) return { ok: false, errors: formatAjvErrors(validate.errors) };
    return { ok: true, value: input as DecisionLogJsonV03 };
  }

  // default: v0.2
  const validate = ajv.getSchema(schemaIdV02);
  if (!validate) return { ok: false, errors: ["Validator v0.2 not found"] };
  const ok = validate(input);
  if (!ok) return { ok: false, errors: formatAjvErrors(validate.errors) };
  return { ok: true, value: input as DecisionLogJsonV02 };
}
