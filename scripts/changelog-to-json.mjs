import fs from "fs";

const input = fs.readFileSync("CHANGELOG.md", "utf-8");

const releases = [];
const blocks = input.split(/^## \[/gm).slice(1);

for (const block of blocks) {
  const [header, ...rest] = block.split("\n");
  const content = rest.join("\n").trim();

  const match = header.match(/^([\d.]+)\] - (\d{4}-\d{2}-\d{2})/);
  if (!match) continue;

  const [, version, date] = match;

  const sectionsMap = {};
  let current = null;

  for (const line of content.split("\n")) {
    // --- セクション検出 ---
    const sec = line.match(/^### (.+)/);
    if (sec) {
      current = sec[1];
      sectionsMap[current] = [];
      continue;
    }

    if (!current) continue;

    // --- ネスト ---
    const nestedMatch = line.match(/^(\s+)- (.+)/);
    if (nestedMatch) {
      const [, , text] = nestedMatch;
      const last = sectionsMap[current].at(-1);
      if (!last) continue;

      // package検出
      const pkgMatch = text.match(/`?(@?[^@\s]+)@([\d.]+)`?/);

      if (pkgMatch) {
        const [, name, version] = pkgMatch;

        if (!last.packages) last.packages = [];

        // --- dedupe（同一packageは最新だけ残す） ---
        const existing = last.packages.find(p => p.name === name);
        if (!existing) {
          last.packages.push({ name, version });
        } else {
          // version更新（後勝ち）
          existing.version = version;
        }

      } else {
        if (!last.children) last.children = [];
        last.children.push(text);
      }

      continue;
    }

    // --- 通常項目 ---
    if (line.startsWith("- ")) {
      sectionsMap[current].push({
        text: line.slice(2),
      });
    }
  }

  // --- sectionsを配列化 ---
  const sections = Object.entries(sectionsMap).map(([title, items]) => ({
    title,
    items,
  }));

  releases.push({
    version,
    date, // ← そのままでOK
    sections,
  });
}

fs.writeFileSync(
  "releases.json",
  JSON.stringify(releases, null, 2)
);

console.log("✅ releases.json generated");
