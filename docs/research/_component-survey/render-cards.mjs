// Render per-component detail cards (props, a11y, design choices, URLs)
// for the actionable bucket: covered + P1-docs-and-app + P1-app-core.
// P2/P3 raw data stays in consolidated.json; cards can be re-run including those when promoted.

import fs from "node:fs";

const data = JSON.parse(fs.readFileSync(".local/component-survey/consolidated.json", "utf8"));
const { ranked } = data;

// Re-derive bucket assignment (kept in sync with render-doc.mjs).
function bucket(r) {
  const { sysCount, relevance, teseor } = r;
  if (teseor?.startsWith("shipped")) return "covered";
  if ((relevance === "doc" || relevance === "both") && sysCount >= 6) return "p1-docs-and-app";
  if (relevance === "app" && sysCount >= 15) return "p1-app-core";
  if (relevance === "doc") return "p2-docs-niche";
  if (relevance === "app" && sysCount >= 6) return "p2-app-common";
  if (relevance === "both" && sysCount >= 4) return "p2-both-common";
  return "p3-specialized";
}

const ACTIONABLE = new Set(["covered", "p1-docs-and-app", "p1-app-core"]);

const lines = [];
const out = (s = "") => lines.push(s);

out("<!-- markdownlint-disable MD033 -->");
out("");
out("# Component competitive survey — detail cards");
out("");
out(
  "Per-canonical-component aggregation: which systems ship it, props observed across systems (with frequency), distinct a11y/ARIA notes, distinct design choices, and source URLs. This file is the input for issue drafting — copy the relevant card into each per-component issue body.",
);
out("");
out(
  "**Scope:** cards rendered only for `covered` + `p1-docs-and-app` + `p1-app-core` (the actionable bucket). Raw per-system data for the remaining ~100 P2/P3 consensus components is preserved in `.local/component-survey/raw-workflow-output.json` + `raw-workflow-1b-output.json` and `consolidated.json`. Re-run `.local/component-survey/render-cards.mjs` after promoting a P2/P3 entry to extend the file.",
);
out("");
out("See `component-survey.md` for the synthesis, bucket counts, and rename observations.");
out("");

function aggregateProps(systems) {
  const freq = new Map();
  for (const [sysName, entry] of systems) {
    const props = entry.key_props || [];
    for (const raw of props) {
      const p = String(raw).trim();
      if (!p) continue;
      if (!freq.has(p)) freq.set(p, new Set());
      freq.get(p).add(sysName);
    }
  }
  return [...freq.entries()]
    .map(([prop, sysSet]) => ({ prop, count: sysSet.size, systems: [...sysSet].sort() }))
    .sort((a, b) => b.count - a.count || a.prop.localeCompare(b.prop));
}

function safeText(s) {
  // Escape markdown-active chars in free-text agent strings to prevent lint
  // false-positives (emphasis, reference links, images, HTML).
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/([*_[\]<>!`])/g, "\\$1");
}

function distinctNotes(systems, field) {
  // Group identical notes; attribute systems that share each one.
  const map = new Map();
  for (const [sysName, entry] of systems) {
    const note = (entry[field] || "").trim();
    if (!note) continue;
    if (!map.has(note)) map.set(note, []);
    map.get(note).push(sysName);
  }
  return [...map.entries()]
    .map(([note, sys]) => ({ note: safeText(note), systems: sys }))
    .sort((a, b) => b.systems.length - a.systems.length);
}

function categoryBreakdown(systems) {
  const m = new Map();
  for (const [, entry] of systems) {
    const c = entry.category;
    m.set(c, (m.get(c) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function renderCard(r) {
  out(`### ${r.canon}`);
  out("");
  const teseor = r.teseor || "missing";
  out(
    `**Systems including:** ${r.sysCount}  |  **Lens:** ${r.relevance}  |  **Teseor:** ${teseor}`,
  );
  out("");

  const cats = categoryBreakdown(r.systems);
  if (cats.length === 1) {
    out(`**Category:** ${cats[0][0]} (all ${cats[0][1]} systems)`);
  } else {
    out(`**Category mix:** ${cats.map(([c, n]) => `${c}×${n}`).join(", ")}`);
  }
  out("");

  // Aliases observed
  if (r.aliases.length) {
    const sample = r.aliases
      .slice(0, 12)
      .map((a) => `\`${a}\``)
      .join(", ");
    const more = r.aliases.length > 12 ? ` (+${r.aliases.length - 12} more)` : "";
    out(`**Aliases observed:** ${sample}${more}`);
    out("");
  }

  // Props frequency
  const props = aggregateProps(r.systems);
  if (props.length) {
    out("**Props observed (frequency across systems):**");
    out("");
    out("| Prop | Systems |");
    out("| --- | --- |");
    for (const { prop, count, systems } of props.slice(0, 40)) {
      const sysLabel =
        count <= 6 ? systems.join(", ") : `${systems.slice(0, 4).join(", ")} +${count - 4} more`;
      out(`| \`${prop.replace(/\|/g, "\\|")}\` | ${count} (${sysLabel}) |`);
    }
    if (props.length > 40) out(`| _… +${props.length - 40} more props_ | |`);
    out("");
  }

  // A11y / ARIA notes
  const a11y = distinctNotes(r.systems, "a11y_aria");
  if (a11y.length) {
    out("**A11y / ARIA observations:**");
    out("");
    for (const { note, systems } of a11y) {
      const attr =
        systems.length <= 4
          ? systems.join(", ")
          : `${systems.slice(0, 3).join(", ")} +${systems.length - 3} more`;
      out(`- ${note} — _${attr}_`);
    }
    out("");
  }

  // Design choices
  const design = distinctNotes(r.systems, "design_choices");
  if (design.length) {
    out("**Design choices observed:**");
    out("");
    for (const { note, systems } of design) {
      const attr =
        systems.length <= 4
          ? systems.join(", ")
          : `${systems.slice(0, 3).join(", ")} +${systems.length - 3} more`;
      out(`- ${note} — _${attr}_`);
    }
    out("");
  }

  // Source URLs
  out("**Source URLs:**");
  out("");
  for (const [sysName, entry] of r.systems) {
    if (entry.source_url) out(`- [${sysName}](${entry.source_url}) — \`${entry.origName}\``);
  }
  out("");
  out("---");
  out("");
}

// Bucketize and render in priority order.
const buckets = { covered: [], "p1-docs-and-app": [], "p1-app-core": [] };
for (const r of ranked) {
  const b = bucket(r);
  if (ACTIONABLE.has(b)) buckets[b].push(r);
}

function sectionHeader(_name, title, count) {
  out(`## ${title}`);
  out("");
  out(`${count} components.`);
  out("");
}

sectionHeader("covered", "Already covered by Teseor", buckets.covered.length);
for (const r of buckets.covered) renderCard(r);

sectionHeader(
  "p1-docs-and-app",
  "P1 — Doc-blocking or dual-use",
  buckets["p1-docs-and-app"].length,
);
for (const r of buckets["p1-docs-and-app"]) renderCard(r);

sectionHeader("p1-app-core", "P1 — Core app primitives", buckets["p1-app-core"].length);
for (const r of buckets["p1-app-core"]) renderCard(r);

fs.writeFileSync("docs/research/component-survey-cards.md", lines.join("\n"));
const sz = fs.statSync("docs/research/component-survey-cards.md").size;
console.log(
  `wrote docs/research/component-survey-cards.md — ${lines.length} lines, ${(sz / 1024).toFixed(1)} KB`,
);
console.log(
  `bucket sizes: covered=${buckets.covered.length}, p1-docs-and-app=${buckets["p1-docs-and-app"].length}, p1-app-core=${buckets["p1-app-core"].length}`,
);
