#!/usr/bin/env bash
set -euo pipefail

# ===== config =====
ROOT="$(pwd)"
REPO_NAME="$(basename "$ROOT")"

mkdir -p \
  .github/workflows \
  .github/ISSUE_TEMPLATE \
  packages/core/src/{domain,policy,kernel} \
  packages/core/test/{unit,constitutional} \
  packages/schema/schemas/v0.2 \
  packages/schema/src \
  packages/schema/test \
  packages/io-json/src \
  packages/io-json/test \
  packages/cli/src/{commands,reporters} \
  packages/cli/bin \
  packages/cli/test \
  docs/constitution/v0.2 \
  demo/examples/adr-sample/decisions \
  scripts

# ---------- root files ----------
cat > .editorconfig <<'EOF'
root = true
[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
indent_style = space
indent_size = 2
EOF

cat > .gitignore <<'EOF'
node_modules
dist
coverage
.DS_Store
.env
*.log
EOF

cat > pnpm-workspace.yaml <<'EOF'
packages:
  - "packages/*"
EOF

cat > turbo.json <<'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["^build"], "outputs": [] },
    "typecheck": { "dependsOn": ["^build"], "outputs": [] }
  }
}
EOF

cat > tsconfig.base.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "outDir": "dist"
  }
}
EOF

cat > package.json <<'EOF'
{
  "name": "decisiongraph-core",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo build",
    "test": "turbo test",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
EOF

cat > README.md <<'EOF'
# DecisionGraph Core

DecisionGraph Core is a deterministic kernel for recording, traversing, and replaying human decisions as graph assets.

## Non-goals
- No AI reasoning
- No probabilistic behavior
- No random IDs
- No workflow/permissions system (belongs to higher layers)

## Packages
- @decisiongraph/core: pure kernel (no JSON schema, no AJV)
- @decisiongraph/schema: JSON Schema + AJV validator
- @decisiongraph/io-json: JSON <-> core mapping + normalization
- @decisiongraph/cli: CLI wrapper

EOF

cat > LICENSE <<'EOF'
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
EOF

cat > CONTRIBUTING.md <<'EOF'
# Contributing
- Keep @decisiongraph/core deterministic and pure.
- No random ID generation.
- No IO in core.
EOF

cat > SECURITY.md <<'EOF'
# Security
Please report security issues privately.
EOF

cat > CHANGELOG.md <<'EOF'
# Changelog
## 0.0.0
- Initial scaffold
EOF

cat > CODE_OF_CONDUCT.md <<'EOF'
# Code of Conduct
Be kind. Assume good faith.
EOF

# ---------- github templates ----------
cat > .github/PULL_REQUEST_TEMPLATE.md <<'EOF'
## What
## Why
## How tested
EOF

cat > .github/CODEOWNERS <<'EOF'
* @your-github-handle
EOF

cat > .github/ISSUE_TEMPLATE/bug_report.md <<'EOF'
---
name: Bug report
about: Report a bug
---
## What happened
## Expected
## Repro steps
EOF

cat > .github/ISSUE_TEMPLATE/feature_request.md <<'EOF'
---
name: Feature request
about: Suggest an idea
---
## Proposal
## Rationale
EOF

cat > .github/ISSUE_TEMPLATE/constitution_question.md <<'EOF'
---
name: Constitution question
about: Ask about constitutional boundaries
---
## Question
## Why it matters
EOF

cat > .github/workflows/ci.yml <<'EOF'
name: CI
on:
  push:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm i
      - run: pnpm build
      - run: pnpm test
      - run: pnpm typecheck
EOF

cat > .github/workflows/publish.yml <<'EOF'
name: Publish
on:
  workflow_dispatch:
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: echo "TODO: configure publishing"
EOF

cat > .github/workflows/security-audit.yml <<'EOF'
name: Security Audit
on:
  schedule:
    - cron: "0 3 * * 1"
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm i
      - run: pnpm audit --audit-level=high || true
EOF

# ---------- docs placeholders ----------
cat > docs/constitution/v0.2/Constitution.md <<'EOF'
# DecisionGraph Core Constitution (v0.2)
- Deterministic kernel
- Records / traverses / replays decisions
- Kernel does not judge correctness
EOF

cat > docs/constitution/v0.2/Minimal_Kernel_API.md <<'EOF'
# Minimal Kernel API (v0.2)
- apply / applyBatch
- lint
- replay / replayAt
- diff
EOF

cat > docs/constitution/v0.2/JSON_Schema.md <<'EOF'
# JSON Schema (v0.2)
DecisionLog JSON format definition.
EOF

# ---------- demo ----------
cat > demo/examples/adr-sample/README.md <<'EOF'
# ADR Sample
Example decision log in JSON v0.2.
EOF

cat > demo/examples/adr-sample/decisions/ADR-001.v0.2.json <<'EOF'
{
  "version": "0.2",
  "ops": [
    {
      "type": "add_node",
      "node": {
        "id": "N:adr-001",
        "kind": "ADR",
        "status": "Active",
        "createdAt": "2026-02-06T00:00:00.000Z",
        "author": "A:izzy",
        "payload": { "title": "Example ADR" }
      }
    },
    { "type": "commit", "commitId": "C:1", "createdAt": "2026-02-06T00:00:01.000Z", "author": "A:izzy" }
  ]
}
EOF

# ---------- scripts placeholders ----------
cat > scripts/validate-constitution.ts <<'EOF'
console.log("TODO: validate constitution invariants across packages");
EOF

cat > scripts/verify-determinism.ts <<'EOF'
console.log("TODO: verify determinism (no randomness, stable ordering)");
EOF

# =========================
# packages/core
# =========================
cat > packages/core/package.json <<'EOF'
{
  "name": "@decisiongraph/core",
  "version": "0.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "typescript": "^5.5.0"
  }
}
EOF

cat > packages/core/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src"
  },
  "include": ["src", "test"]
}
EOF

cat > packages/core/README.md <<'EOF'
# @decisiongraph/core
Pure deterministic kernel. No IO, no random IDs, no JSON schema deps.
EOF

cat > packages/core/src/domain/ids.ts <<'EOF'
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type NodeId = Brand<string, "NodeId">;
export type EdgeId = Brand<string, "EdgeId">;
export type AuthorId = Brand<string, "AuthorId">;
export type CommitId = Brand<string, "CommitId">;

export const asNodeId = (s: string): NodeId => s as NodeId;
export const asEdgeId = (s: string): EdgeId => s as EdgeId;
export const asAuthorId = (s: string): AuthorId => s as AuthorId;
export const asCommitId = (s: string): CommitId => s as CommitId;
EOF

cat > packages/core/src/domain/time.ts <<'EOF'
export type IsoTimestamp = string;
export const isIsoTimestamp = (s: string): boolean => {
  // minimal check; stricter validation can live in schema/io layer
  return typeof s === "string" && s.includes("T") && s.endsWith("Z");
};
EOF

cat > packages/core/src/domain/types.ts <<'EOF'
import type { AuthorId, CommitId, EdgeId, NodeId } from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type NodeStatus = "Active" | "Superseded" | "Deprecated";
export type EdgeStatus = "Active" | "Superseded" | "Deprecated";
export type EdgeType = "depends_on" | "supports" | "refutes" | "overrides" | "supersedes";

export type Node = {
  id: NodeId;
  kind: string;
  status: NodeStatus;
  createdAt: IsoTimestamp;
  author: AuthorId;
  payload?: unknown;
};

export type Edge = {
  id: EdgeId;
  type: EdgeType;
  from: NodeId;
  to: NodeId;
  status: EdgeStatus;
  createdAt: IsoTimestamp;
  author: AuthorId;
  payload?: unknown;
};

export type Commit = {
  commitId: CommitId;
  createdAt: IsoTimestamp;
  author: AuthorId;
};

export type Graph = {
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  commits: Commit[];
};

export type AddNodeOp = { type: "add_node"; node: Node };
export type AddEdgeOp = { type: "add_edge"; edge: Edge };
export type SupersedeEdgeOp = { type: "supersede_edge"; oldEdgeId: EdgeId; newEdge: Edge };
export type CommitOp = { type: "commit"; commitId: CommitId; createdAt: IsoTimestamp; author: AuthorId };

export type Operation = AddNodeOp | AddEdgeOp | SupersedeEdgeOp | CommitOp;

export type Violation = {
  code: string;
  message: string;
  path?: string;
};
EOF

cat > packages/core/src/policy/policy.ts <<'EOF'
import type { Graph, Operation, Violation } from "../domain/types.js";

export interface Policy {
  validateOperation(graph: Graph, op: Operation): Violation[];
  validateGraph(graph: Graph): Violation[];
}
EOF

cat > packages/core/src/policy/constitutional.ts <<'EOF'
import type { Policy } from "./policy.js";
import type { Graph, Operation, Violation } from "../domain/types.js";

const v = (code: string, message: string, path?: string): Violation => ({ code, message, path });

export class ConstitutionalPolicy implements Policy {
  validateOperation(graph: Graph, op: Operation): Violation[] {
    const violations: Violation[] = [];

    const hasCommit = graph.commits.length > 0;

    // author required for mutating ops
    if (op.type === "add_node") {
      if (!op.node.author) violations.push(v("AUTHOR_REQUIRED", "author is required", "op.node.author"));
      if (hasCommit) violations.push(v("IMMUTABLE_AFTER_COMMIT", "graph is immutable after commit", "graph.commits"));
    }

    if (op.type === "add_edge") {
      if (!op.edge.author) violations.push(v("AUTHOR_REQUIRED", "author is required", "op.edge.author"));
      if (hasCommit) violations.push(v("IMMUTABLE_AFTER_COMMIT", "graph is immutable after commit", "graph.commits"));
    }

    if (op.type === "supersede_edge") {
      if (!op.newEdge.author) violations.push(v("AUTHOR_REQUIRED", "author is required", "op.newEdge.author"));
      if (hasCommit) violations.push(v("IMMUTABLE_AFTER_COMMIT", "graph is immutable after commit", "graph.commits"));
      // old edge must exist
      if (!graph.edges[String(op.oldEdgeId)]) {
        violations.push(v("EDGE_NOT_FOUND", "oldEdgeId not found", "op.oldEdgeId"));
      }
    }

    if (op.type === "commit") {
      if (!op.author) violations.push(v("AUTHOR_REQUIRED", "author is required", "op.author"));
      // allow multiple commits; append-only
      // but commitId must be unique
      if (graph.commits.some(c => String(c.commitId) === String(op.commitId))) {
        violations.push(v("COMMIT_ID_DUP", "commitId already exists", "op.commitId"));
      }
    }

    // deterministic order
    violations.sort((a, b) => (a.code + (a.path ?? "")).localeCompare(b.code + (b.path ?? "")));
    return violations;
  }

  validateGraph(_graph: Graph): Violation[] {
    // keep minimal: graph-level checks can be added later
    return [];
  }
}
EOF

cat > packages/core/src/policy/index.ts <<'EOF'
export * from "./policy.js";
export * from "./constitutional.js";
EOF

cat > packages/core/src/kernel/errors.ts <<'EOF'
import type { Violation } from "../domain/types.js";

export type KernelError = {
  kind: "PolicyViolation" | "UnknownOperation";
  violations?: Violation[];
  message?: string;
};

export const policyError = (violations: Violation[]): KernelError => ({
  kind: "PolicyViolation",
  violations
});
EOF

cat > packages/core/src/kernel/apply.ts <<'EOF'
import type { Graph, Operation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";
import { policyError, type KernelError } from "./errors.js";

export type ApplyEvent =
  | { type: "applied"; opType: Operation["type"] }
  | { type: "rejected"; opType: Operation["type"]; error: KernelError };

export type ApplyResult = { graph: Graph; events: ApplyEvent[] };

export const emptyGraph = (): Graph => ({ nodes: {}, edges: {}, commits: [] });

export function apply(graph: Graph, op: Operation, policy: Policy): ApplyResult {
  const violations = policy.validateOperation(graph, op);
  if (violations.length > 0) {
    return {
      graph,
      events: [{ type: "rejected", opType: op.type, error: policyError(violations) }]
    };
  }

  const next: Graph = {
    nodes: { ...graph.nodes },
    edges: { ...graph.edges },
    commits: [...graph.commits]
  };

  if (op.type === "add_node") {
    next.nodes[String(op.node.id)] = op.node;
  } else if (op.type === "add_edge") {
    next.edges[String(op.edge.id)] = op.edge;
  } else if (op.type === "supersede_edge") {
    const old = next.edges[String(op.oldEdgeId)];
    if (old) {
      next.edges[String(op.oldEdgeId)] = { ...old, status: "Superseded" };
    }
    next.edges[String(op.newEdge.id)] = op.newEdge;
  } else if (op.type === "commit") {
    next.commits.push({ commitId: op.commitId, createdAt: op.createdAt, author: op.author });
  } else {
    return {
      graph,
      events: [{ type: "rejected", opType: (op as any).type ?? "unknown", error: { kind: "UnknownOperation", message: "unknown operation" } }]
    };
  }

  return { graph: next, events: [{ type: "applied", opType: op.type }] };
}

export function applyBatch(graph: Graph, ops: Operation[], policy: Policy): ApplyResult {
  let g = graph;
  const events: ApplyEvent[] = [];
  for (const op of ops) {
    const r = apply(g, op, policy);
    g = r.graph;
    events.push(...r.events);
  }
  return { graph: g, events };
}
EOF

cat > packages/core/src/kernel/lint.ts <<'EOF'
import type { Graph, Violation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";

export type LintResult = { ok: true } | { ok: false; violations: Violation[] };

export function lint(graph: Graph, policy: Policy): LintResult {
  const violations = policy.validateGraph(graph);
  if (violations.length > 0) return { ok: false, violations };
  return { ok: true };
}
EOF

cat > packages/core/src/kernel/replay.ts <<'EOF'
import type { Graph, Operation } from "../domain/types.js";
import type { Policy } from "../policy/policy.js";
import { applyBatch, emptyGraph } from "./apply.js";

export function replay(ops: Operation[], policy: Policy): Graph {
  return applyBatch(emptyGraph(), ops, policy).graph;
}

export function replayAt(ops: Operation[], commitId: string, policy: Policy): Graph {
  // replay until matching commitId applied (inclusive)
  const g0 = emptyGraph();
  let g = g0;
  for (const op of ops) {
    const r = applyBatch(g, [op], policy);
    g = r.graph;
    if (op.type === "commit" && String(op.commitId) === commitId) break;
  }
  return g;
}
EOF

cat > packages/core/src/kernel/diff.ts <<'EOF'
import type { Graph } from "../domain/types.js";

export type DiffResult = {
  addedNodes: string[];
  removedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
  changedNodes: string[];
  changedEdges: string[];
};

const keys = (o: Record<string, unknown>) => Object.keys(o).sort();

export function diff(a: Graph, b: Graph): DiffResult {
  const aN = keys(a.nodes);
  const bN = keys(b.nodes);
  const aE = keys(a.edges);
  const bE = keys(b.edges);

  const setA = new Set(aN), setB = new Set(bN);
  const addedNodes = bN.filter(k => !setA.has(k));
  const removedNodes = aN.filter(k => !setB.has(k));
  const changedNodes = aN.filter(k => setB.has(k) && JSON.stringify(a.nodes[k]) !== JSON.stringify(b.nodes[k]));

  const setAE = new Set(aE), setBE = new Set(bE);
  const addedEdges = bE.filter(k => !setAE.has(k));
  const removedEdges = aE.filter(k => !setBE.has(k));
  const changedEdges = aE.filter(k => setBE.has(k) && JSON.stringify(a.edges[k]) !== JSON.stringify(b.edges[k]));

  return { addedNodes, removedNodes, addedEdges, removedEdges, changedNodes, changedEdges };
}
EOF

cat > packages/core/src/kernel/index.ts <<'EOF'
export * from "./apply.js";
export * from "./lint.js";
export * from "./replay.js";
export * from "./diff.js";
export * from "./errors.js";
EOF

cat > packages/core/src/index.ts <<'EOF'
export * from "./domain/ids.js";
export * from "./domain/time.js";
export * from "./domain/types.js";
export * from "./policy/index.js";
export * from "./kernel/index.js";
EOF

cat > packages/core/test/constitutional/core.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { ConstitutionalPolicy } from "../../src/policy/constitutional.js";
import { emptyGraph, apply } from "../../src/kernel/apply.js";
import { asAuthorId, asCommitId, asEdgeId, asNodeId } from "../../src/domain/ids.js";

describe("ConstitutionalPolicy invariants", () => {
  it("missing author on add_node => rejected", () => {
    const policy = new ConstitutionalPolicy();
    const g = emptyGraph();
    const r = apply(g, {
      type: "add_node",
      node: {
        id: asNodeId("N:1"),
        kind: "Test",
        status: "Active",
        createdAt: "2026-02-06T00:00:00.000Z",
        // @ts-expect-error - intentional missing author
        author: undefined
      }
    } as any, policy);

    expect(r.events[0]?.type).toBe("rejected");
  });

  it("supersede_edge does not delete old edge", () => {
    const policy = new ConstitutionalPolicy();
    let g = emptyGraph();

    g = apply(g, {
      type: "add_node",
      node: { id: asNodeId("N:1"), kind: "K", status: "Active", createdAt: "2026-02-06T00:00:00.000Z", author: asAuthorId("A:x") }
    }, policy).graph;

    g = apply(g, {
      type: "add_node",
      node: { id: asNodeId("N:2"), kind: "K", status: "Active", createdAt: "2026-02-06T00:00:00.000Z", author: asAuthorId("A:x") }
    }, policy).graph;

    g = apply(g, {
      type: "add_edge",
      edge: { id: asEdgeId("E:1"), type: "supports", from: asNodeId("N:1"), to: asNodeId("N:2"), status: "Active", createdAt: "2026-02-06T00:00:00.000Z", author: asAuthorId("A:x") }
    }, policy).graph;

    g = apply(g, {
      type: "supersede_edge",
      oldEdgeId: asEdgeId("E:1"),
      newEdge: { id: asEdgeId("E:2"), type: "supports", from: asNodeId("N:1"), to: asNodeId("N:2"), status: "Active", createdAt: "2026-02-06T00:00:01.000Z", author: asAuthorId("A:x") }
    }, policy).graph;

    expect(g.edges["E:1"]?.status).toBe("Superseded");
    expect(g.edges["E:2"]?.status).toBe("Active");
  });

  it("after commit, add_edge is rejected", () => {
    const policy = new ConstitutionalPolicy();
    let g = emptyGraph();

    g = apply(g, {
      type: "commit",
      commitId: asCommitId("C:1"),
      createdAt: "2026-02-06T00:00:00.000Z",
      author: asAuthorId("A:x")
    }, policy).graph;

    const r = apply(g, {
      type: "add_edge",
      edge: { id: asEdgeId("E:1"), type: "supports", from: asNodeId("N:1"), to: asNodeId("N:2"), status: "Active", createdAt: "2026-02-06T00:00:01.000Z", author: asAuthorId("A:x") }
    }, policy);

    expect(r.events[0]?.type).toBe("rejected");
  });
});
EOF

# =========================
# packages/schema
# =========================
cat > packages/schema/package.json <<'EOF'
{
  "name": "@decisiongraph/schema",
  "version": "0.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "ajv": "^8.12.0",
    "ajv-formats": "^3.0.1"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "typescript": "^5.5.0"
  }
}
EOF

cat > packages/schema/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "resolveJsonModule": true
  },
  "include": ["src", "schemas", "test"]
}
EOF

cat > packages/schema/README.md <<'EOF'
# @decisiongraph/schema
JSON Schema v0.2 + AJV validator for DecisionLog JSON.
EOF

cat > packages/schema/schemas/v0.2/decision.schema.json <<'EOF'
{
  "$id": "https://decisiongraph.dev/schemas/decisionlog.v0.2.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["version", "ops"],
  "properties": {
    "version": { "const": "0.2" },
    "ops": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type"],
        "properties": {
          "type": { "type": "string" }
        },
        "additionalProperties": true
      }
    }
  },
  "additionalProperties": false
}
EOF

cat > packages/schema/src/ajv.ts <<'EOF'
import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "../schemas/v0.2/decision.schema.json";

export function buildAjv() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(schema);
  return ajv;
}

export const schemaId = (schema as any).$id as string;
EOF

cat > packages/schema/src/errors.ts <<'EOF'
export const formatAjvErrors = (errors: any[] | null | undefined): string[] => {
  if (!errors) return ["Unknown validation error"];
  return errors.map(e => `${e.instancePath || "/"} ${e.message ?? "invalid"}`.trim());
};
EOF

cat > packages/schema/src/validate.ts <<'EOF'
import { buildAjv, schemaId } from "./ajv.js";
import { formatAjvErrors } from "./errors.js";

export type DecisionLogJson = { version: "0.2"; ops: unknown[] };

export function validateDecisionJson(input: unknown):
  | { ok: true; value: DecisionLogJson }
  | { ok: false; errors: string[] } {

  const ajv = buildAjv();
  const validate = ajv.getSchema(schemaId);
  if (!validate) return { ok: false, errors: ["Validator not found"] };

  const ok = validate(input);
  if (!ok) return { ok: false, errors: formatAjvErrors(validate.errors) };

  return { ok: true, value: input as DecisionLogJson };
}
EOF

cat > packages/schema/src/index.ts <<'EOF'
export * from "./validate.js";
EOF

cat > packages/schema/test/schema.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { validateDecisionJson } from "../src/validate.js";

describe("schema", () => {
  it("rejects invalid version / missing ops", () => {
    const r1 = validateDecisionJson({ version: "0.1", ops: [] });
    expect(r1.ok).toBe(false);

    const r2 = validateDecisionJson({ version: "0.2" });
    expect(r2.ok).toBe(false);
  });
});
EOF

# =========================
# packages/io-json
# =========================
cat > packages/io-json/package.json <<'EOF'
{
  "name": "@decisiongraph/io-json",
  "version": "0.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@decisiongraph/core": "workspace:*"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "typescript": "^5.5.0"
  }
}
EOF

cat > packages/io-json/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src" },
  "include": ["src", "test"]
}
EOF

cat > packages/io-json/README.md <<'EOF'
# @decisiongraph/io-json
Decode/encode normalized DecisionLog JSON into core operations.
This layer is pure (no fs). Runtime checks included.
EOF

cat > packages/io-json/src/version.ts <<'EOF'
export const DECISIONLOG_VERSION = "0.2" as const;
export type DecisionLogVersion = typeof DECISIONLOG_VERSION;
EOF

cat > packages/io-json/src/normalize.ts <<'EOF'
export function normalizeDecisionLog<T>(json: T): T {
  // Minimal canonicalization: deep-sort object keys.
  const sortKeys = (v: any): any => {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v && typeof v === "object") {
      const out: any = {};
      for (const k of Object.keys(v).sort()) out[k] = sortKeys(v[k]);
      return out;
    }
    return v;
  };
  return sortKeys(json);
}
EOF

cat > packages/io-json/src/decode.ts <<'EOF'
import {
  asAuthorId,
  asCommitId,
  asEdgeId,
  asNodeId,
  type Operation,
  type Node,
  type Edge
} from "@decisiongraph/core";
import type { DecisionLogJson } from "@decisiongraph/schema";

const err = (m: string) => new Error(m);

const isObj = (x: unknown): x is Record<string, any> => !!x && typeof x === "object" && !Array.isArray(x);

function reqStr(o: Record<string, any>, k: string): string {
  const v = o[k];
  if (typeof v !== "string") throw err(`Expected string at ${k}`);
  return v;
}

function decodeNode(o: any): Node {
  if (!isObj(o)) throw err("node must be object");
  return {
    id: asNodeId(reqStr(o, "id")),
    kind: reqStr(o, "kind"),
    status: reqStr(o, "status") as any,
    createdAt: reqStr(o, "createdAt"),
    author: asAuthorId(reqStr(o, "author")),
    payload: o["payload"]
  };
}

function decodeEdge(o: any): Edge {
  if (!isObj(o)) throw err("edge must be object");
  return {
    id: asEdgeId(reqStr(o, "id")),
    type: reqStr(o, "type") as any,
    from: asNodeId(reqStr(o, "from")),
    to: asNodeId(reqStr(o, "to")),
    status: reqStr(o, "status") as any,
    createdAt: reqStr(o, "createdAt"),
    author: asAuthorId(reqStr(o, "author")),
    payload: o["payload"]
  };
}

export function decodeDecisionLog(json: DecisionLogJson): Operation[] {
  if (json.version !== "0.2") throw err(`Unsupported version: ${json.version}`);
  const ops = json.ops;
  if (!Array.isArray(ops)) throw err("ops must be array");

  return ops.map((raw) => {
    if (!isObj(raw)) throw err("op must be object");
    const t = reqStr(raw, "type");

    if (t === "add_node") return { type: "add_node", node: decodeNode(raw["node"]) };
    if (t === "add_edge") return { type: "add_edge", edge: decodeEdge(raw["edge"]) };
    if (t === "supersede_edge") {
      return {
        type: "supersede_edge",
        oldEdgeId: asEdgeId(reqStr(raw, "oldEdgeId")),
        newEdge: decodeEdge(raw["newEdge"])
      };
    }
    if (t === "commit") {
      return {
        type: "commit",
        commitId: asCommitId(reqStr(raw, "commitId")),
        createdAt: reqStr(raw, "createdAt"),
        author: asAuthorId(reqStr(raw, "author"))
      };
    }
    throw err(`Unknown op type: ${t}`);
  });
}
EOF

cat > packages/io-json/src/encode.ts <<'EOF'
import type { Operation } from "@decisiongraph/core";
import type { DecisionLogJson } from "@decisiongraph/schema";

export function encodeDecisionLog(ops: Operation[]): DecisionLogJson {
  return {
    version: "0.2",
    ops: ops as any
  };
}
EOF

cat > packages/io-json/src/index.ts <<'EOF'
export * from "./version.js";
export * from "./normalize.js";
export * from "./decode.js";
export * from "./encode.js";
EOF

cat > packages/io-json/test/io.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { decodeDecisionLog } from "../src/decode.js";

describe("io-json", () => {
  it("decodes basic log", () => {
    const ops = decodeDecisionLog({ version: "0.2", ops: [{ type: "commit", commitId: "C:1", createdAt: "2026-02-06T00:00:00.000Z", author: "A:x" }] } as any);
    expect(ops.length).toBe(1);
  });
});
EOF

# =========================
# packages/cli
# =========================
cat > packages/cli/package.json <<'EOF'
{
  "name": "@decisiongraph/cli",
  "version": "0.0.0",
  "type": "module",
  "bin": {
    "decisiongraph": "bin/decisiongraph"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json && node ./bin/decisiongraph --help >/dev/null",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@decisiongraph/core": "workspace:*",
    "@decisiongraph/schema": "workspace:*",
    "@decisiongraph/io-json": "workspace:*"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "typescript": "^5.5.0"
  }
}
EOF

cat > packages/cli/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src"
  },
  "include": ["src", "test"]
}
EOF

cat > packages/cli/README.md <<'EOF'
# @decisiongraph/cli
CLI wrapper: validate/lint/replay/diff for DecisionLog JSON v0.2.
EOF

cat > packages/cli/bin/decisiongraph <<'EOF'
#!/usr/bin/env node
import { main } from "../dist/cli.js";
main(process.argv.slice(2)).catch((e) => {
  console.error(String(e?.message ?? e));
  process.exit(1);
});
EOF
chmod +x packages/cli/bin/decisiongraph

cat > packages/cli/src/reporters/pretty.ts <<'EOF'
export const print = (msg: string) => process.stdout.write(msg + "\n");
export const eprint = (msg: string) => process.stderr.write(msg + "\n");
EOF

cat > packages/cli/src/reporters/json.ts <<'EOF'
export const printJson = (obj: unknown) => process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
EOF

cat > packages/cli/src/commands/validate.ts <<'EOF'
import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";

export function cmdValidate(path: string): { ok: true } | { ok: false; errors: string[] } {
  const raw = readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  const r = validateDecisionJson(json);
  if (!r.ok) return { ok: false, errors: r.errors };
  return { ok: true };
}
EOF

cat > packages/cli/src/commands/lint.ts <<'EOF'
import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";
import { normalizeDecisionLog, decodeDecisionLog } from "@decisiongraph/io-json";
import { ConstitutionalPolicy, replay, lint } from "@decisiongraph/core";

export function cmdLint(path: string) {
  const raw = readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  const vr = validateDecisionJson(json);
  if (!vr.ok) return { ok: false as const, errors: vr.errors };

  const normalized = normalizeDecisionLog(vr.value);
  const ops = decodeDecisionLog(normalized);
  const policy = new ConstitutionalPolicy();
  const g = replay(ops, policy);
  const lr = lint(g, policy);

  if (!lr.ok) return { ok: false as const, errors: lr.violations.map(v => `${v.code}: ${v.message}`) };
  return { ok: true as const };
}
EOF

cat > packages/cli/src/commands/replay.ts <<'EOF'
import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";
import { normalizeDecisionLog, decodeDecisionLog } from "@decisiongraph/io-json";
import { ConstitutionalPolicy, replay } from "@decisiongraph/core";

export function cmdReplay(path: string) {
  const raw = readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  const vr = validateDecisionJson(json);
  if (!vr.ok) return { ok: false as const, errors: vr.errors };

  const ops = decodeDecisionLog(normalizeDecisionLog(vr.value));
  const policy = new ConstitutionalPolicy();
  const g = replay(ops, policy);
  return { ok: true as const, graph: g };
}
EOF

cat > packages/cli/src/commands/diff.ts <<'EOF'
import { readFileSync } from "node:fs";
import { validateDecisionJson } from "@decisiongraph/schema";
import { normalizeDecisionLog, decodeDecisionLog } from "@decisiongraph/io-json";
import { ConstitutionalPolicy, replay, diff } from "@decisiongraph/core";

function load(path: string) {
  const raw = readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  const vr = validateDecisionJson(json);
  if (!vr.ok) return { ok: false as const, errors: vr.errors };
  const ops = decodeDecisionLog(normalizeDecisionLog(vr.value));
  const policy = new ConstitutionalPolicy();
  const g = replay(ops, policy);
  return { ok: true as const, graph: g };
}

export function cmdDiff(aPath: string, bPath: string) {
  const a = load(aPath); if (!a.ok) return a;
  const b = load(bPath); if (!b.ok) return b;
  return { ok: true as const, diff: diff(a.graph, b.graph) };
}
EOF

cat > packages/cli/src/commands/traverse.ts <<'EOF'
export function cmdTraverse() {
  return { ok: false as const, errors: ["traverse: TODO"] };
}
EOF

cat > packages/cli/src/commands/migrate.ts <<'EOF'
export function cmdMigrate() {
  return { ok: false as const, errors: ["migrate: TODO"] };
}
EOF

cat > packages/cli/src/cli.ts <<'EOF'
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
    if (!path) { eprint("missing file"); process.exit(2); }
    const r = cmdLint(path);
    if (!r.ok) { r.errors.forEach(e => eprint(e)); process.exit(1); }
    print("OK");
    return;
  }

  if (cmd === "replay") {
    const path = rest[0];
    if (!path) { eprint("missing file"); process.exit(2); }
    const r = cmdReplay(path);
    if (!r.ok) { r.errors.forEach(e => eprint(e)); process.exit(1); }
    printJson(r.graph);
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

  help();
  process.exit(2);
}
EOF

cat > packages/cli/src/index.ts <<'EOF'
export * from "./cli.js";
EOF

cat > packages/cli/test/cli-validate.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../src/cli.js";

describe("cli validate", () => {
  it("returns non-zero on invalid json", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-"));
    const p = join(dir, "bad.json");
    writeFileSync(p, JSON.stringify({ version: "0.2" }), "utf8");

    const oldExit = process.exit;
    let code: number | undefined;
    // @ts-expect-error
    process.exit = (c?: number) => { code = c; throw new Error("EXIT"); };

    try {
      await main(["validate", p]);
    } catch {}
    finally {
      process.exit = oldExit;
    }

    expect(code).toBe(1);
  });
});
EOF

# ---------- Done ----------
cat <<EOF
✅ Repository scaffold generated in: $ROOT

Next:
  pnpm i
  pnpm test
  pnpm -C packages/cli build
  pnpm -C packages/cli exec decisiongraph validate demo/examples/adr-sample/decisions/ADR-001.v0.2.json
EOF
