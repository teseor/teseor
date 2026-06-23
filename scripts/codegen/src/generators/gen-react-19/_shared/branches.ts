import type { FlatSpec } from "../../../lib/flatten.ts";
import { pascalCase } from "../../../lib/pascal-case.ts";

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

const setterName = (stateName: string): string => `set${pascalCase(stateName)}`;

function renderWhen(clause: WhenClause): string {
  if ("propTruthy" in clause) return clause.propTruthy;
  if ("propFalsy" in clause) return `!${clause.propFalsy}`;
  if ("stateTruthy" in clause) return clause.stateTruthy;
  if ("stateFalsy" in clause) return `!${clause.stateFalsy}`;
  if ("all" in clause) return clause.all.map((c) => `(${renderWhen(c)})`).join(" && ");
  if ("any" in clause) return clause.any.map((c) => `(${renderWhen(c)})`).join(" || ");
  throw new Error("unhandled when clause");
}

function renderAttrValue(value: AttrValue): string {
  if ("prop" in value) return `{${value.prop}}`;
  const { name, to } = value.setState;
  return `{() => ${setterName(name)}(${to})}`;
}

function renderText(clause: TextClause): string {
  if ("prop" in clause) return clause.prop;
  return `${clause.compute}(${clause.from.join(", ")})`;
}

function renderBranchElement(b: Branch, indent: string): string {
  const attrParts = Object.entries(b.attrs ?? {}).map(([k, v]) => `${k}=${renderAttrValue(v)}`);
  const openParts = [b.element, ...attrParts].join(" ");
  if (b.text === undefined) {
    return `${indent}<${openParts} />`;
  }
  return `${indent}<${openParts}>{${renderText(b.text)}}</${b.element}>`;
}

/** Emit the JSX ternary chain for `branches:`. The last entry must have no
 *  `when` (the unconditional fallback) — semantic checks enforce. */
export function renderReactBranches(branches: Branch[], indent: string): string {
  if (branches.length === 0) return "";
  const lastIdx = branches.length - 1;
  const fallback = branches[lastIdx];
  if (!fallback || fallback.when !== undefined) {
    throw new Error("renderReactBranches: the last branch must omit `when` (the fallback)");
  }
  const lines: string[] = [];
  for (let i = 0; i < lastIdx; i++) {
    const b = branches[i];
    if (!b) continue;
    const when = b.when;
    if (when === undefined) {
      throw new Error("renderReactBranches: only the last branch may omit `when` (the fallback)");
    }
    const prefix =
      i === 0 ? `${indent}{${renderWhen(when)} ? (` : `${indent}) : ${renderWhen(when)} ? (`;
    lines.push(prefix);
    lines.push(renderBranchElement(b, `${indent}  `));
  }
  lines.push(`${indent}) : (`);
  lines.push(renderBranchElement(fallback, `${indent}  `));
  lines.push(`${indent})}`);
  return lines.join("\n");
}

/** Emit React `useState` lines for declared internal state. */
export function renderReactStateInits(state: FlatSpec["latch"] | undefined): string {
  if (!state) return "";
  return Object.entries(state)
    .map(
      ([name, def]) =>
        `  const [${name}, ${setterName(name)}] = useState<boolean>(${def.initial});`,
    )
    .join("\n");
}

/** Extract the unique set of `compute:` helper names referenced by branches. */
export function collectBranchComputes(branches: Branch[] | undefined): string[] {
  if (!branches) return [];
  const found = new Set<string>();
  for (const b of branches) {
    if (b.text && "compute" in b.text) found.add(b.text.compute);
  }
  return Array.from(found);
}
