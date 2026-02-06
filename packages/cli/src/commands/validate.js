import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";
export function cmdValidate(path) {
    const raw = readFileSync(path, "utf8");
    const json = JSON.parse(raw);
    const r = validateDecisionJson(json);
    if (!r.ok)
        return { ok: false, errors: r.errors };
    return { ok: true };
}
//# sourceMappingURL=validate.js.map