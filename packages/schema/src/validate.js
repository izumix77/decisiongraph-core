import { buildAjv, schemaId } from "./ajv.js";
import { formatAjvErrors } from "./errors.js";
export function validateDecisionJson(input) {
    const ajv = buildAjv();
    const validate = ajv.getSchema(schemaId);
    if (!validate)
        return { ok: false, errors: ["Validator not found"] };
    const ok = validate(input);
    if (!ok)
        return { ok: false, errors: formatAjvErrors(validate.errors) };
    return { ok: true, value: input };
}
//# sourceMappingURL=validate.js.map