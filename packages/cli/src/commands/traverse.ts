import { resolve } from "node:path";
import { statSync } from "node:fs";
import { cmdLintDir } from "./lint.js";
import { printViolationTree, printSummary, print, eprint } from "../reporters/pretty.js";

export function cmdTraverse(dir: string): { ok: boolean } {
  const resolved = resolve(dir);

  if (!statSync(resolved).isDirectory()) {
    eprint("traverse requires a directory");
    return { ok: false };
  }

  const { results, store } = cmdLintDir(resolved);

  let errorFiles = 0;
  let warnFiles  = 0;
  const fileResults = results.filter(r => r.file !== "<store>");
  const storeResult = results.find(r => r.file === "<store>");

  for (const r of fileResults) {
    if (r.ok) {
      print(`  ✔ [${r.file}]`);
    } else {
      errorFiles++;
      printViolationTree(r.file, r.violations, store);
    }
  }

  // cross-graph違反はまとめて最後に表示
  if (storeResult && !storeResult.ok) {
    errorFiles++;
    printViolationTree("<store>  cross-graph", storeResult.violations, store);
  }

  printSummary(fileResults.length, errorFiles, warnFiles);

  return { ok: errorFiles === 0 };
}
