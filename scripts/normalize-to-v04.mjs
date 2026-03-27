#!/usr/bin/env node
import fs from "fs";
import path from "path";

const TARGET_VERSION = "0.4";

/**
 * 再帰的に .decisionlog.json を収集
 */
function collectFiles(dir) {
  let results = [];

  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      results = results.concat(collectFiles(full));
    } else if (entry.endsWith(".decisionlog.json") || entry === "demo.json") {
      results.push(full);
    }
  }

  return results;
}

/**
 * supersede_edge を v0.4形式に展開
 */
function expandSupersedeEdge(op, warnings) {
  const results = [];

  if (!op.oldEdgeId || !op.newEdge) {
    warnings.push(`⚠️ invalid supersede_edge skipped`);
    return results;
  }

  // ① old edge を Superseded にする
  results.push({
    type: "supersede_edge",
    oldEdgeId: op.oldEdgeId,
    newEdge: op.newEdge,
  });

  warnings.push(`⚠️ expanded supersede_edge`);

  return results;
}

/**
 * ops正規化
 */
function normalizeOps(ops, warnings) {
  const newOps = [];

  for (const op of ops) {
    if (!op || typeof op !== "object") continue;

    // ❌ node.status 削除
    if (op.node && "status" in op.node) {
      delete op.node.status;
      warnings.push(`⚠️ removed node.status (v0.4 invariant)`);
    }

    // 🔄 supersede_edge展開
    if (op.type === "supersede_edge") {
      const expanded = expandSupersedeEdge(op, warnings);
      newOps.push(...expanded);
      continue;
    }

    // ❗ commit validation（触らない）
    if (op.type === "commit") {
      if (!op.author) {
        warnings.push(`⚠️ commit missing author (NOT modified)`);
      }
      if (!op.commitId || !op.createdAt) {
        warnings.push(`⚠️ incomplete commit (NOT modified)`);
      }
    }

    newOps.push(op);
  }

  return newOps;
}

/**
 * metaにmigration情報付加（非破壊）
 */
function attachMigrationMeta(data) {
  const now = new Date().toISOString();

  if (!data.meta) data.meta = {};

  data.meta.migration = {
    tool: "normalize-to-v04",
    timestamp: now,
    note: "structural normalization only (no author modification)",
  };
}

/**
 * 単一ファイル処理
 */
function processFile(file) {
  const raw = fs.readFileSync(file, "utf-8");
  let data;

  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.log(`❌ skipped (invalid JSON): ${file}`);
    return;
  }

  const warnings = [];

  // version統一
  if (data.version !== TARGET_VERSION) {
    data.version = TARGET_VERSION;
  }

  // graphId補完（必要なら）
  if (!data.graphId) {
    data.graphId = "default";
    warnings.push(`⚠️ graphId missing → set to "default"`);
  }

  // ops
  if (Array.isArray(data.ops)) {
    data.ops = normalizeOps(data.ops, warnings);
  } else {
    warnings.push(`⚠️ ops missing or invalid`);
  }

  // meta追加（非破壊）
  attachMigrationMeta(data);

  // 書き戻し
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

  // ログ
  console.log(`✅ normalized: ${file}`);
  warnings.forEach((w) => console.log(`   ${w}`));
}

/**
 * main
 */
function main() {
  const targetDir = process.argv[2];

  if (!targetDir) {
    console.log("Usage: node scripts/normalize-to-v04.mjs <directory>");
    process.exit(1);
  }

  const abs = path.resolve(targetDir);

  if (!fs.existsSync(abs)) {
    console.log(`❌ directory not found: ${abs}`);
    process.exit(1);
  }

  const files = collectFiles(abs);

  if (files.length === 0) {
    console.log("⚠️ no decisionlog files found");
    return;
  }

  for (const file of files) {
    processFile(file);
  }

  console.log("\n🎉 All files normalized to v0.4");
}

main();
