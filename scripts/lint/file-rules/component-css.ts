// Enforces the token-driven component-CSS model: every [data-*] modifier
// reassigns --_ vars only, every component root declares its own box model,
// and every --t-* reference is a real token or the component's own override
// slot.
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import type { Rule } from "postcss";
import postcss from "postcss";
import postcssEach from "postcss-each";
import selectorParser from "postcss-selector-parser";
import { buildTokenMap } from "../../../packages/css/postcss-teseor-floor.ts";
import { REPO_ROOT } from "../../lib/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

const STATE_PSEUDOS = new Set([
  "hover",
  "active",
  "focus",
  "focus-visible",
  "focus-within",
  "disabled",
  "enabled",
  "checked",
  "target",
  "visited",
]);

const ROOT_BOX_MODEL = ["box-sizing", "margin"];

/**
 * True for a rule that styles the root through a `[data-*]` attribute alone —
 * no descendant combinator, no state pseudo-class, no pseudo-element. These are
 * the modifiers that must reassign vars only.
 */
function isModifierSelector(selector: string): boolean {
  let dataAttr = false;
  let combinator = false;
  let stateOrElement = false;
  selectorParser((root) => {
    root.walk((node) => {
      if (node.type === "combinator") {
        combinator = true;
      } else if (node.type === "attribute" && node.attribute.startsWith("data-")) {
        dataAttr = true;
      } else if (node.type === "pseudo") {
        if (node.value.startsWith("::") || STATE_PSEUDOS.has(node.value.replace(/^:/, ""))) {
          stateOrElement = true;
        }
      }
    });
  }).processSync(selector);
  return dataAttr && !combinator && !stateOrElement;
}

function checkComponent(
  name: string,
  rel: string,
  css: string,
  tokens: ReadonlyMap<string, unknown>,
): ViolationDetail[] {
  const out: ViolationDetail[] = [];
  const root = postcss([postcssEach()]).process(css, { from: undefined }).root;
  const ownSlot = `--t-${name}-`;

  // Modifiers reassign vars only.
  root.walkRules((rule) => {
    if (!isModifierSelector(rule.selector)) {
      return;
    }
    rule.walkDecls((decl) => {
      if (!decl.prop.startsWith("--")) {
        out.push({
          file: rel,
          message: `\`${rule.selector}\` declares \`${decl.prop}\` — a [data-*] modifier reassigns --_ vars only`,
        });
      }
    });
  });

  // The root declares its own box model.
  let rootRule: Rule | undefined;
  root.walkAtRules("layer", (layer) => {
    if (layer.params !== "components.styles") {
      return;
    }
    layer.walkRules((r) => {
      if (r.selector === `.t-${name}`) {
        rootRule = r;
      }
    });
  });
  if (rootRule === undefined) {
    out.push({
      file: rel,
      message: `no \`.t-${name}\` rule in @layer components.styles`,
    });
  } else {
    const declared = new Set<string>();
    for (const node of rootRule.nodes) {
      if (node.type === "decl") {
        declared.add(node.prop);
      }
    }
    for (const prop of ROOT_BOX_MODEL) {
      if (!declared.has(prop)) {
        out.push({
          file: rel,
          message: `\`.t-${name}\` must declare \`${prop}\` — a component owns its box model, not the reset`,
        });
      }
    }
  }

  // Every --t-* reference is a real token or the component's own override slot.
  root.walkDecls((decl) => {
    for (const ref of decl.value.match(/--t-[\w-]+/g) ?? []) {
      if (!tokens.has(ref) && !ref.startsWith(ownSlot)) {
        out.push({
          file: rel,
          message: `\`${ref}\` is neither a token in tokens.css nor a \`${ownSlot}*\` override slot`,
        });
      }
    }
  });

  return out;
}

function checkComponentsDir(): ViolationDetail[] {
  const componentsDir = resolve(REPO_ROOT, "packages/css/src/components");
  const tokensFile = resolve(REPO_ROOT, "packages/css/src/tokens.css");
  const tokens = buildTokenMap(readFileSync(tokensFile, "utf8"));
  const out: ViolationDetail[] = [];
  for (const entry of readdirSync(componentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = resolve(componentsDir, entry.name, `${entry.name}.css`);
    out.push(
      ...checkComponent(entry.name, relative(REPO_ROOT, file), readFileSync(file, "utf8"), tokens),
    );
  }
  return out;
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: ["packages/css/src/components/**/*.css", "packages/css/src/tokens.css"],
  run: checkComponentsDir,
};
