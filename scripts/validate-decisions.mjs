import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { replay } from "@decisiongraph/core";
import { lint } from "@decisiongraph/core";

/**
 * Example CI validation script.
 * Not part of the Core API surface.
 */

/**
 * Minimal deterministic validation script.
 *
 * - Reads all *.decisionlog.json files under ./decisions
 * - Replays them in filename order
 * - Runs lint
 * - Exits with code 1 on ERROR
 */

const DECISIONS_DIR = path.resolve(process.cwd(), "decisions");

function readDecisionLogs(dir) {
  if (!fs.existsSync(dir)) {
    console.error("No ./decisions directory found.");
    process.exit(1);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".decisionlog.json"))
    .sort(); // deterministic ordering

  if (files.length === 0) {
    console.error("No decision log files found.");
    process.exit(1);
  }

  return files.map((file) => {
    const fullPath = path.join(dir, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(raw);
  });
}

function main() {
  const logs = readDecisionLogs(DECISIONS_DIR);

  // Replay all logs sequentially
  let graph;
  for (const log of logs) {
    graph = replay(log, graph);
  }

  const result = lint(graph);

  if (result.errors && result.errors.length > 0) {
    console.error("✖ DecisionGraph validation failed\n");

    for (const err of result.errors) {
      console.error(`ERROR: ${err.code}`);
      if (err.message) console.error(`  ${err.message}`);
      console.error("");
    }

    process.exit(1);
  }

  console.log("✔ DecisionGraph validation passed");
}

main();
