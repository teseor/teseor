import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverComponents } from '../../scripts/discover-structure.js';
import {
  makeT,
  parseHtmlDocFile,
  renderHtmlSection,
  sectionIdToTitle,
} from './lib/html-doc-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const PACKAGES_DIR = join(ROOT, 'packages');
const COMPONENTS_DIR = join(PACKAGES_DIR, 'css/src/components');

const TYPE_PATHS = {
  token: 'tokens',
  primitive: 'primitives',
  component: 'components',
  utility: 'utilities',
  guide: 'guides',
};

// Derive groups from directory structure, ordered by config
const groupOrderConfig = JSON.parse(
  readFileSync(join(PACKAGES_DIR, 'css/component-groups.config.json'), 'utf-8'),
);
const discoveredGroups = discoverComponents(COMPONENTS_DIR);

const COMPONENT_GROUPS = groupOrderConfig.groupOrder
  .filter((id) => {
    if (!discoveredGroups.has(id)) {
      console.warn(`component-groups.config.json: "${id}" not found on disk`);
      return false;
    }
    return true;
  })
  .map((id) => ({
    id,
    label: discoveredGroups.get(id).label,
    components: discoveredGroups.get(id).components,
  }));

// Warn about groups on disk not in config
for (const id of discoveredGroups.keys()) {
  if (!groupOrderConfig.groupOrder.includes(id)) {
    console.warn(`Group "${id}" found on disk but missing from component-groups.config.json`);
  }
}

function getGroupFromPath(docsFilePath) {
  const rel = relative(COMPONENTS_DIR, docsFilePath);
  const parts = rel.split(sep);
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

function getGroupById(groupId) {
  return COMPONENT_GROUPS.find((g) => g.id === groupId) || null;
}

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
    } else if (entry === 'docs.html' || entry.endsWith('.docs.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function resolveHtmlDoc(filePath) {
  const { frontmatter, sections: rawSections } = parseHtmlDocFile(filePath);
  const fm = frontmatter;

  // Load API (defaults to ./api.json if not specified)
  let api = null;
  const apiRef = fm.api || './api.json';
  const apiPath = join(dirname(filePath), apiRef);
  try {
    api = JSON.parse(readFileSync(apiPath, 'utf-8'));
  } catch {
    // api not found
  }

  const id = fm.id || api?.name;
  const type = fm.type || 'component';
  const groupId = type === 'component' ? getGroupFromPath(filePath) : null;
  const group = groupId ? getGroupById(groupId) : null;
  const labels = fm.labels || {};
  const t = makeT();

  // Render each section through Nunjucks
  const sections = rawSections.map((raw) => {
    const title = fm.sections?.[raw.id] || sectionIdToTitle(raw.id);

    const context = { api, labels, t };
    const renderedHtml = renderHtmlSection(raw.rawHtml, context);

    // Wrap in layout if specified
    let previewHtml = renderedHtml;
    if (raw.layout) {
      const layoutClass =
        raw.layout === 'row'
          ? 'ui-row ui-row--md'
          : raw.layout === 'column'
            ? 'ui-column ui-column--sm'
            : raw.layout === 'grid'
              ? 'ui-grid'
              : '';
      if (layoutClass) {
        previewHtml = `<div class="${layoutClass}">${renderedHtml}</div>`;
      }
    }

    return {
      title,
      examples: [
        {
          previewHtml,
          codeHtml: renderedHtml,
        },
      ],
    };
  });

  // Use cssVars from API for customization, fall back to frontmatter customization
  const customization = api?.cssVars?.length
    ? api.cssVars.map((v) => ({
        token: v.name,
        default: v.default,
        description: v.description || '',
      }))
    : fm.customization || null;

  return {
    id,
    type,
    typePath: TYPE_PATHS[type] || type,
    group: group?.id || null,
    groupLabel: group?.label || null,
    title: fm.title || (api ? capitalize(api.name) : id),
    description: fm.description || api?.description || '',
    weight: fm.weight || null,
    sections,
    customization,
    api: api || null,
    mergeInto: fm.mergeInto || null,
    permalink: `/${TYPE_PATHS[type] || type}/${id}/`,
  };
}

function loadAllDocs() {
  const docsFiles = findDocsFiles(PACKAGES_DIR);
  const all = [];

  for (const file of docsFiles) {
    try {
      all.push(resolveHtmlDoc(file));
    } catch (err) {
      console.error(`Error loading ${file}: ${err.message}`);
    }
  }

  // Process mergeInto: append secondary docs' sections into target docs
  const primary = all.filter((d) => !d.mergeInto);
  const secondary = all.filter((d) => d.mergeInto);

  for (const sec of secondary) {
    const target = primary.find((d) => d.id === sec.mergeInto);
    if (!target) {
      console.warn(`mergeInto target "${sec.mergeInto}" not found for "${sec.id}"`);
      primary.push(sec);
      continue;
    }
    const mergedSections = sec.sections.map((s) => ({
      ...s,
      title: `${sec.title}: ${s.title}`,
      mergedFrom: sec.id,
    }));
    target.sections.push(...mergedSections);

    if (sec.api) {
      if (!target.mergedApis) target.mergedApis = [];
      target.mergedApis.push({ id: sec.id, title: sec.title, api: sec.api });
    }

    if (sec.customization) {
      if (!target.mergedCustomization) target.mergedCustomization = [];
      target.mergedCustomization.push({
        id: sec.id,
        title: sec.title,
        tokens: sec.customization,
      });
    }
  }

  return primary;
}

export default function (eleventyConfig) {
  // Add global data
  const cssPackage = JSON.parse(readFileSync(join(PACKAGES_DIR, 'css/package.json'), 'utf-8'));
  eleventyConfig.addGlobalData('version', cssPackage.version);
  eleventyConfig.addGlobalData('docs', () => loadAllDocs());
  eleventyConfig.addGlobalData('componentGroups', COMPONENT_GROUPS);

  // Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy({ 'src/public': '.' });
  eleventyConfig.addPassthroughCopy('src/styles.css');
  // Copy compiled CSS library
  eleventyConfig.addPassthroughCopy({
    '../../packages/css/dist/index.css': 'css/index.css',
  });

  // Custom filters
  eleventyConfig.addFilter('byType', (docs, type) => docs.filter((d) => d.type === type));

  eleventyConfig.addFilter('byGroup', (docs, groupId) => docs.filter((d) => d.group === groupId));

  eleventyConfig.addFilter('sortByTitle', (docs) =>
    [...docs].sort((a, b) => (a.title || '').localeCompare(b.title || '')),
  );

  eleventyConfig.addFilter('sortByWeight', (docs) =>
    [...docs].sort((a, b) => {
      const wa = a.weight ?? Number.MAX_SAFE_INTEGER;
      const wb = b.weight ?? Number.MAX_SAFE_INTEGER;
      return wa !== wb ? wa - wb : (a.title || '').localeCompare(b.title || '');
    }),
  );

  // Watch for changes in packages
  eleventyConfig.addWatchTarget(join(ROOT, 'packages/**/docs.html'));
  eleventyConfig.addWatchTarget(join(ROOT, 'packages/**/*.docs.html'));
  eleventyConfig.addWatchTarget(join(ROOT, 'packages/**/api.json'));

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
      data: '_data',
    },
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || '/',
    templateFormats: ['njk', 'html', 'md'],
    htmlTemplateEngine: 'njk',
  };
}
