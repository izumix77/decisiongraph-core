export type IsoTimestamp = string;
export const isIsoTimestamp = (s: string): boolean => {
  // minimal check; stricter validation can live in schema/io layer
  return typeof s === "string" && s.includes("T") && s.endsWith("Z");
};
