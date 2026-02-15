import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import nunjucks from 'nunjucks';

import { discoverComponents } from '../../scripts/discover-structure.js';

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
  // components/[group]/[name]/file.docs.json -> parts[0] = group
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
    } else if (entry.endsWith('.docs.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function loadApi(doc, docsFilePath) {
  if (!doc.api) return null;
  const apiPath = join(dirname(docsFilePath), doc.api);
  try {
    return JSON.parse(readFileSync(apiPath, 'utf-8'));
  } catch {
    return null;
  }
}

function resolveDoc(doc, docsFilePath) {
  const api = loadApi(doc, docsFilePath);
  const id = doc.id || api?.name;
  const type = doc.type || 'component';
  const groupId = type === 'component' ? getGroupFromPath(docsFilePath) : null;
  const group = groupId ? getGroupById(groupId) : null;

  // Merge modifier usage from docs into API
  const mergedApi = api ? mergeApiWithDocs(api, doc) : null;

  // Use cssVars from API for customization, fall back to doc.customization
  const customization = api?.cssVars?.length
    ? api.cssVars.map((v) => ({
        token: v.name,
        default: v.default,
        description: v.description || '',
      }))
    : doc.customization || null;

  return {
    id,
    type,
    typePath: TYPE_PATHS[type] || type,
    group: group?.id || null,
    groupLabel: group?.label || null,
    title: doc.title || (api ? capitalize(api.name) : id),
    description: doc.description || api?.description || '',
    sections: doc.sections || [],
    customization,
    api: mergedApi,
    mergeInto: doc.mergeInto || null,
    permalink: `/${TYPE_PATHS[type] || type}/${id}/`,
  };
}

function mergeApiWithDocs(api, doc) {
  if (!doc.modifiers) return api;

  const merged = { ...api, modifiers: { ...api.modifiers } };

  for (const [name, docMod] of Object.entries(doc.modifiers)) {
    if (merged.modifiers[name]) {
      merged.modifiers[name] = {
        ...merged.modifiers[name],
        usage: docMod.usage || '',
      };
    }
  }

  return merged;
}

function loadAllDocs() {
  const docsFiles = findDocsFiles(PACKAGES_DIR);
  const all = [];

  for (const file of docsFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const doc = JSON.parse(content);
      all.push(resolveDoc(doc, file));
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
    // Append sections with a heading that identifies the merged component
    const mergedSections = sec.sections.map((s) => ({
      ...s,
      title: `${sec.title}: ${s.title}`,
      mergedFrom: sec.id,
    }));
    target.sections.push(...mergedSections);

    // Append API as a merged API entry
    if (sec.api) {
      if (!target.mergedApis) target.mergedApis = [];
      target.mergedApis.push({ id: sec.id, title: sec.title, api: sec.api });
    }

    // Append customization tokens
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

function processTemplate(template, data) {
  if (!data || Object.keys(data).length === 0) return template;
  const env = nunjucks.configure({ autoescape: false });
  return env.renderString(template, data);
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

  eleventyConfig.addFilter('processTemplate', (template, data) => processTemplate(template, data));

  function renderItemToHtml(item) {
    // Bare text node - no tag wrapper
    if (!item.tag && item.text && !item.children && !item.class && !item.innerHTML) {
      return item.text;
    }

    const tag = item.tag || 'div';
    const classes = item.class || '';
    const text = item.text || '';

    const style = item.style
      ? Object.entries(item.style)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ')
      : '';

    let attrs = classes ? ` class="${classes}"` : '';
    if (style) attrs += ` style="${style}"`;
    if (item.attrs) {
      for (const [k, v] of Object.entries(item.attrs)) {
        attrs += v === '' ? ` ${k}` : ` ${k}="${v}"`;
      }
    }

    // Content priority: children > innerHTML > text
    let content = text;
    if (item.children && item.children.length > 0) {
      content = item.children.map((child) => renderItemToHtml(child)).join('');
    } else if (item.innerHTML) {
      content = item.innerHTML;
    }

    return `<${tag}${attrs}>${content}</${tag}>`;
  }

  // Filter to render items array to HTML (for preview)
  eleventyConfig.addFilter('renderItems', (items, layout) => {
    if (!items || items.length === 0) return '';

    const html = items.map((item) => renderItemToHtml(item)).join('\n');

    if (layout) {
      const layoutClass =
        layout === 'row'
          ? 'ui-row ui-row--md'
          : layout === 'column'
            ? 'ui-column ui-column--sm'
            : '';
      if (layoutClass) {
        return `<div class="${layoutClass}">${html}</div>`;
      }
    }
    return html;
  });

  eleventyConfig.addFilter('generateCode', (items, options = {}) => {
    if (!items) return '';
    const { layout } = options;

    function itemToCode(item, indent = 0) {
      // Bare text node
      if (!item.tag && item.text && !item.children && !item.class && !item.innerHTML) {
        return item.text;
      }

      const tag = item.tag || 'div';
      const classes = item.class || '';
      const text = item.text || '';
      const pad = '  '.repeat(indent);

      const style = item.style
        ? Object.entries(item.style)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ')
        : '';

      let attrs = classes ? ` class="${classes}"` : '';
      if (style) attrs += ` style="${style}"`;
      if (item.attrs) {
        for (const [k, v] of Object.entries(item.attrs)) {
          attrs += v === '' ? ` ${k}` : ` ${k}="${v}"`;
        }
      }

      // Content priority: children > innerHTML > text
      if (item.children && item.children.length > 0) {
        const inner = item.children.map((c) => itemToCode(c, indent + 1)).join('\n');
        return `${pad}<${tag}${attrs}>\n${inner}\n${pad}</${tag}>`;
      }

      const content = item.innerHTML || text;
      return `${pad}<${tag}${attrs}>${content}</${tag}>`;
    }

    const lines = items.map((item) => itemToCode(item, 0)).join('\n');

    if (layout) {
      const layoutClass =
        layout === 'row'
          ? 'ui-row ui-row--md'
          : layout === 'column'
            ? 'ui-column ui-column--sm'
            : '';
      if (layoutClass) {
        return `<div class="${layoutClass}">\n  ${lines.split('\n').join('\n  ')}\n</div>`;
      }
    }

    return lines;
  });

  // Watch for changes in packages
  eleventyConfig.addWatchTarget(join(ROOT, 'packages/**/*.docs.json'));
  eleventyConfig.addWatchTarget(join(ROOT, 'packages/**/*.api.json'));

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
