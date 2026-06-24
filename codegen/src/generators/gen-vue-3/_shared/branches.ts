import type { FlatSpec } from "../../../lib/flatten.ts";

type WhenClause =
  | { propTruthy: string }
  | { propFalsy: string }
  | { stateTruthy: string }
  | { stateFalsy: string }
  | { all: WhenClause[] }
  | { any: WhenClause[] };

type AttrValue = { prop: string } | { setState: { name: string; to: boolean } };

type TextClause = { prop: string } | { compute: string; from: string[] };

type Branch = {
  when?: WhenClause;
  element: string;
  attrs?: Record<string, AttrValue>;
  text?: TextClause;
};

function renderWhen(clause: WhenClause): string {
  if ("propTruthy" in clause) return clause.propTruthy;
  if ("propFalsy" in clause) return `!${clause.propFalsy}`;
  if ("stateTruthy" in clause) return clause.stateTruthy;
  if ("stateFalsy" in clause) return `!${clause.stateFalsy}`;
  if ("all" in clause) return clause.all.map((c) => `(${renderWhen(c)})`).join(" && ");
  if ("any" in clause) return clause.any.map((c) => `(${renderWhen(c)})`).join(" || ");
  throw new Error("unhandled when clause");
}

function renderAttr(name: string, value: AttrValue): string {
  if ("prop" in value) return `:${name}="${value.prop}"`;
  const { name: stateName, to } = value.setState;
  // Vue event-binding shorthand: on:foo → @foo
  const eventName = name.startsWith("on")
    ? name.slice(2).charAt(0).toLowerCase() + name.slice(3)
    : name;
  return `@${eventName}="${stateName} = ${to}"`;
}

function renderText(clause: TextClause): string {
  if ("prop" in clause) return clause.prop;
  return `${clause.compute}(${clause.from.join(", ")})`;
}

/** Emit the Vue v-if/v-else-if/v-else template chain for `branches:`. */
export function renderVueBranches(branches: Branch[], indent: string): string {
  if (branches.length === 0) return "";
  const lastIdx = branches.length - 1;
  const lines: string[] = [];
  for (let i = 0; i < lastIdx; i++) {
    const b = branches[i];
    if (!b) continue;
    const when = b.when;
    if (when === undefined) {
      throw new Error("renderVueBranches: only the last branch may omit `when` (the fallback)");
    }
    const directive = i === 0 ? "v-if" : "v-else-if";
    const attrParts = Object.entries(b.attrs ?? {}).map(([k, v]) => renderAttr(k, v));
    const openParts = [b.element, `${directive}="${renderWhen(when)}"`, ...attrParts].join(" ");
    if (b.text === undefined) {
      lines.push(`${indent}<${openParts} />`);
    } else {
      lines.push(`${indent}<${openParts}>{{ ${renderText(b.text)} }}</${b.element}>`);
    }
  }
  const fallback = branches[lastIdx];
  if (!fallback || fallback.when !== undefined) {
    throw new Error("renderVueBranches: the last branch must omit `when` (the fallback)");
  }
  const attrParts = Object.entries(fallback.attrs ?? {}).map(([k, v]) => renderAttr(k, v));
  const openParts = [fallback.element, "v-else", ...attrParts].join(" ");
  if (fallback.text === undefined) {
    lines.push(`${indent}<${openParts} />`);
  } else {
    lines.push(`${indent}<${openParts}>{{ ${renderText(fallback.text)} }}</${fallback.element}>`);
  }
  return lines.join("\n");
}

/** Emit Vue `ref()` lines for declared internal state. */
export function renderVueStateInits(state: FlatSpec["latch"] | undefined): string {
  if (!state) return "";
  return Object.entries(state)
    .map(([name, def]) => `const ${name} = ref<boolean>(${def.initial});`)
    .join("\n");
}

/** Extract the unique set of `compute:` helper names referenced by branches. */
export function collectVueBranchComputes(branches: Branch[] | undefined): string[] {
  if (!branches) return [];
  const found = new Set<string>();
  for (const b of branches) {
    if (b.text && "compute" in b.text) found.add(b.text.compute);
  }
  return Array.from(found);
}
