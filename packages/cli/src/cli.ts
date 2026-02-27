import { statSync } from "node:fs";
import { resolve } from "node:path";
import { cmdValidate } from "./commands/validate.js";
import { cmdLint, cmdLintDir } from "./commands/lint.js";
import { cmdReplay } from "./commands/replay.js";
import { cmdDiff } from "./commands/diff.js";
import { cmdTraverse } from "./commands/traverse.js";
import { print, eprint } from "./reporters/pretty.js";
import { printJson } from "./reporters/json.js";

function help() {
  print(`decisiongraph <command> [args]

Commands:
  validate <file.json>              Schema validation only
  lint <file.json>                  Validate -> decode -> core lint
  lint <directory>                  Lint all *.decisionlog.json (cumulative, cross-graph)
  replay <file.json>                Output final GraphStore JSON
  diff <a.json> <b.json>            Output diff between two logs
  traverse <directory>              Tree view of violations with dependency chains
  migrate ...                       (stub)
`);
}

export async function main(argv: string[]) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === "--help" || cmd === "-h") { help(); return; }

  if (cmd === "validate") {
    const path = rest[0];
    if (!path) { eprint("missing file"); process.exit(2); }
    const r = cmdValidate(path);
    if (!r.ok) { r.errors.forEach(e => eprint(e)); process.exit(1); }
    print("OK");
    return;
  }

  if (cmd === "lint") {
    const path = rest[0];
    if (!path) { eprint("missing file or directory"); process.exit(2); }

    const resolved = resolve(path);
    const isDir = statSync(resolved).isDirectory();

    if (isDir) {
      const { results } = cmdLintDir(resolved);
      let hasError = false;

      for (const r of results) {
        if (r.ok) {
          print(`✔ [${r.file}] OK`);
        } else {
          hasError = true;
          eprint(`✖ [${r.file}]`);
          r.errors.forEach((e) => eprint(`    ${e}`));
        }
      }

      if (hasError) {
        eprint("\n✖ DecisionGraph validation failed");
        process.exit(1);
      }
      print("\n✔ DecisionGraph validation passed");
      return;
    }

    // single file
    const r = cmdLint(resolved);
    if (!r.ok) { r.errors.forEach(e => eprint(e)); process.exit(1); }
    print("OK");
    return;
  }

  if (cmd === "replay") {
    const path = rest[0];
    if (!path) { eprint("missing file"); process.exit(2); }
    const r = cmdReplay(path);
    if (!r.ok) { r.errors.forEach(e => eprint(e)); process.exit(1); }
    printJson(r.store);
    return;
  }

  if (cmd === "diff") {
    const a = rest[0], b = rest[1];
    if (!a || !b) { eprint("missing files"); process.exit(2); }
    const r = cmdDiff(a, b);
    if (!r.ok) { r.errors.forEach(e => eprint(e)); process.exit(1); }
    printJson(r.diff);
    return;
  }

  if (cmd === "traverse") {
    const path = rest[0];
    if (!path) { eprint("missing directory"); process.exit(2); }
    const r = cmdTraverse(path);
    if (!r.ok) process.exit(1);
    return;
  }

  help();
  process.exit(2);
}
