/**
 * postcss-teseor-floor — gives every `--t-*` token reference in component CSS a
 * literal fallback resolved from `tokens.css`, so a shipped file renders
 * correctly even when `tokens.css` is absent.
 *
 *   authored   var(--t-button-bg, var(--t-accent))
 *   shipped    var(--t-button-bg, var(--t-accent, oklch(65% 0.18 250deg)))
 *
 * The literal lives once in `tokens.css`; the build copies it into the third
 * `var()` position. `--_*` private references are left alone — they resolve
 * through their own floored `components.tokens` declaration.
 *
 * When `forcedColorsTokens` is provided, the plugin also synthesizes a nested
 * `@media (forced-colors: active)` block re-declaring any property whose floor
 * would differ in Windows High Contrast mode — `tokens.css` declares the same
 * semantic alias twice (default `:root` + forced-colors branch), and the
 * synthesized block carries the system-color literal so a per-component file
 * keeps its high-contrast mapping when shipped alone.
 */
import type { AtRule, Container, Declaration, Plugin, Root, Rule } from "postcss";
import postcss from "postcss";
import valueParser from "postcss-value-parser";

type ValueNode = valueParser.Node;

const TOKEN_PREFIX = "--t-";
const PRIVATE_PREFIX = "--_";
const CONDITIONAL_AT_RULES = new Set(["media", "supports", "container"]);

/** Value of the first `word` child, or undefined when there is none. */
function firstWord(nodes: ValueNode[]): string | undefined {
  for (const node of nodes) {
    if (node.type === "word") {
      return node.value;
    }
  }
  return undefined;
}

/** Index of the top-level `,` separating a `var()`'s name from its fallback. */
function commaIndex(nodes: ValueNode[]): number {
  return nodes.findIndex((node) => node.type === "div" && node.value === ",");
}

/** Matches `@media (forced-colors: active)` with no extra conditions. */
function isForcedColorsActive(params: string): boolean {
  return /^\s*\(\s*forced-colors\s*:\s*active\s*\)\s*$/.test(params);
}

/**
 * Collect `--t-*` declarations from default `:root` rules. `@media`-gated
 * branches (`forced-colors`, `prefers-reduced-motion`) are skipped so the floor
 * carries the default-mode literal.
 */
function collectDefaultTokens(container: Container, raw: Map<string, string>): void {
  container.each((node) => {
    if (node.type === "atrule") {
      if (!CONDITIONAL_AT_RULES.has(node.name)) {
        collectDefaultTokens(node, raw);
      }
    } else if (node.type === "rule" && node.selector === ":root") {
      node.walkDecls((decl) => {
        if (decl.prop.startsWith(TOKEN_PREFIX)) {
          raw.set(decl.prop, decl.value);
        }
      });
    }
  });
}

/**
 * Overlay `--t-*` declarations from every `@media (forced-colors: active)`
 * `:root` branch onto `raw`. Compound queries (e.g. `(forced-colors: active)
 * and (prefers-color-scheme: dark)`) are skipped — only pure forced-colors
 * overrides count, since a compound query's value only applies under those
 * extra conditions, not under bare forced-colors mode.
 */
function collectForcedColorsOverrides(container: Container, raw: Map<string, string>): void {
  container.walkAtRules("media", (atRule) => {
    if (!isForcedColorsActive(atRule.params)) return;
    atRule.walkRules(":root", (rootRule) => {
      rootRule.walkDecls((decl) => {
        if (decl.prop.startsWith(TOKEN_PREFIX)) {
          raw.set(decl.prop, decl.value);
        }
      });
    });
  });
}

/** Replace every `var()` whose token resolves in `raw` with its terminal value. */
function resolveNodes(
  nodes: ValueNode[],
  raw: Map<string, string>,
  seen: Set<string>,
): ValueNode[] {
  const out: ValueNode[] = [];
  for (const node of nodes) {
    if (node.type !== "function") {
      out.push(node);
      continue;
    }
    if (node.value !== "var") {
      out.push({ ...node, nodes: resolveNodes(node.nodes, raw, seen) });
      continue;
    }
    const name = firstWord(node.nodes);
    const comma = commaIndex(node.nodes);
    if (name !== undefined && raw.has(name)) {
      if (seen.has(name)) {
        throw new Error(`postcss-teseor-floor: token cycle through ${name}`);
      }
      const value = raw.get(name) ?? "";
      out.push(...resolveNodes(valueParser(value).nodes, raw, new Set(seen).add(name)));
    } else if (comma !== -1) {
      out.push(...resolveNodes(node.nodes.slice(comma + 1), raw, seen));
    } else {
      out.push(node);
    }
  }
  return out;
}

function resolveAll(raw: Map<string, string>): Map<string, string> {
  const resolved = new Map<string, string>();
  for (const [name, value] of raw) {
    resolved.set(
      name,
      valueParser.stringify(resolveNodes(valueParser(value).nodes, raw, new Set([name]))),
    );
  }
  return resolved;
}

/** Resolve `tokens.css` into a `--t-*` → terminal-literal map (default branch). */
export function buildTokenMap(tokensCss: string): Map<string, string> {
  const raw = new Map<string, string>();
  collectDefaultTokens(postcss.parse(tokensCss), raw);
  return resolveAll(raw);
}

/**
 * Resolve `tokens.css` into a `--t-*` → terminal-literal map for forced-colors
 * mode: starts from the default `:root` and applies `@media (forced-colors:
 * active)` overrides before walking chains.
 */
export function buildForcedColorsTokenMap(tokensCss: string): Map<string, string> {
  const raw = new Map<string, string>();
  const parsed = postcss.parse(tokensCss);
  collectDefaultTokens(parsed, raw);
  collectForcedColorsOverrides(parsed, raw);
  return resolveAll(raw);
}

/** Append a literal fallback to every fallback-less `--t-*` reference. */
function floorNodes(
  nodes: ValueNode[],
  tokens: Map<string, string>,
  unresolved: Set<string>,
): ValueNode[] {
  return nodes.map((node) => {
    if (node.type !== "function") {
      return node;
    }
    if (node.value !== "var" || commaIndex(node.nodes) !== -1) {
      return { ...node, nodes: floorNodes(node.nodes, tokens, unresolved) };
    }
    const name = firstWord(node.nodes);
    if (name === undefined || name.startsWith(PRIVATE_PREFIX) || !name.startsWith(TOKEN_PREFIX)) {
      return node;
    }
    const literal = tokens.get(name);
    if (literal === undefined) {
      unresolved.add(name);
      return node;
    }
    const separator: valueParser.DivNode = {
      type: "div",
      value: ",",
      before: "",
      after: " ",
      sourceIndex: 0,
      sourceEndIndex: 0,
    };
    return { ...node, nodes: [...node.nodes, separator, ...valueParser(literal).nodes] };
  });
}

function floorValue(value: string, tokens: Map<string, string>, unresolved: Set<string>): string {
  return valueParser.stringify(floorNodes(valueParser(value).nodes, tokens, unresolved));
}

/**
 * PostCSS plugin. Run last, after import/each/custom-media have expanded the
 * CSS, so every `var()` reference is concrete.
 */
export function teseorFloor(options: {
  tokens: Map<string, string>;
  forcedColorsTokens?: Map<string, string>;
}): Plugin {
  const { tokens, forcedColorsTokens } = options;
  return {
    postcssPlugin: "postcss-teseor-floor",
    Once(root: Root) {
      const unresolved = new Set<string>();
      let firstUnresolved: Declaration | undefined;

      function walk(container: Container, inForcedColors: boolean): void {
        const overrides: { prop: string; value: string }[] = [];
        const children = (container.nodes ?? []).slice();

        for (const node of children) {
          if (node.type === "decl") {
            const decl = node as Declaration;
            if (decl.prop.startsWith(TOKEN_PREFIX) || !decl.value.includes("var(")) {
              continue;
            }
            const originalValue = decl.value;
            const activeTokens = inForcedColors && forcedColorsTokens ? forcedColorsTokens : tokens;
            const before = unresolved.size;
            const floored = floorValue(originalValue, activeTokens, unresolved);
            if (unresolved.size > before && firstUnresolved === undefined) {
              firstUnresolved = decl;
            }
            if (floored !== originalValue) {
              decl.value = floored;
            }
            if (forcedColorsTokens && !inForcedColors) {
              const fcFloored = floorValue(originalValue, forcedColorsTokens, unresolved);
              if (fcFloored !== floored) {
                overrides.push({ prop: decl.prop, value: fcFloored });
              }
            }
          } else if (node.type === "rule") {
            walk(node as Rule, inForcedColors);
          } else if (node.type === "atrule") {
            const atRule = node as AtRule;
            const enters = atRule.name === "media" && isForcedColorsActive(atRule.params);
            walk(atRule, inForcedColors || enters);
          }
        }

        if (
          container.type === "rule" &&
          overrides.length > 0 &&
          !inForcedColors &&
          forcedColorsTokens
        ) {
          const mediaAtRule = postcss.atRule({
            name: "media",
            params: "(forced-colors: active)",
          });
          for (const { prop, value } of overrides) {
            mediaAtRule.append(postcss.decl({ prop, value }));
          }
          (container as Rule).append(mediaAtRule);
        }
      }

      walk(root, false);

      if (firstUnresolved !== undefined) {
        throw firstUnresolved.error(
          `cannot resolve a literal floor for ${[...unresolved].join(", ")} — not declared in tokens.css`,
        );
      }
    },
  };
}
