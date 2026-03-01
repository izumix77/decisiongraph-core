import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  applyBatch,
  emptyStore,
  lintStore,
  ConstitutionalPolicy
} from "../packages/core/dist/index.js";

/**
 * Deterministic CI validation script (v0.3 GraphStore API).
 *
 * - Reads all *.decisionlog.json files under ./decisions
 * - Replays them in filename order into a single GraphStore
 * - Runs lintStore after all files are applied (catches DEPENDENCY_ON_SUPERSEDED etc.)
 * - Exits with code 1 if any ERROR-level violation is found
 *
 * Color control (no external dependencies):
 *   --no-color flag  : disable ANSI colors
 *   NO_COLOR=1 env   : disable ANSI colors (https://no-color.org)
 *   Non-TTY stdout   : colors auto-disabled (pipe / redirect)
 */

// ─── Color support detection ───────────────────────────────────────────────────

const NO_COLOR =
  process.env.NO_COLOR !== undefined ||
  process.argv.includes("--no-color") ||
  !process.stdout.isTTY;

const ansi   = (code) => (NO_COLOR ? "" : `\x1b[${code}m`);
const reset  = ()     => ansi("0");
const bold   = (s)    => `${ansi("1")}${s}${reset()}`;
const dim    = (s)    => `${ansi("2")}${s}${reset()}`;
const green  = (s)    => `${ansi("32")}${s}${reset()}`;
const red    = (s)    => `${ansi("31")}${s}${reset()}`;
const yellow = (s)    => `${ansi("33")}${s}${reset()}`;
const cyan   = (s)    => `${ansi("36")}${s}${reset()}`;

// ─── Logging helpers ───────────────────────────────────────────────────────────

const out = (msg) => process.stdout.write(msg + "\n");
const err = (msg) => process.stderr.write(msg + "\n");

// ─── File loader ───────────────────────────────────────────────────────────────

const DECISIONS_DIR = path.resolve(process.cwd(), "decisions");

function readDecisionLogs(dir) {
  if (!fs.existsSync(dir)) {
    err(red("✖") + " No ./decisions directory found.");
    process.exit(1);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".decisionlog.json"))
    .sort();

  if (files.length === 0) {
    err(red("✖") + " No decision log files found.");
    process.exit(1);
  }

  return files.map((file) => {
    const fullPath = path.join(dir, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    return { file, log: JSON.parse(raw) };
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const entries = readDecisionLogs(DECISIONS_DIR);

  out(dim(`Resolving GraphStore from ${DECISIONS_DIR} ...`));
  out("");

  const policy = new ConstitutionalPolicy();
  let store = emptyStore();
  let hasError = false;

  // ── Phase 1: apply all files ──────────────────────────────────────────────
  for (const { file, log: decisionLog } of entries) {
    const { graphId, ops } = decisionLog;

    if (!graphId) {
      err(`${red("✖")} ${cyan(`[${file}]`)}  ${red("missing graphId")}`);
      hasError = true;
      continue;
    }

    const result = applyBatch(store, graphId, ops, policy);
    store = result.store;

    const applied  = result.events.filter((e) => e.type === "applied");
    const rejected = result.events.filter((e) => e.type === "rejected");

    if (rejected.length === 0) {
      out(`${green("✔")} ${cyan(`[${file}]`)}  ${dim(`${applied.length} op(s) applied`)}`);
    } else {
      out(`${red("✖")} ${cyan(`[${file}]`)}  ${dim(`${rejected.length} op(s) rejected`)}`);

      for (const event of rejected) {
        hasError = true;
        err("");
        err(`  ${bold(red(event.opType))} rejected`);

        if (event.error.violations) {
          for (const v of event.error.violations) {
            const prefix =
              v.severity === "ERROR" ? red("  ERROR") :
              v.severity === "WARN"  ? yellow("  WARN ") :
                                       dim("  INFO ");
            err(`${prefix}  ${bold(v.code)}`);
            err(`         ${dim(v.message)}`);
            if (v.path) err(`         ${dim("path: ")}${dim(v.path)}`);
          }
        } else if (event.error.message) {
          err(`  ${dim(event.error.message)}`);
        }
      }
    }
  }

  // ── Phase 2: lintStore — cross-graph & superseded dependency check ────────
  out("");
  out(dim("Running store-wide lint ..."));

  const lintResult = lintStore(store, policy);

  if (!lintResult.ok) {
    for (const v of lintResult.violations) {
      hasError = hasError || v.severity === "ERROR";

      const prefix =
        v.severity === "ERROR" ? red("  ERROR") :
        v.severity === "WARN"  ? yellow("  WARN ") :
                                 dim("  INFO ");
      err("");
      err(`${prefix}  ${bold(v.code)}`);
      err(`         ${dim(v.message)}`);
      if (v.path) err(`         ${dim("path: ")}${dim(v.path)}`);
    }
  } else {
    out(`${green("✔")} ${dim("store-wide lint passed")}`);
  }

  // ── Result ────────────────────────────────────────────────────────────────
  out("");
  out(dim("─".repeat(50)));

  if (hasError) {
    err(`${red("✖")} ${bold("DecisionGraph validation failed")}`);
    err(dim("exit code 1"));
    process.exit(1);
  }

  out(`${green("✔")} ${bold("DecisionGraph validation passed")}`);
}

main();
