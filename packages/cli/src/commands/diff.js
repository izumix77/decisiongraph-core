import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";
import { normalizeDecisionLog, decodeDecisionLog } from "@decisiongraph/io-json";
import { ConstitutionalPolicy, replay, diff } from "@decisiongraph/core";
function load(path) {
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
export function cmdDiff(aPath, bPath) {
    const a = load(aPath);
    if (!a.ok)
        return a;
    const b = load(bPath);
    if (!b.ok)
        return b;
    return { ok: true, diff: diff(a.graph, b.graph) };
}
//# sourceMappingURL=diff.js.map