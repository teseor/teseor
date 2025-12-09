---
to: packages/css/src/04-components/<%= name %>/<%= name %>.visual.spec.ts
---
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, '<%= name %>.docs.json');

test.describe('<%= name %> visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, '<%= name %>');
    await saveForLostPixel(page, '<%= name %>');
    await expect(page.locator('body')).toHaveScreenshot('<%= name %>.visual.png');
  });
});
