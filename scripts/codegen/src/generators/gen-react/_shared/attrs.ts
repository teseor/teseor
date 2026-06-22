import { kebabCase } from "../../../lib/kebab-case.ts";
import type { Spec } from "../../gen-contract.ts";
import { quote } from "./type-printer.ts";

/** Emit the JSX-attribute lines for variant/intent data-attrs, responsive
 *  data-attr spreads, per-prop `data-*` for non-responsive string-enum
 *  state props, the `data-loading` flag, and per-prop `data-*` flags for
 *  boolean state props — slotted into the wrapper root in the order
 *  defined by the spec. */
export function renderDataAttrs(
  spec: Spec,
  responsiveProps: string[],
  hasLoading: boolean,
  booleanStateProps: string[],
  stringEnumStateProps: string[],
): string {
  return [
    spec.variants ? `      data-variant={variant}` : null,
    spec.intents ? `      data-intent={intent}` : null,
    ...responsiveProps.map(
      (name) => `      {...responsiveDataAttrs(${quote(kebabCase(name))}, ${name})}`,
    ),
    ...stringEnumStateProps.map((name) => `      data-${kebabCase(name)}={${name}}`),
    hasLoading ? `      data-loading={loading === true ? "true" : undefined}` : null,
    ...booleanStateProps.map(
      (name) => `      data-${kebabCase(name)}={${name} === true ? "true" : undefined}`,
    ),
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

/** Emit the JSX-attribute lines for the spec's a11y block: a static `role`
 *  (overridden to `"none"` when `decorativeProp` is true), an `aria-{name}`
 *  per entry in `ariaProps`, and `aria-hidden` when `decorativeProp` is
 *  declared and true. Static-empty when no a11y block is set. The optional
 *  `roleBiomeIgnore` injects a `// biome-ignore` line directly above `role=`
 *  for combinations Biome can't see across (e.g. `aria-checked` implicit on
 *  `<input type="checkbox" role="switch">`). */
export function renderA11yAttrs(
  role: string | undefined,
  ariaProps: readonly string[],
  decorativeProp: string | undefined,
  roleBiomeIgnore?: string,
): string {
  const roleLine =
    role !== undefined && decorativeProp !== undefined
      ? `      role={${decorativeProp} === true ? "none" : ${quote(role)}}`
      : role !== undefined
        ? `      role=${quote(role)}`
        : null;
  const roleWithIgnore =
    roleLine !== null && roleBiomeIgnore
      ? `      // biome-ignore ${roleBiomeIgnore}\n${roleLine}`
      : roleLine;
  return [
    roleWithIgnore,
    ...ariaProps.map((name) => `      aria-${name}={${name}}`),
    decorativeProp !== undefined
      ? `      aria-hidden={${decorativeProp} === true ? "true" : undefined}`
      : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

/** Emit the JSX-attribute lines for the disabled / aria-disabled / aria-busy
 *  state attrs. The disabled pair branches on whether the element is
 *  polymorphic via `as` — buttons get `disabled`, anything else gets
 *  `aria-disabled`. */
export function renderStateAttrs(
  hasAs: boolean,
  hasDisabled: boolean,
  hasLoading: boolean,
): string {
  return [
    hasDisabled && hasAs ? `      disabled={isButton ? inactive : undefined}` : null,
    hasDisabled && hasAs
      ? `      aria-disabled={!isButton && inactive ? "true" : undefined}`
      : null,
    hasDisabled && !hasAs ? `      disabled={inactive}` : null,
    hasLoading ? `      aria-busy={loading === true ? "true" : undefined}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}
