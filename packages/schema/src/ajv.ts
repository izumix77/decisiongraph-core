import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";

type AnySchema = Record<string, unknown>;

function loadSchema(relativePath: string): AnySchema {
  const url = new URL(relativePath, import.meta.url);
  const raw = readFileSync(url, "utf8");
  return JSON.parse(raw) as AnySchema;
}

const schemaV02 = loadSchema("../schemas/v0.2/decision.schema.json");
const schemaV03 = loadSchema("../schemas/v0.3/decision.schema.json");

export const schemaIdV02 = String((schemaV02 as any).$id);
export const schemaIdV03 = String((schemaV03 as any).$id);

// legacy export for backward compat
export const schemaId = schemaIdV02;

export function buildAjv() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(schemaV02);
  ajv.addSchema(schemaV03);
  return ajv;
}
