import {
  asAuthorId,
  asCommitId,
  asEdgeId,
  asNodeId,
  type Operation,
  type Node,
  type Edge
} from "@decisiongraph/core";
import type { DecisionLogJson } from "@decisiongraph/schema";
import { SUPPORTED_VERSIONS } from "./version.js";

const err = (m: string) => new Error(m);
const isObj = (x: unknown): x is Record<string, any> => !!x && typeof x === "object" && !Array.isArray(x);

function reqStr(o: Record<string, any>, k: string): string {
  const v = o[k];
  if (typeof v !== "string") throw err(`Expected string at ${k}`);
  return v;
}

function decodeNode(o: any): Node {
  if (!isObj(o)) throw err("node must be object");
  return {
    id: asNodeId(reqStr(o, "id")),
    kind: reqStr(o, "kind"),
    status: reqStr(o, "status") as any,
    createdAt: reqStr(o, "createdAt"),
    author: asAuthorId(reqStr(o, "author")),
    payload: o["payload"]
  };
}

function decodeEdge(o: any): Edge {
  if (!isObj(o)) throw err("edge must be object");
  return {
    id: asEdgeId(reqStr(o, "id")),
    type: reqStr(o, "type") as any,
    from: asNodeId(reqStr(o, "from")),
    to: asNodeId(reqStr(o, "to")),
    status: reqStr(o, "status") as any,
    createdAt: reqStr(o, "createdAt"),
    author: asAuthorId(reqStr(o, "author")),
    payload: o["payload"]
  };
}

export function decodeDecisionLog(json: DecisionLogJson): Operation[] {
  if (!(SUPPORTED_VERSIONS as readonly string[]).includes(json.version)) {
    throw err(`Unsupported version: ${json.version}`);
  }

  const ops = json.ops;
  if (!Array.isArray(ops)) throw err("ops must be array");

  return ops.map((raw) => {
    if (!isObj(raw)) throw err("op must be object");
    const t = reqStr(raw, "type");

    if (t === "add_node") return { type: "add_node", node: decodeNode(raw["node"]) };
    if (t === "add_edge") return { type: "add_edge", edge: decodeEdge(raw["edge"]) };
    if (t === "supersede_edge") {
      return {
        type: "supersede_edge",
        oldEdgeId: asEdgeId(reqStr(raw, "oldEdgeId")),
        newEdge: decodeEdge(raw["newEdge"])
      };
    }
    if (t === "commit") {
      return {
        type: "commit",
        commitId: asCommitId(reqStr(raw, "commitId")),
        createdAt: reqStr(raw, "createdAt"),
        author: asAuthorId(reqStr(raw, "author"))
      };
    }
    throw err(`Unknown op type: ${t}`);
  });
}
