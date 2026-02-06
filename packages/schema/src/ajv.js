import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import decisionSchema from "../schemas/v0.2/decision.schema.json";
export const schemaId = decisionSchema.$id;
export function buildAjv() {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    ajv.addSchema(decisionSchema);
    return ajv;
}
//# sourceMappingURL=ajv.js.map
