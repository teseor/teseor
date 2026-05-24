import type { Spec } from "../../gen-contract.ts";
import { jsLiteral, jsxAttr, quote, splitProps } from "./printers.ts";

export function renderReactFixtureBody(
  spec: Spec,
  Name: string,
  exampleProps: Record<string, unknown>,
): string {
  const { regular, slots } = splitProps(spec, exampleProps);
  const attrString = regular.map(([n, v]) => jsxAttr(n, v)).join("");
  const slotAttrs = slots.map(([n, v]) => ` ${n}={SLOT(${quote(v)})}`).join("");
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
  const slotEntries = ["default: LABEL", ...slots.map(([n, v]) => `${n}: SLOT(${quote(v)})`)];
  const slotsObj = `{ ${slotEntries.join(", ")} }`;
  return `h(${Name}, ${propsObj}, ${slotsObj})`;
}
