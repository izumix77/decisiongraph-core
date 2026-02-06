import { cmdValidate } from "./commands/validate.js";
import { cmdLint } from "./commands/lint.js";
import { cmdReplay } from "./commands/replay.js";
import { cmdDiff } from "./commands/diff.js";
import { print, eprint } from "./reporters/pretty.js";
import { printJson } from "./reporters/json.js";
function help() {
    print(`decisiongraph <command> [args]

Commands:
  validate <file.json>        Schema validation only
  lint <file.json>            Validate -> decode -> core lint
  replay <file.json>          Output final graph JSON
  diff <a.json> <b.json>      Output diff between two logs
  traverse ...                (stub)
  migrate ...                 (stub)
`);
}
export async function main(argv) {
    const [cmd, ...rest] = argv;
    if (!cmd || cmd === "--help" || cmd === "-h") {
        help();
        return;
    }
    if (cmd === "validate") {
        const path = rest[0];
        if (!path) {
            eprint("missing file");
            process.exit(2);
        }
        const r = cmdValidate(path);
        if (!r.ok) {
            r.errors.forEach(e => eprint(e));
            process.exit(1);
        }
        print("OK");
        return;
    }
    if (cmd === "lint") {
        const path = rest[0];
        if (!path) {
            eprint("missing file");
            process.exit(2);
        }
        const r = cmdLint(path);
        if (!r.ok) {
            r.errors.forEach(e => eprint(e));
            process.exit(1);
        }
        print("OK");
        return;
    }
    if (cmd === "replay") {
        const path = rest[0];
        if (!path) {
            eprint("missing file");
            process.exit(2);
        }
        const r = cmdReplay(path);
        if (!r.ok) {
            r.errors.forEach(e => eprint(e));
            process.exit(1);
        }
        printJson(r.graph);
        return;
    }
    if (cmd === "diff") {
        const a = rest[0], b = rest[1];
        if (!a || !b) {
            eprint("missing files");
            process.exit(2);
        }
        const r = cmdDiff(a, b);
        if (!r.ok) {
            r.errors.forEach(e => eprint(e));
            process.exit(1);
        }
        printJson(r.diff);
        return;
    }
    help();
    process.exit(2);
}
//# sourceMappingURL=cli.js.map