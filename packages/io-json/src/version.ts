export const SUPPORTED_VERSIONS = ["0.2", "0.3"] as const;
export type DecisionLogVersion = typeof SUPPORTED_VERSIONS[number];
