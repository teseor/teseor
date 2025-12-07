import type { ComponentAPI } from './api-types';

const PREFIX = 'ui-';

function generateCombinations(
  api: ComponentAPI,
): Array<{ modifiers: string[]; disabled?: boolean }> {
  if (api.combinations) return api.combinations;

  const enumModifiers = Object.entries(api.modifiers)
    .filter(([, def]) => def.values)
    .map(([, def]) => def.values!);

  if (enumModifiers.length < 2) return [];

  const [first, second] = enumModifiers;
  const combos: Array<{ modifiers: string[] }> = [];

  for (const a of first) {
    for (const b of second) {
      combos.push({ modifiers: [a, b] });
    }
  }

  return combos;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateVariationsHtml(api: ComponentAPI): string {
  const baseClass = `${PREFIX}${api.baseClass}`;
  const element = api.element;
  const title = capitalize(api.name);

  const sections: string[] = [];

  // Default section
  sections.push(`
    <div class="test-section">
      <div class="test-section-title">Default</div>
      <div class="test-row">
        <${element} class="${baseClass}">Default</${element}>
      </div>
    </div>
  `);

  // Generate sections for each modifier
  for (const [modName, modDef] of Object.entries(api.modifiers)) {
    const sectionTitle = capitalize(modName);

    if (modDef.values) {
      const buttons: string[] = [];

      if (modName === 'size') {
        buttons.push(`<${element} class="${baseClass}">Default</${element}>`);
      }
      if (modName === 'variant') {
        buttons.push(`<${element} class="${baseClass}">Primary</${element}>`);
      }

      for (const value of modDef.values) {
        const modClass = `${baseClass}--${value}`;
        const label = capitalize(value);
        buttons.push(`<${element} class="${baseClass} ${modClass}">${label}</${element}>`);
      }

      sections.push(`
    <div class="test-section">
      <div class="test-section-title">${sectionTitle}</div>
      <div class="test-row">
        ${buttons.join('\n        ')}
      </div>
    </div>
  `);
    } else if (modDef.type === 'boolean') {
      const modClass = `${baseClass}--${modName}`;
      const content = modName === 'icon' ? '+' : 'Full Width';
      const blockClass = modName === 'block' ? ' test-element--block' : '';

      sections.push(`
    <div class="test-section">
      <div class="test-section-title">${sectionTitle}</div>
      <div class="test-row">
        <div class="${blockClass.trim()}">
          <${element} class="${baseClass} ${modClass}">${content}</${element}>
        </div>
      </div>
    </div>
  `);
    }
  }

  // States section
  if (api.states && api.states.length > 0) {
    const stateButtons: string[] = [];
    stateButtons.push(`<${element} class="${baseClass}">Normal</${element}>`);

    if (api.states.includes('hover')) {
      stateButtons.push(`<${element} class="${baseClass} ${baseClass}--hover">Hover</${element}>`);
    }
    if (api.states.includes('focus')) {
      stateButtons.push(`<${element} class="${baseClass} ${baseClass}--focus">Focus</${element}>`);
    }
    if (api.states.includes('active')) {
      stateButtons.push(
        `<${element} class="${baseClass} ${baseClass}--active">Active</${element}>`,
      );
    }
    if (api.states.includes('disabled')) {
      stateButtons.push(`<${element} class="${baseClass}" disabled>Disabled</${element}>`);
    }

    sections.push(`
    <div class="test-section">
      <div class="test-section-title">States</div>
      <div class="test-row">
        ${stateButtons.join('\n        ')}
      </div>
    </div>
  `);
  }

  // Combinations section
  const combos = generateCombinations(api);
  if (combos.length > 0) {
    const comboButtons = combos.map((combo) => {
      const classes = combo.modifiers.map((m) => `${baseClass}--${m}`).join(' ');
      const label = combo.modifiers.map((m) => capitalize(m)).join(' ');
      const disabled = combo.disabled ? ' disabled' : '';
      return `<${element} class="${baseClass} ${classes}"${disabled}>${label}</${element}>`;
    });

    sections.push(`
    <div class="test-section">
      <div class="test-section-title">Combinations</div>
      <div class="test-grid">
        ${comboButtons.join('\n        ')}
      </div>
    </div>
  `);
  }

  return `
    <div class="test-container">
      <h1 class="test-title">${title}</h1>
      ${sections.join('')}
    </div>
  `;
}
