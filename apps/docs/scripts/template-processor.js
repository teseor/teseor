import nunjucks from 'nunjucks';

const env = new nunjucks.Environment(null, { autoescape: false });

/**
 * Process a template string with data
 * @param {string} template - Nunjucks template string
 * @param {object} data - Data to render
 * @returns {string} - Rendered output
 */
export function processTemplate(template, data = {}) {
  return env.renderString(template, data);
}
