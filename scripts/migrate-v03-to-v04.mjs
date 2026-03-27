import fs from "fs";
import path from "path";

const TARGET_DIR = process.argv[2] || "examples";

/**
 * 再帰的にファイル取得
 */
function getFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) return getFiles(fullPath);
    if (entry.name.endsWith(".json")) return [fullPath];

    return [];
  });
}

/**
 * v0.3 → v0.4 変換
 */
function migrate(content) {
  const json = JSON.parse(content);

  // version更新
  if (json.version === "0.3") {
    json.version = "0.4";
  }

  if (!Array.isArray(json.ops)) return json;

  json.ops = json.ops.map((op) => {
    // node.status 削除
    if (op.node && op.node.status) {
      delete op.node.status;
    }

    // 将来用：他の変換ルールここに追加
    // if (op.type === "supersede_node") → 変換など

    return op;
  });

  return json;
}

/**
 * 実行
 */
const files = getFiles(TARGET_DIR);

let updated = 0;

for (const file of files) {
  const raw = fs.readFileSync(file, "utf-8");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(`⚠️ Skip (invalid JSON): ${file}`);
    continue;
  }

  if (parsed.version !== "0.3") continue;

  const migrated = migrate(raw);

  fs.writeFileSync(file, JSON.stringify(migrated, null, 2));
  console.log(`✅ migrated: ${file}`);

  updated++;
}

console.log(`\n🎉 Done. ${updated} files migrated.`);
