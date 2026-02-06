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
