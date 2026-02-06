export const printJson = (obj: unknown) => process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
