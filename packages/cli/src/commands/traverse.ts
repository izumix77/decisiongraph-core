import { resolve } from "node:path";
import { statSync } from "node:fs";
import { cmdLintDir } from "./lint.js";
import { printViolationTree, printSummary, print, eprint } from "../reporters/pretty.js";

export function cmdTraverse(dir: string, options?: { strict?: boolean }): { ok: boolean } {
  const strict = options?.strict ?? false;
  const resolved = resolve(dir);

  if (!statSync(resolved).isDirectory()) {
    eprint("traverse requires a directory");
    return { ok: false };
  }

  const { results, store } = cmdLintDir(resolved, { strict });

  let errorFiles = 0;
  let warnFiles  = 0;

  const fileResults = results.filter(r => r.file !== "<store>");
  const storeResult = results.find(r => r.file === "<store>");

  for (const r of fileResults) {
    if (r.ok) {
      print(`  ✔ [${r.file}]`);
    } else if (r.warn && !strict) {
      warnFiles++;
      printViolationTree(r.file, r.violations, store);
    } else {
      errorFiles++;
      printViolationTree(r.file, r.violations, store);
    }
  }

  if (storeResult && !storeResult.ok) {
    if (storeResult.warn && !strict) {
      warnFiles++;
    } else {
      errorFiles++;
    }
    printViolationTree("<store>  cross-graph", storeResult.violations, store);
  }

  printSummary(fileResults.length, errorFiles, warnFiles);
  return { ok: errorFiles === 0 };
}
