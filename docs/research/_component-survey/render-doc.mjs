import fs from "node:fs";

const data = JSON.parse(fs.readFileSync(".local/component-survey/consolidated.json", "utf8"));
const { summary, ranked, groups } = data;

const SYSTEMS_ORDER = (() => {
  const order = [];
  for (const g of groups) {
    if (!g) continue;
    for (const s of g.systems) order.push(s.name);
  }
  return order;
})();

const _NUM_SYSTEMS = SYSTEMS_ORDER.length;

// Bucket assignment for priority. Goal: surface what blocks dogfooding the docs site first,
// then high-frequency app primitives, then specialized.
function bucket(r) {
  const { sysCount, relevance, teseor } = r;
  // Shipped already → "covered"
  if (teseor?.startsWith("shipped")) return "covered";
  // Doc-relevant + missing + appears in many systems → "blocks dogfood docs"
  if ((relevance === "doc" || relevance === "both") && sysCount >= 6) return "p1-docs-and-app";
  // App-only but ubiquitous (in 15+ systems) → "core app primitive"
  if (relevance === "app" && sysCount >= 15) return "p1-app-core";
  // Doc-relevant but lower frequency → still doc-blocking
  if (relevance === "doc") return "p2-docs-niche";
  // App-relevant but mid-frequency
  if (relevance === "app" && sysCount >= 6) return "p2-app-common";
  if (relevance === "both" && sysCount >= 4) return "p2-both-common";
  // Tail
  return "p3-specialized";
}

const tagged = ranked.map((r) => ({ ...r, bucket: bucket(r) }));

const lines = [];
const out = (s = "") => lines.push(s);

out("# Component competitive survey");
out("");
out(
  "Phase 1 survey of components across the design-system landscape. The output is a ranked backlog for what Teseor builds next, with explicit dogfood-the-docs framing.",
);
out("");
out("| | |");
out("| --- | --- |");
out(`| Survey date | 2026-06-21 |`);
out(
  `| Systems surveyed | ${summary.totalSystems} across ${summary.totalGroups} families (Phase 1 + 1b) |`,
);
out(`| Raw component entries collected | ${summary.totalComponentEntries} |`);
out(`| Consensus components after clustering | ${summary.consensusComponents} |`);
out(
  `| Teseor shipped today | 9 (button, cluster, code, codeblock, modal, pagination, stack, tablist, tooltip) |`,
);
out(
  "| Per-component detail | `docs/research/component-survey-cards.md` — props observed, a11y notes, design choices, source URLs for the actionable bucket (covered + P1) |",
);
out(
  "| Synthesis scripts (committed, reproducible) | `docs/research/_component-survey/{consolidate,render-doc,render-cards}.mjs` |",
);
out(
  "| Raw per-system data (gitignored, large) | `.local/component-survey/raw-workflow-output.json` + `raw-workflow-1b-output.json` |",
);
out("");
out("## Methodology");
out("");
out(
  "- **Phase 1.** 8 read-only agents fanned out across 44 design systems (headless / opinionated React / brand-enterprise / Tailwind-ecosystem / CSS-only / form-specific / niche surfaces), each pulling per-component metadata (name, category, key props, ARIA notes, design choices, source URL) via Context7 and direct doc fetches. Agents recorded observations only — they did not propose canonical names or pick winners.",
);
out(
  "- **Phase 1b.** 2 follow-up agents covered 6 docs-platform component shelves (Docusaurus, Nextra, VitePress, Mintlify, Astro Starlight, Tailwind Typography prose plugin) to fill the docs-composite vocabulary (Callout/Admonition, CodeGroup, Steps, Cards, FileTree, etc.) the main wave underweighted.",
);
out(
  "- **Consolidation.** A scripted normalizer collapsed package prefixes, part suffixes (`Tabs.Root` → `Tabs`), pluralization, and a hand-curated synonym map onto canonical concept names. ~158 consensus concepts emerged; the long tail is hooks, infrastructure components (Portal, Slot, CssBaseline), and system-unique single-mentions.",
);
out(
  "- **Phase 2 (this doc, lower sections).** Each consensus concept is tagged as `doc-relevant`, `app-relevant`, or `both`, mapped against Teseor's current spec set, and bucketed into priority lanes.",
);
out(
  "- **Phase 3 (next session).** User locked the synthesis defaults on 2026-06-21: renames held (no batch commits — discuss per-component during synthesis), attack order is **P1-docs-and-app first**, docs-platform wave was run.",
);
out(
  "- **Phase 4.** File issues per component (or per closely-related cluster), top of P1-docs-and-app first. One issue ships, then next.",
);
out("");
out("### Reproducing the synthesis");
out("");
out(
  "The synonym map, dogfood-relevance tagging, and bucket assignment are encoded as code, not prose, so they're auditable and re-runnable:",
);
out("");
out(
  "1. Re-run the survey workflows (Phase 1 + Phase 1b — each agent reads design-system docs via Context7 / WebFetch and emits structured JSON per system). Output lands as raw JSON in `.local/component-survey/`.",
);
out(
  "2. `node docs/research/_component-survey/consolidate.mjs` — merges raw waves, applies synonym clustering, writes `consolidated.json`.",
);
out("3. `node docs/research/_component-survey/render-doc.mjs` — writes this file.");
out(
  "4. `node docs/research/_component-survey/render-cards.mjs` — writes `component-survey-cards.md` with per-component prop/a11y/design aggregation.",
);
out("");
out(
  "To extend with a new system, add it to a Phase-1 / Phase-1b workflow script and re-run from step 1. To add a synonym or change a doc/app tag, edit `consolidate.mjs` and re-run from step 2 (no re-fetching).",
);
out("");
out("## Dogfood-the-docs lens");
out("");
out(
  "Teseor is the only CSS the docs site (and any app built on Teseor) is allowed to ship. So the survey ranks each component on two axes:",
);
out("");
out(
  `- **System frequency** — how many of the ${summary.totalSystems} surveyed systems ship a recognizable equivalent.`,
);
out(
  "- **Surface relevance** — whether the component is needed for *prose / docs content* (`doc`), *application interaction* (`app`), or *both*.",
);
out("");
out(
  "A component that scores high on prose-content + missing from Teseor is a blocker for the docs site dogfood and outranks pure-app primitives at the same frequency.",
);
out("");
out("## Priority buckets");
out("");
out(
  "Buckets are not a commitment to ship in this order — they're where each component sits *before* user review. Names are placeholders; final naming decisions happen in synthesis.",
);
out("");
out("| Bucket | Definition | Count |");
out("| --- | --- | --- |");
const buckets = [
  "covered",
  "p1-docs-and-app",
  "p1-app-core",
  "p2-docs-niche",
  "p2-app-common",
  "p2-both-common",
  "p3-specialized",
];
const counts = Object.fromEntries(
  buckets.map((b) => [b, tagged.filter((r) => r.bucket === b).length]),
);
out(`| \`covered\` | Already shipped by Teseor (alias-aware) | ${counts.covered} |`);
out(
  `| \`p1-docs-and-app\` | Doc-relevant or dual-use, present in ≥6 systems, missing from Teseor — blocks dogfooded docs site | ${counts["p1-docs-and-app"]} |`,
);
out(
  `| \`p1-app-core\` | App-only, present in ≥15 systems, missing — core app primitives | ${counts["p1-app-core"]} |`,
);
out(
  `| \`p2-docs-niche\` | Doc-relevant but lower frequency — still doc-blocking | ${counts["p2-docs-niche"]} |`,
);
out(`| \`p2-app-common\` | App-only, mid frequency | ${counts["p2-app-common"]} |`);
out(`| \`p2-both-common\` | Dual-use, mid frequency | ${counts["p2-both-common"]} |`);
out(
  `| \`p3-specialized\` | Tail (low frequency or very specific scope) | ${counts["p3-specialized"]} |`,
);
out("");

function renderBucket(name, title, blurb) {
  const rows = tagged.filter((r) => r.bucket === name);
  if (!rows.length) return;
  out(`### ${title} (${rows.length})`);
  out("");
  if (blurb) {
    out(blurb);
    out("");
  }
  out("| Consensus | Sys | Cat | Lens | Teseor | Aliases (sample) |");
  out("| --- | --- | --- | --- | --- | --- |");
  for (const r of rows) {
    const aliases = r.aliases.slice(0, 4).join(", ").replace(/\|/g, "\\|");
    out(
      `| **${r.canon}** | ${r.sysCount} | ${r.topCategory} | ${r.relevance} | ${r.teseor || "—"} | ${aliases} |`,
    );
  }
  out("");
}

out("## Ranked backlog");
out("");
renderBucket(
  "covered",
  "Already covered by Teseor",
  "These are alias-matched against Teseor's current spec set. Naming reset still applies — some shipped names may not match the consensus pick (see § Rename candidates).",
);
renderBucket(
  "p1-docs-and-app",
  "P1 — Doc-blocking or dual-use",
  "These are the dogfood-the-docs critical path. Each one is either a prose primitive (heading, paragraph, list, divider, code, blockquote) or a dual-use surface used in both docs and app shells. Missing one of these means the docs site needs custom CSS to ship.",
);
renderBucket(
  "p1-app-core",
  "P1 — Core app primitives",
  'Ubiquitous across opinionated libs. Required to claim "build an app with zero custom CSS." Order within this bucket follows system-frequency.',
);
renderBucket(
  "p2-docs-niche",
  "P2 — Lower-frequency doc components",
  "Prose components that appear in fewer systems but still matter for the docs site (Kbd, Mark, Figure, etc.).",
);
renderBucket("p2-app-common", "P2 — Mid-frequency app components");
renderBucket("p2-both-common", "P2 — Mid-frequency dual-use");
renderBucket(
  "p3-specialized",
  "P3 — Specialized or tail-frequency",
  "Lower system count or very narrow scope (color subsystems, niche industry components like QRCode, SignaturePad). Surface only when a concrete need pulls them in.",
);

out("## Rename observations (held — do not act on without per-component sign-off)");
out("");
out(
  "Naming reset means *we can pick the best name*, but the user has locked the decision: **no batch rename commits**. The pairs below are recorded so each future component issue surfaces them in context. Decisions happen per-component during synthesis, not as a global rename sweep.",
);
out("");
out("| Teseor today | Consensus name | Where the consensus comes from | Tension |");
out("| --- | --- | --- | --- |");
out(
  "| `Modal` | `Dialog` | Radix, React Aria, Ark, Base UI, MUI, Mantine, Chakra, Ant, HeroUI, Polaris, Carbon, Atlassian, BaseWeb, Spectrum, Fluent, shadcn/ui, Catalyst, Tailwind UI, daisyUI use `Dialog` | `Dialog` is the WAI-ARIA pattern name; `Modal` is a CSS/visual descriptor. Bootstrap is the main holdout. |",
);
out(
  "| `Tablist` | `Tabs` | Every multi-tab system surveyed surfaces the composite as `Tabs` | `Tablist` is the WAI-ARIA inner-role. Teseor today exposes the composite under the inner-role name. |",
);
out(
  "| `Cluster` | mixed (`Group` / `Cluster` / `Inline`) | `Group` (Carbon, Polaris, Mantine, Ariakit), `Cluster` / `Inline` (Every-Layout, Open Props), `Stack` (Chakra horizontal flavour) | `Group` reads ambiguously next to form `Fieldset` / `RadioGroup`. `Cluster` is unambiguous but less common. No clear winner. |",
);
out("");
out("## Per-system catalog (appendix)");
out("");
out(
  "Raw per-system component lists live in `.local/component-survey/raw-workflow-output.json`. Summary counts only here.",
);
out("");
out("| Family | System | Components recorded |");
out("| --- | --- | --- |");
for (const g of groups) {
  if (!g) continue;
  for (const s of g.systems) {
    out(`| ${g.system_family} | ${s.name} | ${s.components.length} |`);
  }
}
out("");

out("## Notes on the data");
out("");
out(
  "- **Naming clustering is mechanical, not editorial.** When a system has `IconButton` and `Button` as separate exports, both are folded into `Button` (since `IconButton` is a Button variant in most systems). This may over-collapse for systems that treat them as distinct (Carbon, Polaris). When a rename or split would change the count, the synthesis section calls it out.",
);
out(
  "- **`category` is the modal value across systems.** Radix may call `Switch` a primitive while Mantine wraps it in a composite. The matrix reports the most common categorization.",
);
out(
  "- **Form-library entries are noisier.** React Hook Form, Formik, TanStack Form ship hooks and `Controller`-style wrappers, not visual components. They are surveyed for *vocabulary* (Field, FieldArray, FormProvider, ErrorMessage) — Teseor will adopt the patterns that apply to its `Form` and `FormField` composites.",
);
out(
  '- **CSS-only systems surfaced raw HTML elements.** `<table>`, `<details>`, `<blockquote>`, `<kbd>`, `<dl>` etc. show up as "components" because that\'s the entire surface of a classless system. They feed the dogfood-docs ranking directly.',
);
out(
  "- **Niche surfaces are present but unranked together.** Editor shells (Tiptap, Lexical), data grids (AG Grid, TanStack Table), and command palettes (cmdk) appear in the matrix at single-system frequency. The user picks whether Teseor commits to those areas before they enter any priority bucket.",
);
out("");

fs.writeFileSync("docs/research/component-survey.md", lines.join("\n"));
console.log("wrote docs/research/component-survey.md");
console.log(`length: ${lines.length} lines, ${lines.join("\n").length} bytes`);
console.log("bucket counts:", counts);
