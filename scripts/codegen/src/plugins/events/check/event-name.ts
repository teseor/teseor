import type { PayloadEntry } from "../schema.ts";

// Valid JS identifier: starts with letter/underscore/$, followed by alphanumerics/_/$.
export const JS_IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export const CAMEL_TAIL_RE = /[A-Z][a-zA-Z0-9]*$/;

export function eventVerb(name: string): string {
  const match = name.match(CAMEL_TAIL_RE);
  return match ? match[0].toLowerCase() : name.toLowerCase();
}

export function visitPayload(
  entry: PayloadEntry,
  path: string,
  visit: (p: PayloadEntry, path: string) => void,
): void {
  visit(entry, path);
  if (entry.type === "array") visitPayload(entry.of, `${path}.of`, visit);
}

import { visitNodes } from "../../../core/check-utils.ts";
import type { Spec } from "../../../schema.ts";

export function collectControllableProps(spec: Spec): string[] {
  const names: string[] = [];
  visitNodes(spec, (node) => {
    for (const [propName, def] of Object.entries(node.props ?? {})) {
      if (def.pattern === "controllable") names.push(propName);
    }
  });
  return names;
}
