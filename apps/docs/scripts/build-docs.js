#!/usr/bin/env node
/**
 * Build Docs Script
 * Finds all .docs.json files and renders them to HTML
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderDoc } from './render-section.js';

/**
 * Component groups with their members
 * Order determines nav display order
 */
const COMPONENT_GROUPS = [
  { id: 'actions', label: 'Actions', components: ['button', 'button-group'] },
  { id: 'typography', label: 'Typography', components: ['heading', 'link', 'code'] },
  {
    id: 'forms',
    label: 'Forms',
    components: [
      'label',
      'input',
      'textarea',
      'select',
      'checkbox',
      'radio',
      'toggle',
      'field',
      'form-helper',
      'form-error',
    ],
  },
  {
    id: 'data-display',
    label: 'Data Display',
    components: ['avatar', 'badge', 'icon', 'tag', 'status', 'card', 'table', 'data-list'],
  },
  {
    id: 'feedback',
    label: 'Feedback',
    components: ['alert', 'spinner', 'progress', 'skeleton', 'toast'],
  },
  {
    id: 'overlays',
    label: 'Overlays',
    components: ['overlay', 'tooltip', 'popover', 'modal', 'dialog', 'drawer'],
  },
  { id: 'disclosure', label: 'Disclosure', components: ['disclosure', 'accordion'] },
  {
    id: 'navigation',
    label: 'Navigation',
    components: ['tabs', 'breadcrumb', 'menu', 'pagination'],
  },
  { id: 'layout', label: 'Layout', components: ['divider'] },
];

function getGroupForComponent(componentId) {
  for (const group of COMPONENT_GROUPS) {
    if (group.components.includes(componentId)) {
      return group.id;
    }
  }
  return null;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const SRC_DIR = join(__dirname, '../src');
const OUTPUT_DIR = join(SRC_DIR, 'generated');

/**
 * Recursively find all .docs.json files
 */
function findDocsFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (
      stat.isDirectory() &&
      !entry.startsWith('.') &&
      entry !== 'node_modules' &&
      entry !== 'dist'
    ) {
      findDocsFiles(fullPath, files);
    } else if (entry.endsWith('.docs.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Resolve doc by merging with API if present
 */
function resolveDoc(doc, docsFilePath) {
  // If no api field, doc must have all required fields
  if (!doc.api) {
    const id = doc.id;
    const type = doc.type;
    return {
      id,
      type,
      group: type === 'component' ? doc.group || getGroupForComponent(id) : null,
      title: doc.title,
      description: doc.description,
      sections: doc.sections,
      vars: null,
      componentName: null,
    };
  }

  // Load API file
  const apiPath = join(dirname(docsFilePath), doc.api);
  let api;
  try {
    api = JSON.parse(readFileSync(apiPath, 'utf-8'));
  } catch (err) {
    throw new Error(`Cannot read API file ${doc.api}: ${err.message}`);
  }

  // Merge: doc fields override api fields
  const id = doc.id || api.name;
  const type = doc.type || 'component';
  return {
    id,
    type,
    group: type === 'component' ? doc.group || getGroupForComponent(id) : null,
    title: doc.title || capitalize(api.name),
    description: doc.description || api.description,
    sections: doc.sections,
    vars: api.vars || null,
    componentName: api.name,
  };
}

/**
 * Main build function
 */
function build() {
  console.log('Building docs from JSON files...\n');

  // Find all .docs.json files in packages/
  const packagesDir = join(ROOT, 'packages');
  const docsFiles = findDocsFiles(packagesDir);

  if (docsFiles.length === 0) {
    console.log('No .docs.json files found.');
    return;
  }

  console.log(`Found ${docsFiles.length} docs files:\n`);

  const renderedDocs = [];

  for (const file of docsFiles) {
    const relativePath = relative(ROOT, file);
    console.log(`  - ${relativePath}`);

    try {
      const content = readFileSync(file, 'utf-8');
      const doc = JSON.parse(content);
      const resolved = resolveDoc(doc, file);
      const html = renderDoc(resolved);
      renderedDocs.push({
        id: resolved.id,
        type: resolved.type,
        group: resolved.group,
        title: resolved.title,
        html,
      });
    } catch (err) {
      console.error(`    Error: ${err.message}`);
    }
  }

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Group by type for organized output
  const byType = {
    token: [],
    primitive: [],
    component: [],
    utility: [],
  };

  for (const doc of renderedDocs) {
    if (byType[doc.type]) {
      byType[doc.type].push(doc);
    }
  }

  // Build docs content HTML
  const docsContent = [
    '<!-- Tokens -->',
    ...byType.token.map((d) => d.html),
    '',
    '<!-- Primitives -->',
    ...byType.primitive.map((d) => d.html),
    '',
    '<!-- Components -->',
    ...byType.component.map((d) => d.html),
    '',
    '<!-- Utilities -->',
    ...byType.utility.map((d) => d.html),
  ].join('\n');

  // Build navigation HTML with nested component groups
  function buildNavSection(label, items, isFirst) {
    if (items.length === 0) return '';
    const heading = `<h2 class="ui-nav-heading${isFirst ? '' : ' ui-mt-4'}">${label}</h2>`;
    const links = items
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((doc) => `      <a class="ui-nav-link" href="#${doc.id}">${doc.title}</a>`)
      .join('\n');
    return `${isFirst ? '' : '\n      '}${heading}\n${links}`;
  }

  function buildComponentsNav(components) {
    if (components.length === 0) return '';

    const sections = [];
    sections.push('<h2 class="ui-nav-heading ui-mt-4">Components</h2>');

    for (const groupConfig of COMPONENT_GROUPS) {
      const groupItems = components.filter((c) => c.group === groupConfig.id);
      if (groupItems.length === 0) continue;

      const groupHeading = `      <h3 class="ui-nav-subheading">${groupConfig.label}</h3>`;
      const links = groupItems
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(
          (doc) =>
            `        <a class="ui-nav-link ui-nav-link--nested" href="#${doc.id}">${doc.title}</a>`,
        )
        .join('\n');
      sections.push(`${groupHeading}\n${links}`);
    }

    // Handle ungrouped components
    const ungrouped = components.filter((c) => !c.group);
    if (ungrouped.length > 0) {
      const links = ungrouped
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((doc) => `      <a class="ui-nav-link" href="#${doc.id}">${doc.title}</a>`)
        .join('\n');
      sections.push(links);
    }

    return sections.join('\n');
  }

  const navParts = [];
  if (byType.token.length > 0) {
    navParts.push(buildNavSection('Tokens', byType.token, navParts.length === 0));
  }
  if (byType.primitive.length > 0) {
    navParts.push(buildNavSection('Primitives', byType.primitive, navParts.length === 0));
  }
  if (byType.component.length > 0) {
    navParts.push(buildComponentsNav(byType.component));
  }
  if (byType.utility.length > 0) {
    navParts.push(buildNavSection('Utilities', byType.utility, navParts.length === 0));
  }

  const navHtml = navParts.join('\n');

  // Write standalone docs-content.html (for reference)
  const contentFile = join(OUTPUT_DIR, 'docs-content.html');
  writeFileSync(contentFile, `<!-- Generated by build-docs.js - DO NOT EDIT -->\n\n${docsContent}`);
  console.log(`\nGenerated: ${relative(ROOT, contentFile)}`);

  // Read template and inject content
  const templateFile = join(SRC_DIR, 'index.template.html');
  const template = readFileSync(templateFile, 'utf-8');
  const indexHtml = template
    .replace('<!-- DOCS_NAV -->', navHtml)
    .replace('<!-- DOCS_CONTENT -->', docsContent);

  // Write index.html
  const indexFile = join(SRC_DIR, 'index.html');
  writeFileSync(indexFile, indexHtml);
  console.log(`Generated: ${relative(ROOT, indexFile)}`);

  console.log('Done!');
}

build();
