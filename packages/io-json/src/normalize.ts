export function normalizeDecisionLog<T>(json: T): T {
  // Minimal canonicalization: deep-sort object keys.
  const sortKeys = (v: any): any => {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v && typeof v === "object") {
      const out: any = {};
      for (const k of Object.keys(v).sort()) out[k] = sortKeys(v[k]);
      return out;
    }
    return v;
  };
  return sortKeys(json);
}
