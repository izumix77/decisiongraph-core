import type { Violation, GraphStore } from "@decisiongraph/core";
import { traceDependencyPath, type ResolvedPath } from "@decisiongraph/core";
import type { NodeId } from "@decisiongraph/core";

export const print  = (msg: string) => process.stdout.write(msg + "\n");
export const eprint = (msg: string) => process.stderr.write(msg + "\n");

// ANSI
const R = "\x1b[31m";
const Y = "\x1b[33m";
const G = "\x1b[32m";
const D = "\x1b[2m";
const B = "\x1b[1m";
const Z = "\x1b[0m";

// ---- node label ----

function nodeLabel(store: GraphStore, nodeId: string): string {
  for (const graph of Object.values(store.graphs)) {
    const node = graph.nodes[nodeId];
    if (node) {
      const stmt = (node.payload as any)?.statement;
      return stmt ? `${nodeId}  ${D}${stmt}${Z}` : nodeId;
    }
  }
  return nodeId;
}

// ---- dependency chain ----

function renderChain(store: GraphStore, chain: ResolvedPath[]): string[] {
  const lines: string[] = [];
  for (let i = 0; i < chain.length; i++) {
    const step   = chain[i];
    const indent = "  " + "     ".repeat(i);
    const label  = nodeLabel(store, String(step.nodeId));

    if (i === 0) {
      lines.push(`${indent}${B}${label}${Z}`);
    } else {
      const statusMark =
        step.edgeStatus === "Superseded" ? ` ${R}[Superseded]${Z}` :
        step.edgeStatus === "Deprecated" ? ` ${Y}[Deprecated]${Z}` : "";
      lines.push(`${indent} ${D}└─ ${step.edgeType} →${Z} ${label}${statusMark}`);
    }
  }
  return lines;
}

// ---- path → start nodeId ----

function extractStartNodeId(
  store: GraphStore,
  path: string,
  message: string,
  payload?: Record<string, string>  // 追加
): string | null {
  // payload直接指定（最優先）
  if (payload?.fromNodeId) return payload.fromNodeId;

  // パターン1: "graphs.G:xxx.nodes.N:xxx..."
  const nodeInGraph = path.match(/nodes\.([^.]+)/);
  if (nodeInGraph) return nodeInGraph[1];

  // パターン2: "graphs.G:xxx.edges.E:xxx.from/.to"
  const edgeInGraph = path.match(/graphs\.([^.]+)\.edges\.([^.]+)/);
  if (edgeInGraph) {
    const [, gid, eid] = edgeInGraph;
    const edge = store.graphs[gid]?.edges[eid];
    if (edge) return String(edge.from);
  }

  return null;
}

// ---- single violation block ----

function renderViolation(store: GraphStore, v: Violation): string[] {
  const lines: string[] = [];
  const color = v.severity === "ERROR" ? R : v.severity === "WARN" ? Y : D;

  lines.push(`  ${color}${B}✖ ${v.severity}: ${v.message}${Z}`);
  if (v.path) lines.push(`  ${D}  at ${v.path}${Z}`);
  lines.push("");

  if (v.path) {
    const startId = extractStartNodeId(store, v.path, v.message, v.payload);
    if (startId) {
      const chain = traceDependencyPath(store, startId as NodeId);
      if (chain.length > 0) {
        lines.push(...renderChain(store, chain));
        lines.push("");
      }
    }
  }

  return lines;
}

// ---- public API ----

export function printViolationTree(
  file: string,
  violations: Violation[],
  store: GraphStore
): void {
  eprint(`\n${B}${R}✖ [${file}]${Z}\n`);
  for (const v of violations) {
    renderViolation(store, v).forEach(l => eprint(l));
  }
}

export function printSummary(
  totalFiles: number,
  errorFiles: number,
  warnFiles:  number
): void {
  print("\n" + "─".repeat(56));
  if (errorFiles === 0 && warnFiles === 0) {
    print(`\n  ${G}${B}✔ Validation passed${Z}  ${D}(${totalFiles} file(s))${Z}\n`);
  } else if (errorFiles > 0) {
    eprint(`\n  ${R}${B}✖ ${errorFiles} file(s) failed${Z}  ${D}in ${totalFiles} file(s)${Z}`);
    eprint(`\n  ${R}${B}Result: FAILED${Z}\n`);
  } else {
    print(`\n  ${Y}${B}⚠ ${warnFiles} warning(s)${Z}  ${D}in ${totalFiles} file(s)${Z}`);
    print(`\n  ${Y}${B}Result: PASSED with warnings${Z}\n`);
  }
}
