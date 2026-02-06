import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";
import { normalizeDecisionLog, decodeDecisionLog } from "@decisiongraph/io-json";
import { ConstitutionalPolicy, replay } from "@decisiongraph/core";
export function cmdReplay(path) {
    const raw = readFileSync(path, "utf8");
    const json = JSON.parse(raw);
    const vr = validateDecisionJson(json);
    if (!vr.ok)
        return { ok: false, errors: vr.errors };
    const ops = decodeDecisionLog(normalizeDecisionLog(vr.value));
    const policy = new ConstitutionalPolicy();
    const g = replay(ops, policy);
    return { ok: true, graph: g };
}
//# sourceMappingURL=replay.js.map