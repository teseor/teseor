import { specVoidStatus } from "../../../lib/html-void-elements.ts";
import type { Spec } from "../../gen-contract.ts";
import { jsLiteral, jsxAttr, quote, splitProps } from "./printers.ts";

// `mixed` elementByProp maps render children on their non-void branch; only
// fully-void specs use the self-closing fixture form.
function isVoidAtomic(spec: Spec): boolean {
  return spec.kind === "atomic" && specVoidStatus(spec) === "all";
}

type ChildSpec = { tag: string; attrs?: Record<string, string | number | boolean>; text?: string };

function specDefaultChildren(spec: Spec): ChildSpec[] | undefined {
  return spec.kind === "atomic" ? spec.defaultChildren : undefined;
}

function renderReactDefaultChild(child: ChildSpec): string {
  const attrs = Object.entries(child.attrs ?? {})
    .map(([n, v]) => jsxAttr(n, v))
    .join("");
  return child.text === undefined
    ? `<${child.tag}${attrs} />`
    : `<${child.tag}${attrs}>${child.text}</${child.tag}>`;
}

function renderVueDefaultChild(child: ChildSpec): string {
  const propEntries = Object.entries(child.attrs ?? {}).map(
    ([n, v]) => `${quote(n)}: ${jsLiteral(v)}`,
  );
  const propsObj = propEntries.length === 0 ? "{}" : `{ ${propEntries.join(", ")} }`;
  return child.text === undefined
    ? `h(${quote(child.tag)}, ${propsObj})`
    : `h(${quote(child.tag)}, ${propsObj}, ${quote(child.text)})`;
}

export function renderReactFixtureBody(
  spec: Spec,
  Name: string,
  exampleProps: Record<string, unknown>,
): string {
  const { regular, slots } = splitProps(spec, exampleProps);
  const attrString = regular.map(([n, v]) => jsxAttr(n, v)).join("");
  const slotAttrs = slots.map(([n, v]) => ` ${n}={SLOT(${quote(v)})}`).join("");
  if (isVoidAtomic(spec)) {
    return `<${Name}${attrString}${slotAttrs} />`;
  }
  const defaults = specDefaultChildren(spec);
  if (defaults && defaults.length > 0) {
    const childrenJsx = defaults.map(renderReactDefaultChild).join("");
    return `<${Name}${attrString}${slotAttrs}>${childrenJsx}</${Name}>`;
  }
  return `<${Name}${attrString}${slotAttrs}>{LABEL}</${Name}>`;
}

export function renderVueFixtureBody(
  spec: Spec,
  Name: string,
  exampleProps: Record<string, unknown>,
): string {
  const { regular, slots } = splitProps(spec, exampleProps);
  const propEntries = regular.map(([n, v]) => `${quote(n)}: ${jsLiteral(v)}`);
  const propsObj = propEntries.length === 0 ? "{}" : `{ ${propEntries.join(", ")} }`;
  if (isVoidAtomic(spec)) {
    // Void atomic specs have no default slot — h() with no third arg avoids
    // emitting `<img>Label</img>` (Vue would warn at runtime).
    if (slots.length === 0) return `h(${Name}, ${propsObj})`;
    const slotEntries = slots.map(([n, v]) => `${n}: SLOT(${quote(v)})`);
    return `h(${Name}, ${propsObj}, { ${slotEntries.join(", ")} })`;
  }
  const defaults = specDefaultChildren(spec);
  const defaultExpr =
    defaults && defaults.length > 0
      ? `() => [${defaults.map(renderVueDefaultChild).join(", ")}]`
      : "LABEL";
  const slotEntries = [
    `default: ${defaultExpr}`,
    ...slots.map(([n, v]) => `${n}: SLOT(${quote(v)})`),
  ];
  const slotsObj = `{ ${slotEntries.join(", ")} }`;
  return `h(${Name}, ${propsObj}, ${slotsObj})`;
}
