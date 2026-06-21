// Extract cross-component patterns from consolidated.json into patterns.json.
// Output drives the data tables in docs/research/component-survey-patterns.md.
// The Markdown file is hand-edited (it carries editorial decisions); re-run
// this when consolidated.json changes and reconcile any drifted tables.
//
// Categories:
//   1. Shared prop vocabulary (prop name -> components × systems)
//   2. ARIA pattern counts (separator, dialog, listbox, ...)
//   3. Keyboard pattern counts (escape, arrow, type-ahead, ...)
//   4. Design-choice pattern counts (asChild, render-prop, controlled, roving)
//   5. Naming-convention pairs (open vs isOpen, etc.)
//   6. Alias clusters (3+ aliases observed)

import fs from "node:fs";

const consolidated = JSON.parse(
  fs.readFileSync(".local/component-survey/consolidated.json", "utf8"),
);

const PROP_NAME_RE = /^[a-zA-Z][a-zA-Z0-9]*$/;

function normPropName(raw) {
  const name = String(raw).split(/[\s(]/)[0].trim();
  return PROP_NAME_RE.test(name) ? name : null;
}

function add(map, key, sub) {
  let bucket = map.get(key);
  if (!bucket) {
    bucket = new Map();
    map.set(key, bucket);
  }
  bucket.set(sub, (bucket.get(sub) || 0) + 1);
}

function sortDesc(entries) {
  return entries.sort((a, b) => b[1] - a[1]);
}

// 1. Shared prop vocabulary

const propIndex = new Map();
for (const r of consolidated.ranked) {
  for (const [system, info] of r.systems) {
    if (!info.key_props) continue;
    for (const raw of info.key_props) {
      const name = normPropName(raw);
      if (!name) continue;
      if (!propIndex.has(name)) propIndex.set(name, new Map());
      const compMap = propIndex.get(name);
      if (!compMap.has(r.canon)) compMap.set(r.canon, new Set());
      compMap.get(r.canon).add(system);
    }
  }
}

const sharedProps = [];
for (const [prop, compMap] of propIndex) {
  const components = [];
  let totalSystemHits = 0;
  for (const [canon, sysSet] of compMap) {
    components.push({ canon, sysCount: sysSet.size, systems: [...sysSet] });
    totalSystemHits += sysSet.size;
  }
  components.sort((a, b) => b.sysCount - a.sysCount);
  sharedProps.push({
    prop,
    componentCount: components.length,
    totalSystemHits,
    components,
  });
}
sharedProps.sort((a, b) => {
  if (b.componentCount !== a.componentCount) return b.componentCount - a.componentCount;
  return b.totalSystemHits - a.totalSystemHits;
});

// 2 + 3. ARIA and keyboard pattern counts

const ARIA_PATTERNS = [
  { key: "role=separator", re: /role[=\s"]*separator/i },
  { key: "role=dialog", re: /role[=\s"]*(alert)?dialog/i },
  { key: "role=listbox", re: /role[=\s"]*listbox/i },
  { key: "role=combobox", re: /role[=\s"]*combobox/i },
  { key: "role=menu", re: /role[=\s"]*menu(?!item|bar)/i },
  { key: "role=menubar", re: /role[=\s"]*menubar/i },
  { key: "role=tablist", re: /role[=\s"]*tablist/i },
  { key: "role=tab", re: /role[=\s"]*tab\b/i },
  { key: "role=tabpanel", re: /role[=\s"]*tabpanel/i },
  { key: "role=tooltip", re: /role[=\s"]*tooltip/i },
  { key: "role=alert", re: /role[=\s"]*alert(?!dialog)/i },
  { key: "role=switch", re: /role[=\s"]*switch/i },
  { key: "role=slider", re: /role[=\s"]*slider/i },
  { key: "role=progressbar", re: /role[=\s"]*progressbar/i },
  { key: "role=status", re: /role[=\s"]*status/i },
  { key: "role=radiogroup", re: /role[=\s"]*radiogroup/i },
  { key: "role=tree", re: /role[=\s"]*tree/i },
  { key: "role=grid", re: /role[=\s"]*grid/i },
  { key: "aria-orientation", re: /aria-orientation/i },
  { key: "aria-expanded", re: /aria-expanded/i },
  { key: "aria-controls", re: /aria-controls/i },
  { key: "aria-haspopup", re: /aria-haspopup/i },
  { key: "aria-selected", re: /aria-selected/i },
  { key: "aria-checked", re: /aria-checked/i },
  { key: "aria-pressed", re: /aria-pressed/i },
  { key: "aria-disabled", re: /aria-disabled/i },
  { key: "aria-invalid", re: /aria-invalid/i },
  { key: "aria-describedby", re: /aria-describedby/i },
  { key: "aria-labelledby", re: /aria-labelledby/i },
  { key: "aria-modal", re: /aria-modal/i },
  { key: "aria-live", re: /aria-live/i },
  { key: "aria-activedescendant", re: /aria-activedescendant/i },
  { key: "aria-busy", re: /aria-busy/i },
  { key: "aria-hidden", re: /aria-hidden/i },
];

const KEYBOARD_PATTERNS = [
  { key: "Escape closes", re: /\b(escape|esc)\b/i },
  { key: "arrow keys navigate", re: /\barrow(s)?\b/i },
  { key: "Home/End", re: /\b(home\/end|home and end)\b/i },
  {
    key: "Enter/Space activates",
    re: /\b(enter\/space|enter and space|enter or space|space\/enter)\b/i,
  },
  { key: "Tab traps focus", re: /\b(focus trap|focus-trap|trap(s|ped|ping)? focus)\b/i },
  { key: "Roving tabindex", re: /\broving\b/i },
  { key: "Type-ahead", re: /\b(type[- ]?ahead|typeahead)\b/i },
];

const ariaIndex = new Map();
const kbIndex = new Map();
for (const r of consolidated.ranked) {
  for (const [, info] of r.systems) {
    const text = `${info.a11y_aria || ""} ${info.design_choices || ""}`;
    for (const { key, re } of ARIA_PATTERNS) if (re.test(text)) add(ariaIndex, key, r.canon);
    for (const { key, re } of KEYBOARD_PATTERNS) if (re.test(text)) add(kbIndex, key, r.canon);
  }
}

function summarizePatternIndex(map) {
  const out = [];
  for (const [pattern, compMap] of map) {
    const components = sortDesc([...compMap]).map(([canon, sysCount]) => ({ canon, sysCount }));
    out.push({
      pattern,
      componentCount: components.length,
      totalSystemHits: components.reduce((s, c) => s + c.sysCount, 0),
      components,
    });
  }
  return out.sort((a, b) => {
    if (b.componentCount !== a.componentCount) return b.componentCount - a.componentCount;
    return b.totalSystemHits - a.totalSystemHits;
  });
}

// 4. Design-choice signals (free-text scan over design_choices)

const DESIGN_PATTERNS = [
  { key: "asChild slot", re: /\b(aschild|as-child|as child slot)\b/i },
  { key: "render-prop slot", re: /\b(render[- ]prop|render slot|renderprop)\b/i },
  { key: "polymorphic (as)", re: /\bpolymorphic\b/i },
  {
    key: "controlled+uncontrolled",
    re: /\b(controlled\s*(\+|and|\/)\s*uncontrolled|uncontrolled\s*(\+|and|\/)\s*controlled)\b/i,
  },
  { key: "controlled-only", re: /\bcontrolled[- ]only\b/i },
  { key: "part-based composition", re: /\b(part[- ]based|root\/.+\/.+|multi[- ]part)\b/i },
  { key: "portal / overlay", re: /\b(portal|overlay)\b/i },
  {
    key: "floating positioning",
    re: /\b(floating[- ]ui|anchor[- ]position|positioning|popper)\b/i,
  },
  { key: "data-state attribute", re: /\bdata-state\b/i },
  { key: "scroll lock", re: /\bscroll[- ]lock\b/i },
  { key: "form integration", re: /\b(form integration|name prop|hidden input)\b/i },
];

const designIndex = new Map();
for (const r of consolidated.ranked) {
  for (const [, info] of r.systems) {
    const text = info.design_choices || "";
    for (const { key, re } of DESIGN_PATTERNS) if (re.test(text)) add(designIndex, key, r.canon);
  }
}

// 5. Naming-convention pairs

const NAMING_PAIRS = [
  ["open", "isOpen"],
  ["disabled", "isDisabled"],
  ["loading", "isLoading"],
  ["selected", "isSelected"],
  ["checked", "isChecked"],
  ["invalid", "isInvalid"],
  ["required", "isRequired"],
  ["readOnly", "isReadOnly"],
  ["defaultOpen", "defaultIsOpen"],
  ["defaultValue", "defaultSelected"],
  ["onChange", "onValueChange"],
  ["onOpenChange", "onOpen"],
  ["size", "sx"],
  ["variant", "kind"],
  ["variant", "appearance"],
  ["variant", "type"],
  ["color", "colorScheme"],
  ["icon", "iconBefore"],
];

const namingPairs = NAMING_PAIRS.map(([a, b]) => {
  const aCount = propIndex.get(a)?.size || 0;
  const bCount = propIndex.get(b)?.size || 0;
  return {
    pair: [a, b],
    aComponentCount: aCount,
    bComponentCount: bCount,
    aSystemHits: aCount ? [...propIndex.get(a).values()].reduce((s, set) => s + set.size, 0) : 0,
    bSystemHits: bCount ? [...propIndex.get(b).values()].reduce((s, set) => s + set.size, 0) : 0,
  };
});

// 6. Alias clusters

const aliasClusters = consolidated.ranked
  .filter((r) => r.aliases && r.aliases.length > 1)
  .map((r) => ({
    canon: r.canon,
    sysCount: r.sysCount,
    teseor: r.teseor,
    aliases: r.aliases,
    aliasCount: r.aliases.length,
  }))
  .sort((a, b) => b.aliasCount - a.aliasCount);

const out = {
  meta: {
    totalSystems: consolidated.summary.totalSystems,
    consensusComponents: consolidated.summary.consensusComponents,
  },
  sharedProps: sharedProps.filter((p) => p.componentCount >= 3),
  ariaPatterns: summarizePatternIndex(ariaIndex),
  keyboardPatterns: summarizePatternIndex(kbIndex),
  designPatterns: summarizePatternIndex(designIndex),
  namingPairs,
  aliasClusters: aliasClusters.filter((c) => c.aliasCount >= 3),
};

fs.writeFileSync(".local/component-survey/patterns.json", JSON.stringify(out, null, 2));

console.log("wrote .local/component-survey/patterns.json");
console.log("- shared props (3+ components):", out.sharedProps.length);
console.log("- aria patterns:", out.ariaPatterns.length);
console.log("- keyboard patterns:", out.keyboardPatterns.length);
console.log("- design patterns:", out.designPatterns.length);
console.log("- alias clusters (3+ aliases):", out.aliasClusters.length);
