import { describe, it, expect } from "vitest";
import { decodeDecisionLog } from "../src/decode.js";

describe("io-json", () => {
  it("decodes basic log", () => {
    const ops = decodeDecisionLog({ version: "0.2", ops: [{ type: "commit", commitId: "C:1", createdAt: "2026-02-06T00:00:00.000Z", author: "A:x" }] } as any);
    expect(ops.length).toBe(1);
  });
});
