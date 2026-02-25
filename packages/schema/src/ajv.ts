import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";

type AnySchema = Record<string, unknown>;

function loadDecisionSchema(): AnySchema {
  const url = new URL("../schemas/v0.2/decision.schema.json", import.meta.url);
  const raw = readFileSync(url, "utf8");
  return JSON.parse(raw) as AnySchema;
}

const decisionSchema = loadDecisionSchema();

export const schemaId = String((decisionSchema as any).$id);

export function buildAjv() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(decisionSchema);
  return ajv;
}
