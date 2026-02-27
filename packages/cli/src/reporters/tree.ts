import type { ViolationTrace, ResolvedPath } from "@decisiongraph/core";
import type { GraphStore } from "@decisiongraph/core";

// ANSI color codes
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GRAY   = "\x1b[90m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";
const RESET  = "\x1b[0m";

const SEVERITY_COLOR: Record<string, string> = {
  ERROR: RED,
  WARN: YELLOW,
  INFO: GRAY,
};

/**
 * Resolve a human-readable label for a node from the store.
 * Falls back to the raw ID if no statement payload is found.
 */
function nodeLabel(store: GraphStore, nodeId: string): string {
  for (const graph of Object.values(store.graphs)) {
    const node = graph.nodes[nodeId];
    if (node) {
      const stmt = (node.payload as any)?.statement;
      return stmt ? `${nodeId} — ${stmt}` : nodeId;
    }
  }
  return nodeId;
}

/**
 * Render a single violation with its dependency chain as a tree.
 *
 * Example output:
 *
 *   ✖ ERROR: Dependency on Superseded Decision
 *
 *   ADR-2026-005 — Use passkey auth
 *    └─ depends_on → ADR-2024-012 — Original auth decision
 *         status: Superseded
 *
 */
function renderViolationTree(
  store: GraphStore,
  trace: ViolationTrace,
  index: number
): string {
  const lines: string[] = [];
  const color = SEVERITY_COLOR[trace.severity] ?? GRAY;

  lines.push(`  ${color}${BOLD}✖ ${trace.severity}: ${trace.message}${RESET}`);
  if (trace.path) {
    lines.push(`  ${DIM}  at ${trace.path}${RESET}`);
  }
  lines.push("");

  if (trace.chain.length > 0) {
    renderChain(store, trace.chain, lines);
  }

  lines.push("");
  return lines.join("\n");
}

function renderChain(
  store: GraphStore,
  chain: ResolvedPath[],
  lines: string[],
): void {
  for (let i = 0; i < chain.length; i++) {
    const step = chain[i];
    const indent = "  " + "     ".repeat(i);
    const label = nodeLabel(store, String(step.nodeId));

    if (i === 0) {
      lines.push(`${indent}${BOLD}${label}${RESET}`);
    } else {
      const edgeLabel = step.edgeType ?? "→";
      const statusMark =
        step.edgeStatus === "Superseded"
          ? ` ${RED}[Superseded]${RESET}`
          : step.edgeStatus === "Deprecated"
          ? ` ${YELLOW}[Deprecated]${RESET}`
          : "";

      lines.push(`${indent} ${GRAY}└─ ${edgeLabel} →${RESET} ${label}${statusMark}`);
    }
  }
}

/**
 * Main entry point for the tree reporter.
 * Renders all violations grouped by severity.
 */
export function renderTreeReport(
  store: GraphStore,
  traces: ViolationTrace[],
  options: { filePath?: string; graphId?: string } = {}
): string {
  const lines: string[] = [];

  if (options.filePath) {
    lines.push(`\n${BOLD}File: ${options.filePath}${RESET}`);
    if (options.graphId) {
      lines.push(`${DIM}Graph: ${options.graphId}${RESET}`);
    }
    lines.push("");
  }

  const errors = traces.filter((t) => t.severity === "ERROR");
  const warns  = traces.filter((t) => t.severity === "WARN");
  const infos  = traces.filter((t) => t.severity === "INFO");

  for (const [i, trace] of [...errors, ...warns, ...infos].entries()) {
    lines.push(renderViolationTree(store, trace, i));
  }

  return lines.join("\n");
}

/**
 * Render the final summary line.
 */
export function renderSummary(
  errorCount: number,
  warnCount: number,
  fileCount: number
): string {
  const lines: string[] = [];
  lines.push("─".repeat(60));

  if (errorCount === 0 && warnCount === 0) {
    lines.push(`\n  ${BOLD}\x1b[32m✔ Validation passed${RESET}  ${DIM}(${fileCount} file(s) checked)${RESET}\n`);
  } else {
    if (errorCount > 0) {
      lines.push(`\n  ${RED}${BOLD}✖ ${errorCount} error(s)${RESET}  ${YELLOW}${warnCount} warning(s)${RESET}  ${DIM}in ${fileCount} file(s)${RESET}`);
      lines.push(`\n  ${RED}${BOLD}Result: FAILED${RESET}\n`);
    } else {
      lines.push(`\n  ${YELLOW}${BOLD}⚠ ${warnCount} warning(s)${RESET}  ${DIM}in ${fileCount} file(s)${RESET}`);
      lines.push(`\n  ${YELLOW}${BOLD}Result: PASSED with warnings${RESET}\n`);
    }
  }

  return lines.join("\n");
}
