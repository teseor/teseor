import { expect, test } from '@playwright/test';

/**
 * Visual regression tests for button
 * Auto-generated from button.api.json
 */

test.describe('button visual regression', () => {
  test('all variations', async ({ page }) => {
    // Navigate to docs to get CSS loaded
    await page.goto('/v2/');

    // Build HTML for all variations in a grid
    const variations = [
      {
        name: 'default',
        classes: ['ui-button'],
        label: 'Default',
      },
      {
        name: 'sm',
        classes: ['ui-button', 'ui-button--sm'],
        label: 'sm',
      },
      {
        name: 'lg',
        classes: ['ui-button', 'ui-button--lg'],
        label: 'lg',
      },
      {
        name: 'secondary',
        classes: ['ui-button', 'ui-button--secondary'],
        label: 'secondary',
      },
      {
        name: 'ghost',
        classes: ['ui-button', 'ui-button--ghost'],
        label: 'ghost',
      },
      {
        name: 'danger',
        classes: ['ui-button', 'ui-button--danger'],
        label: 'danger',
      },
      {
        name: 'block',
        classes: ['ui-button', 'ui-button--block'],
        label: 'block',
      },
      {
        name: 'icon',
        classes: ['ui-button', 'ui-button--icon'],
        label: 'icon',
      },
      {
        name: 'disabled',
        classes: ['ui-button'],
        label: 'Disabled',
        disabled: true,
      },
    ];

    const html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 32px; padding: 48px; background: #fff;">
        ${variations
          .map(
            (v) => `
          <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px;">
            <span style="font-size: 12px; color: #666;">${v.label}</span>
            <button class="${v.classes.join(' ')}" ${v.disabled ? 'disabled' : ''}>${v.label}</button>
          </div>
        `,
          )
          .join('')}
      </div>
    `;

    // Replace page content but keep CSS
    await page.evaluate((content) => {
      document.body.innerHTML = content;
    }, html);

    // Screenshot the body
    const body = page.locator('body > div');
    await expect(body).toHaveScreenshot('button-all-variations.png');
  });
});
