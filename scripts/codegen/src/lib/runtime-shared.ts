import type { Breakpoint } from "./breakpoints.ts";

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function renderSharedResponsiveRuntimePrelude(breakpoints: Breakpoint[]): string {
  const names = breakpoints.map((bp) => bp.name);
  const keys = ["base", ...names].map(quote).join(", ");
  // Biome strips quotes from valid-identifier object keys; mirror that so the
  // generated runtime matches the committed file byte-for-byte.
  const objKey = (key: string): string => (/^[A-Za-z_$][\w$]*$/.test(key) ? key : quote(key));
  const queryEntries = breakpoints
    .map((bp) => `  ${objKey(bp.name)}: ${quote(`(min-width: ${bp.minWidth})`)},`)
    .join("\n");

  return `const RESPONSIVE_KEYS = [${keys}] as const;

type Breakpoint = (typeof RESPONSIVE_KEYS)[number];

export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

// matchMedia queries baked from specs/_breakpoints.yaml. Single source.
const BREAKPOINT_QUERIES: Partial<Record<Breakpoint, string>> = {
${queryEntries}
};

function readActiveBreakpoint(): Breakpoint {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "base";
  for (let i = RESPONSIVE_KEYS.length - 1; i > 0; i--) {
    const key = RESPONSIVE_KEYS[i];
    if (!key) continue;
    const q = BREAKPOINT_QUERIES[key];
    if (q && window.matchMedia(q).matches) return key;
  }
  return "base";
}

/** Resolve a \`Responsive<boolean>\` at the active breakpoint (mobile-first cascade). */
export function isActiveAt(value: unknown, bp: Breakpoint): boolean {
  if (value === true) return true;
  if (value == null || value === false) return false;
  if (typeof value !== "object") return false;
  const obj = value as Partial<Record<Breakpoint, boolean>>;
  const idx = RESPONSIVE_KEYS.indexOf(bp);
  for (let i = idx; i >= 0; i--) {
    const key = RESPONSIVE_KEYS[i];
    if (key && key in obj) return obj[key] === true;
  }
  return false;
}

/** Resolve a \`Responsive<T>\` at the active breakpoint (mobile-first cascade). */
export function resolveResponsive<T>(
  value: Responsive<T> | undefined,
  bp: Breakpoint,
): T | undefined {
  if (value == null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) return value as T;
  const obj = value as Partial<Record<Breakpoint, T>>;
  const idx = RESPONSIVE_KEYS.indexOf(bp);
  for (let i = idx; i >= 0; i--) {
    const key = RESPONSIVE_KEYS[i];
    if (key && key in obj) return obj[key];
  }
  return undefined;
}

export function responsiveDataAttrs(
  name: string,
  value: unknown,
): Record<string, string | undefined> {
  if (value == null || value === false) return {};
  if (typeof value === "object") {
    // Emit every declared key (including \`false\` at non-base) — the CSS
    // override pattern needs the explicit attribute to match against.
    const obj = value as Record<string, unknown>;
    const out: Record<string, string | undefined> = {};
    for (const key of RESPONSIVE_KEYS) {
      const v = obj[key];
      if (v == null) continue;
      // \`base: false\` has no attribute (absence-of) — emitting "false" would never match.
      if (key === "base" && v === false) continue;
      const attr = key === "base" ? \`data-\${name}\` : \`data-\${name}-\${key}\`;
      out[attr] = v === true ? "true" : v === false ? "false" : String(v);
    }
    return out;
  }
  return { [\`data-\${name}\`]: value === true ? "true" : String(value) };
}`;
}

export function renderSharedPopoverDomHelpers(): string {
  return `function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

// \`:popover-open\` throws SyntaxError on engines that don't recognize it; probe once.
const SUPPORTS_POPOVER_OPEN_SELECTOR =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("selector(:popover-open)");

function popoverIsOpen(node: HTMLElement): boolean | undefined {
  if (!SUPPORTS_POPOVER_OPEN_SELECTOR) return undefined;
  try {
    return node.matches(":popover-open");
  } catch {
    return undefined;
  }
}`;
}
