import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs } from '../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'grid.docs.json');

test.describe('grid visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await saveForLostPixel(page, 'grid');
    await expect(page.locator('body')).toHaveScreenshot('grid.visual.png');
  });
});
