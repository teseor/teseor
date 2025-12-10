import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import nunjucks from 'nunjucks';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const PACKAGES_DIR = join(ROOT, 'packages');

const TYPE_PATHS = {
  token: 'tokens',
  primitive: 'primitives',
  component: 'components',
  utility: 'utilities',
  guide: 'guides',
};

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
      return group;
    }
  }
  return null;
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
  const group = type === 'component' ? getGroupForComponent(id) : null;

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
  const docs = [];

  for (const file of docsFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const doc = JSON.parse(content);
      docs.push(resolveDoc(doc, file));
    } catch (err) {
      console.error(`Error loading ${file}: ${err.message}`);
    }
  }

  return docs;
}

function processTemplate(template, data) {
  if (!data || Object.keys(data).length === 0) return template;
  const env = nunjucks.configure({ autoescape: false });
  return env.renderString(template, data);
}

export default function (eleventyConfig) {
  // Add global data
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

  // Recursive item renderer - handles nested children
  function renderItemToHtml(item) {
    const tag = item.tag || 'div';
    const classes = item.class || '';
    const text = item.text || '';

    // Build style attribute
    const style = item.style
      ? Object.entries(item.style)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ')
      : '';

    // Build attributes
    let attrs = classes ? ` class="${classes}"` : '';
    if (style) attrs += ` style="${style}"`;
    if (item.attrs) {
      for (const [k, v] of Object.entries(item.attrs)) {
        attrs += v === '' ? ` ${k}` : ` ${k}="${v}"`;
      }
    }

    // Content: children (recursive) or text
    let content = text;
    if (item.children && item.children.length > 0) {
      content = item.children.map((child) => renderItemToHtml(child)).join('');
    }

    return `<${tag}${attrs}>${content}</${tag}>`;
  }

  // Filter to render items array to HTML (for preview)
  eleventyConfig.addFilter('renderItems', (items, layout) => {
    if (!items || items.length === 0) return '';

    const html = items.map((item) => renderItemToHtml(item)).join('\n');

    if (layout) {
      const layoutClass =
        layout === 'cluster'
          ? 'ui-cluster ui-cluster--md'
          : layout === 'stack'
            ? 'ui-stack ui-stack--sm'
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

    const lines = items.map((item) => {
      const tag = item.tag || 'div';
      const classes = item.class || '';
      const text = item.text || '';
      const html = item.html || text;

      // Build attributes
      let attrs = classes ? ` class="${classes}"` : '';
      if (item.attrs) {
        for (const [k, v] of Object.entries(item.attrs)) {
          attrs += v === '' ? ` ${k}` : ` ${k}="${v}"`;
        }
      }

      return `<${tag}${attrs}>${html}</${tag}>`;
    });

    // Wrap in layout container if specified
    if (layout) {
      const layoutClass =
        layout === 'cluster'
          ? 'ui-cluster ui-cluster--md'
          : layout === 'stack'
            ? 'ui-stack ui-stack--sm'
            : '';
      if (layoutClass) {
        return `<div class="${layoutClass}">\n  ${lines.join('\n  ')}\n</div>`;
      }
    }

    return lines.join('\n');
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
