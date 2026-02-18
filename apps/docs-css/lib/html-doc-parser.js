/**
 * HTML Doc Parser
 * Parses .docs.html files with YAML frontmatter and section-delimited HTML.
 *
 * Format:
 *   ---
 *   title: Button
 *   type: component
 *   api: ./button.api.json
 *   labels:
 *     sm: Small
 *   ---
 *   <!-- @section_id -->
 *   <button class="ui-button">Click</button>
 *
 *   <!-- @sizes | row -->
 *   {% for s in api.modifiers.size.values %}...{% endfor %}
 */

import { readFileSync } from 'node:fs';
import nunjucks from 'nunjucks';

const nunjucksEnv = nunjucks.configure({ autoescape: false });

// Simple YAML frontmatter parser (handles strings, numbers, booleans, maps)
function parseFrontmatter(raw) {
  const result = {};
  const lines = raw.split('\n');
  let currentKey = null;
  let currentIndent = 0;
  let currentMap = null;

  for (const line of lines) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const mapEntryMatch = line.match(/^(\s+)(\w[\w-]*):\s*(.*)$/);
    const topMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);

    if (topMatch && !line.startsWith(' ')) {
      // Top-level key
      if (currentKey && currentMap) {
        result[currentKey] = currentMap;
      }

      const [, key, val] = topMatch;
      const trimmed = val.trim();

      if (trimmed === '') {
        // Start of a map
        currentKey = key;
        currentMap = {};
        currentIndent = 0;
      } else {
        currentKey = null;
        currentMap = null;
        result[key] = parseScalar(trimmed);
      }
    } else if (mapEntryMatch && currentKey && currentMap) {
      const [, , key, val] = mapEntryMatch;
      currentMap[key] = parseScalar(val.trim());
    }
  }

  // Flush last map
  if (currentKey && currentMap) {
    result[currentKey] = currentMap;
  }

  return result;
}

function parseScalar(val) {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}

/**
 * Parse a .docs.html file into frontmatter + raw sections.
 * @param {string} filePath - absolute path to .docs.html file
 * @returns {{ frontmatter: object, sections: Array<{id: string, layout: string|null, rawHtml: string}> }}
 */
export function parseHtmlDocFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return parseHtmlDocString(content);
}

/**
 * Parse HTML doc content string into frontmatter + raw sections.
 * @param {string} content - raw .docs.html content
 * @returns {{ frontmatter: object, sections: Array<{id: string, layout: string|null, rawHtml: string}> }}
 */
export function parseHtmlDocString(content) {
  // Extract frontmatter
  let frontmatter = {};
  let body = content;

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (fmMatch) {
    frontmatter = parseFrontmatter(fmMatch[1]);
    body = fmMatch[2];
  }

  // Split body into sections by <!-- @section_id --> or <!-- @section_id | layout -->
  const sectionRegex = /<!--\s*@(\w+)(?:\s*\|\s*(\w+))?\s*-->/g;
  const sections = [];
  let lastIndex = 0;
  let lastSection = null;

  let match = sectionRegex.exec(body);
  while (match !== null) {
    // Close previous section
    if (lastSection) {
      lastSection.rawHtml = body.substring(lastIndex, match.index).trim();
      sections.push(lastSection);
    }

    lastSection = {
      id: match[1],
      layout: match[2] || null,
    };
    lastIndex = match.index + match[0].length;
    match = sectionRegex.exec(body);
  }

  // Close final section
  if (lastSection) {
    lastSection.rawHtml = body.substring(lastIndex).trim();
    sections.push(lastSection);
  }

  // If no sections found, treat entire body as a single "default" section
  if (sections.length === 0 && body.trim()) {
    sections.push({
      id: 'default',
      layout: null,
      rawHtml: body.trim(),
    });
  }

  return { frontmatter, sections };
}

/**
 * Create a t() translation function.
 * Looks up key in i18nMap, falls back to the provided default.
 * @param {object} i18nMap - translation overrides { key: translated_string }
 * @returns {function(string, string): string}
 */
export function makeT(i18nMap = {}) {
  return (key, defaultValue) => {
    if (i18nMap[key] !== undefined) return i18nMap[key];
    return defaultValue ?? key;
  };
}

/**
 * Resolve a dotted path on an object (e.g., "api.modifiers.size.values").
 */
function resolvePath(obj, path) {
  return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
}

/**
 * Render a raw HTML section through Nunjucks with the provided context.
 * @param {string} rawHtml - raw HTML with Nunjucks template syntax
 * @param {object} context - { api, labels, t, ... }
 * @returns {string} rendered HTML
 */
export function renderHtmlSection(rawHtml, context = {}) {
  return nunjucksEnv.renderString(rawHtml, context);
}

/**
 * Auto-capitalize a section id to a title.
 * "icon_button" -> "Icon Button", "default" -> "Default"
 */
export function sectionIdToTitle(id) {
  return id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
