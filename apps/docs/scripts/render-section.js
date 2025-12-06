import { renderExample } from './render-example.js';

/**
 * Renders a Section to HTML string
 * @param {import('../src/types/docs-schema').Section} section
 * @returns {string}
 */
export function renderSection(section) {
  const { title, description, examples } = section;

  const parts = [];

  if (title) {
    parts.push(`<h3>${escapeHtml(title)}</h3>`);
  }

  if (description) {
    parts.push(`<p>${escapeHtml(description)}</p>`);
  }

  for (const example of examples) {
    parts.push(renderExample(example));
  }

  return parts.join('\n');
}

/**
 * Renders a full ComponentDoc to HTML string
 * @param {import('../src/types/docs-schema').ComponentDoc} doc
 * @returns {string}
 */
export function renderDoc(doc) {
  const { id, type, title, description, sections } = doc;

  const sectionHtml = sections.map(renderSection).join('\n\n');

  return `<section id="${escapeAttr(id)}" class="ui-docs-section" data-type="${type}">
  <h2>${escapeHtml(title)}</h2>
  <p>${escapeHtml(description)}</p>

  ${sectionHtml}
</section>`;
}

/**
 * Escape HTML
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Escape attribute value
 * @param {string} str
 * @returns {string}
 */
function escapeAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
