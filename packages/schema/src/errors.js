export const formatAjvErrors = (errors) => {
    if (!errors)
        return ["Unknown validation error"];
    return errors.map(e => `${e.instancePath || "/"} ${e.message ?? "invalid"}`.trim());
};
//# sourceMappingURL=errors.js.map