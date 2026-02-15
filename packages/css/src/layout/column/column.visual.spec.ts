import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'column.docs.json');

test.describe('column visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await saveForLostPixel(page, 'column');
    await expect(page.locator('body')).toHaveScreenshot('column.visual.png');
  });
});
