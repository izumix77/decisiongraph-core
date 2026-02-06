export const isIsoTimestamp = (s) => {
    // minimal check; stricter validation can live in schema/io layer
    return typeof s === "string" && s.includes("T") && s.endsWith("Z");
};
//# sourceMappingURL=time.js.map