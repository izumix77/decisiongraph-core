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
