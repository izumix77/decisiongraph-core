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
