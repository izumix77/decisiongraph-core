import { buildAjv, schemaId } from "./ajv.js";
import { formatAjvErrors } from "./errors.js";

export type DecisionLogJson = { version: "0.2"; ops: unknown[] };

export function validateDecisionJson(input: unknown):
  | { ok: true; value: DecisionLogJson }
  | { ok: false; errors: string[] } {

  const ajv = buildAjv();
  const validate = ajv.getSchema(schemaId);
  if (!validate) return { ok: false, errors: ["Validator not found"] };

  const ok = validate(input);
  if (!ok) return { ok: false, errors: formatAjvErrors(validate.errors) };

  return { ok: true, value: input as DecisionLogJson };
}
