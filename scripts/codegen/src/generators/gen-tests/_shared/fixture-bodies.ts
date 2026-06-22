import { isVoidElement } from "../../../lib/html-void-elements.ts";
import type { Spec } from "../../gen-contract.ts";
import { jsLiteral, jsxAttr, quote, splitProps } from "./printers.ts";

function isVoidAtomic(spec: Spec): boolean {
  return spec.kind === "atomic" && !!spec.element && isVoidElement(spec.element);
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
  const slotEntries = ["default: LABEL", ...slots.map(([n, v]) => `${n}: SLOT(${quote(v)})`)];
  const slotsObj = `{ ${slotEntries.join(", ")} }`;
  return `h(${Name}, ${propsObj}, ${slotsObj})`;
}
