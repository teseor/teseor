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
 */
import type { Container, Declaration, Plugin, Root } from "postcss";
import postcss from "postcss";
import valueParser from "postcss-value-parser";

type Node = valueParser.Node;

const TOKEN_PREFIX = "--t-";
const PRIVATE_PREFIX = "--_";
const CONDITIONAL_AT_RULES = new Set(["media", "supports", "container"]);

/** Value of the first `word` child, or undefined when there is none. */
function firstWord(nodes: Node[]): string | undefined {
  for (const node of nodes) {
    if (node.type === "word") {
      return node.value;
    }
  }
  return undefined;
}

/** Index of the top-level `,` separating a `var()`'s name from its fallback. */
function commaIndex(nodes: Node[]): number {
  return nodes.findIndex((node) => node.type === "div" && node.value === ",");
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

/** Replace every `var()` whose token resolves in `raw` with its terminal value. */
function resolveNodes(nodes: Node[], raw: Map<string, string>, seen: Set<string>): Node[] {
  const out: Node[] = [];
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

/** Resolve `tokens.css` into a `--t-*` → terminal-literal map. */
export function buildTokenMap(tokensCss: string): Map<string, string> {
  const raw = new Map<string, string>();
  collectDefaultTokens(postcss.parse(tokensCss), raw);
  const resolved = new Map<string, string>();
  for (const [name, value] of raw) {
    resolved.set(
      name,
      valueParser.stringify(resolveNodes(valueParser(value).nodes, raw, new Set([name]))),
    );
  }
  return resolved;
}

/** Append a literal fallback to every fallback-less `--t-*` reference. */
function floorNodes(nodes: Node[], tokens: Map<string, string>, unresolved: Set<string>): Node[] {
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

/**
 * PostCSS plugin. Run last, after import/each/custom-media have expanded the
 * CSS, so every `var()` reference is concrete.
 */
export function teseorFloor(options: { tokens: Map<string, string> }): Plugin {
  const { tokens } = options;
  return {
    postcssPlugin: "postcss-teseor-floor",
    Once(root: Root) {
      const unresolved = new Set<string>();
      let firstUnresolved: Declaration | undefined;
      root.walkDecls((decl) => {
        if (decl.prop.startsWith(TOKEN_PREFIX) || !decl.value.includes("var(")) {
          return;
        }
        const before = unresolved.size;
        const floored = valueParser.stringify(
          floorNodes(valueParser(decl.value).nodes, tokens, unresolved),
        );
        if (unresolved.size > before && firstUnresolved === undefined) {
          firstUnresolved = decl;
        }
        if (floored !== decl.value) {
          decl.value = floored;
        }
      });
      if (firstUnresolved !== undefined) {
        throw firstUnresolved.error(
          `cannot resolve a literal floor for ${[...unresolved].join(", ")} — not declared in tokens.css`,
        );
      }
    },
  };
}
