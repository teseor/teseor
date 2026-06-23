import postcss from "postcss";
import postcssEach from "postcss-each";
import type { TokenDictionary } from "../../lib/token-dictionary.ts";
import type { AtomicSpec, CompositeSpec, Spec, SpecPart } from "../../schema.ts";
import type { Issue } from "../../semantic-checks.ts";

type TokensCss = ReadonlySet<string>;

function isAtomic(spec: Spec): spec is AtomicSpec {
  return spec.kind === "atomic";
}

function isComposite(spec: Spec): spec is CompositeSpec {
  return spec.kind === "composite";
}

function issue(spec: string, path: string, message: string): Issue {
  return { spec, path, message };
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = (prev[j] ?? 0) + 1;
      const ins = (curr[j - 1] ?? 0) + 1;
      const sub = (prev[j - 1] ?? 0) + cost;
      curr[j] = Math.min(del, ins, sub);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j] ?? 0;
  }
  return prev[b.length] ?? 0;
}

function suggest(
  candidate: string,
  options: readonly string[],
  maxDistance = 3,
): string | undefined {
  let best: { name: string; distance: number } | undefined;
  for (const option of options) {
    const distance = levenshtein(candidate.toLowerCase(), option.toLowerCase());
    if (distance > maxDistance) continue;
    if (best === undefined || distance < best.distance) best = { name: option, distance };
  }
  return best?.name;
}

// ── Token contract (spec ↔ CSS) ─────────────────────────────────────────────

function extractPublicSlots(css: string, specName: string): Set<string> {
  const slots = new Set<string>();
  const escapedName = specName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`--t-${escapedName}-([A-Za-z0-9_-]+)`, "g");
  for (const match of css.matchAll(pattern)) {
    if (match[1] !== undefined) slots.add(match[1]);
  }
  return slots;
}

function declaredPublicSlots(spec: Spec): Map<string, string> {
  const out = new Map<string, string>();
  if (isAtomic(spec)) {
    for (const key of Object.keys(spec.tokens ?? {})) {
      out.set(key, `tokens.${key}`);
    }
    return out;
  }
  if (!isComposite(spec)) return out;
  const counts = new Map<string, number>();
  const countTokens = (parts: Record<string, SpecPart>): void => {
    for (const part of Object.values(parts)) {
      for (const key of Object.keys(part.tokens ?? {})) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      if (part.parts) countTokens(part.parts);
    }
  };
  countTokens(spec.parts);
  const visit = (parts: Record<string, SpecPart>, partPath: string): void => {
    for (const [partName, part] of Object.entries(parts)) {
      const path = partPath === "" ? partName : `${partPath}.${partName}`;
      for (const key of Object.keys(part.tokens ?? {})) {
        const suffix = (counts.get(key) ?? 0) > 1 ? `${path.replace(/\./g, "-")}-${key}` : key;
        out.set(suffix, `parts.${path}.tokens.${key}`);
      }
      if (part.parts) visit(part.parts, path);
    }
  };
  visit(spec.parts, "");
  return out;
}

function overlayAnchorSlot(spec: Spec): { suffix: string; path: string } | undefined {
  if (spec.kind !== "composite") return undefined;
  for (const [partName, part] of Object.entries(spec.parts)) {
    const anchorVar = part.overlay?.anchorVar;
    if (!anchorVar) continue;
    const prefix = `--t-${spec.name}-`;
    if (!anchorVar.startsWith(prefix)) continue;
    return {
      suffix: anchorVar.slice(prefix.length),
      path: `parts.${partName}.overlay.anchorVar`,
    };
  }
  return undefined;
}

export function checkTokenContract(
  spec: Spec,
  css: string | undefined,
  tokensCss?: TokensCss,
): Issue[] {
  const issues: Issue[] = [];
  const declared = declaredPublicSlots(spec);
  const anchor = overlayAnchorSlot(spec);
  if (anchor) declared.set(anchor.suffix, anchor.path);
  if (css === undefined) {
    if (declared.size > 0) {
      issues.push(
        issue(
          spec.name,
          "tokens",
          `spec declares tokens but the component CSS file is missing or unreadable`,
        ),
      );
    }
    return issues;
  }
  const slots = extractPublicSlots(css, spec.name);
  for (const [suffix, path] of declared) {
    if (!slots.has(suffix)) {
      issues.push(
        issue(
          spec.name,
          path,
          `token slot is declared in the spec but never read in the CSS as --t-${spec.name}-${suffix}`,
        ),
      );
    }
  }
  for (const suffix of slots) {
    if (declared.has(suffix)) continue;
    if (tokensCss?.has(`--t-${spec.name}-${suffix}`)) continue;
    issues.push(
      issue(
        spec.name,
        "tokens",
        `CSS reads --t-${spec.name}-${suffix} but no matching token is declared in the spec`,
      ),
    );
  }
  return issues;
}

// ── Token fallback values ↔ tokens.css ──────────────────────────────────────

export function checkTokenFallbacks(spec: Spec, tokensCss: TokensCss): Issue[] {
  const issues: Issue[] = [];
  const ownSlotPrefix = `--t-${spec.name}-`;
  const validate = (fallback: string, path: string): void => {
    if (!fallback.startsWith("--")) return;
    if (tokensCss.has(fallback)) return;
    if (fallback.startsWith(ownSlotPrefix)) return;
    issues.push(
      issue(spec.name, path, `fallback '${fallback}' is not a token declared in tokens.css`),
    );
  };
  const visitNode = (node: AtomicSpec | SpecPart, basePath: string): void => {
    for (const [key, def] of Object.entries(node.tokens ?? {})) {
      validate(def.fallback, `${basePath}tokens.${key}.fallback`);
    }
    for (const [intentName, intent] of Object.entries(node.intents ?? {})) {
      for (const [tokenKey, fallback] of Object.entries(intent.tokens ?? {})) {
        validate(fallback, `${basePath}intents.${intentName}.tokens.${tokenKey}`);
      }
    }
    for (const [sizeName, size] of Object.entries(node.sizes ?? {})) {
      for (const [tokenKey, fallback] of Object.entries(size.tokens ?? {})) {
        validate(fallback, `${basePath}sizes.${sizeName}.tokens.${tokenKey}`);
      }
    }
  };
  if (isAtomic(spec)) {
    visitNode(spec, "");
  } else if (isComposite(spec)) {
    const walk = (parts: Record<string, SpecPart>, basePath: string): void => {
      for (const [partName, part] of Object.entries(parts)) {
        const partPath = basePath === "" ? `parts.${partName}` : `${basePath}.parts.${partName}`;
        visitNode(part, `${partPath}.`);
        if (part.parts) walk(part.parts, partPath);
      }
    };
    walk(spec.parts, "");
  }
  return issues;
}

// ── Private-token slots (`--_*`) ↔ CSS declarations ─────────────────────────

function rootRule(rule: postcss.Rule): postcss.Rule {
  let current: postcss.Rule = rule;
  let parent = current.parent;
  while (parent) {
    if (parent.type === "rule") {
      current = parent as postcss.Rule;
      parent = current.parent;
    } else if (parent.type === "atrule") {
      parent = parent.parent;
    } else {
      break;
    }
  }
  return current;
}

function privateSlotsBySelector(css: string): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const root = postcss([postcssEach()]).process(css, { from: undefined }).root;
  root.walkDecls(/^--_/, (decl) => {
    const parent = decl.parent;
    if (parent === undefined || parent.type !== "rule") return;
    const top = rootRule(parent as postcss.Rule);
    const cls = top.selector.match(/^\.([A-Za-z0-9_-]+)/)?.[1];
    if (cls === undefined) return;
    const set = out.get(cls) ?? new Set<string>();
    set.add(decl.prop);
    out.set(cls, set);
  });
  return out;
}

export function checkPrivateTokens(spec: Spec, css: string | undefined): Issue[] {
  const issues: Issue[] = [];
  if (css === undefined) return issues;
  const slotsBySelector = privateSlotsBySelector(css);

  const checkOne = (
    declared: ReadonlyArray<string>,
    cls: string | undefined,
    path: string,
  ): void => {
    const used = cls === undefined ? new Set<string>() : (slotsBySelector.get(cls) ?? new Set());
    const declaredSet = new Set(declared);
    for (const slot of declaredSet) {
      if (!used.has(slot)) {
        issues.push(
          issue(
            spec.name,
            path,
            cls === undefined
              ? `'${slot}' is listed in privateTokens but never declared in the CSS`
              : `'${slot}' is listed in ${path} but never declared under .${cls} in the CSS`,
          ),
        );
      }
    }
    if (cls !== undefined) {
      for (const slot of used) {
        if (!declaredSet.has(slot)) {
          issues.push(
            issue(spec.name, path, `.${cls} declares '${slot}' but it is not listed in ${path}`),
          );
        }
      }
    }
  };

  if (isAtomic(spec)) {
    checkOne(spec.privateTokens ?? [], spec.rootClass, "privateTokens");
    for (const [cls, slots] of slotsBySelector) {
      if (cls === spec.rootClass) continue;
      for (const slot of slots) {
        issues.push(
          issue(
            spec.name,
            "privateTokens",
            `.${cls} declares '${slot}' but no part with that rootClass is declared`,
          ),
        );
      }
    }
    return issues;
  }

  if (isComposite(spec)) {
    const seen = new Set<string>();
    const walk = (parts: Record<string, SpecPart>, prefix: string): void => {
      for (const [partName, part] of Object.entries(parts)) {
        const path = prefix === "" ? `parts.${partName}` : `${prefix}.parts.${partName}`;
        checkOne(part.privateTokens ?? [], part.rootClass, `${path}.privateTokens`);
        if (part.rootClass) seen.add(part.rootClass);
        if (part.parts) walk(part.parts, path);
      }
    };
    walk(spec.parts, "");
    for (const [cls, slots] of slotsBySelector) {
      if (seen.has(cls)) continue;
      for (const slot of slots) {
        issues.push(
          issue(
            spec.name,
            "privateTokens",
            `.${cls} declares '${slot}' but no part with that rootClass is declared`,
          ),
        );
      }
    }
  }
  return issues;
}

// ── Token name dictionary (`specs/_tokens.yaml`) ────────────────────────────

export function checkTokenNames(spec: Spec, dictionary: TokenDictionary): Issue[] {
  const issues: Issue[] = [];
  const canonicalList = [...dictionary.canonical];
  const visit = (tokens: Record<string, unknown> | undefined, path: string): void => {
    for (const key of Object.keys(tokens ?? {})) {
      if (dictionary.canonical.has(key)) continue;
      const synonymTarget = dictionary.synonyms.get(key);
      if (synonymTarget) {
        issues.push(
          issue(
            spec.name,
            `${path}.${key}`,
            `use canonical '${synonymTarget}' instead of '${key}' (specs/_tokens.yaml synonyms)`,
          ),
        );
        continue;
      }
      const hint = suggest(key, canonicalList, 1);
      if (hint && hint !== key) {
        issues.push(
          issue(
            spec.name,
            `${path}.${key}`,
            `'${key}' looks like a typo of canonical token '${hint}'`,
          ),
        );
      }
    }
  };
  if (isAtomic(spec)) {
    visit(spec.tokens, "tokens");
    return issues;
  }
  if (isComposite(spec)) {
    const walk = (parts: Record<string, SpecPart>, basePath: string): void => {
      for (const [partName, part] of Object.entries(parts)) {
        visit(part.tokens, `${basePath}.${partName}.tokens`);
        if (part.parts) walk(part.parts, `${basePath}.${partName}.parts`);
      }
    };
    walk(spec.parts, "parts");
  }
  return issues;
}

// ── Dependency `@import` allowlist ──────────────────────────────────────────

export function checkCssImportAllowlist(spec: Spec, css: string | undefined): Issue[] {
  const issues: Issue[] = [];
  if (css === undefined) return issues;
  const declared = new Set(spec.dependencies ?? []);
  const importRe = /@import\s+["']\.\.\/([A-Za-z0-9_-]+)\/[A-Za-z0-9_-]+\.css["']/g;
  for (const match of css.matchAll(importRe)) {
    const target = match[1];
    if (target === undefined || target === spec.name) continue;
    if (!declared.has(target)) {
      issues.push(
        issue(
          spec.name,
          "dependencies",
          `CSS @imports '${target}' but it is not listed in spec.dependencies`,
        ),
      );
    }
  }
  return issues;
}
