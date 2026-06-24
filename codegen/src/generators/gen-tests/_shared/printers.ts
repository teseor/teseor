import type { Spec, SpecProp } from "../../gen-contract.ts";

export function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function jsLiteral(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return quote(value);
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return `[${value.map(jsLiteral).join(", ")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => `${quote(k)}: ${jsLiteral(v)}`,
    );
    return `{ ${entries.join(", ")} }`;
  }
  return "undefined";
}

export function jsxAttr(name: string, value: unknown): string {
  if (typeof value === "string") return ` ${name}=${quote(value)}`;
  if (typeof value === "boolean") return value ? ` ${name}` : ` ${name}={false}`;
  if (typeof value === "number") return ` ${name}={${value}}`;
  return ` ${name}={${jsLiteral(value)}}`;
}

export function splitProps(
  spec: Spec,
  exampleProps: Record<string, unknown>,
): { regular: Array<[string, unknown]>; slots: Array<[string, string]> } {
  const regular: Array<[string, unknown]> = [];
  const slots: Array<[string, string]> = [];
  const specProps = spec.props ?? {};
  for (const [name, value] of Object.entries(exampleProps)) {
    const def: SpecProp | undefined = specProps[name];
    if (def?.slot === true) {
      slots.push([name, String(value)]);
    } else {
      regular.push([name, value]);
    }
  }
  return { regular, slots };
}

export function hasSlotProps(spec: Spec): boolean {
  return Object.values(spec.props ?? {}).some((def) => def.slot === true);
}
