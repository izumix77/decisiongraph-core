export const formatAjvErrors = (errors: any[] | null | undefined): string[] => {
  if (!errors) return ["Unknown validation error"];
  return errors.map(e => `${e.instancePath || "/"} ${e.message ?? "invalid"}`.trim());
};
