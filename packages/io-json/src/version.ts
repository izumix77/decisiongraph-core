// src/version.ts

// Supported JSON wire format versions (schema versions)
export const SUPPORTED_VERSIONS = ["0.2", "0.3"] as const;

export type DecisionLogVersion = typeof SUPPORTED_VERSIONS[number];

// Current default JSON wire format version used by encoder
export const CURRENT_SCHEMA_VERSION: DecisionLogVersion = "0.3";
