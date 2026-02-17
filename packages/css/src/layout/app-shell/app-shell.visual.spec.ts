import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs } from '../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'app-shell.docs.json');

test.describe('app-shell visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await saveForLostPixel(page, 'app-shell');
    await expect(page.locator('body')).toHaveScreenshot('app-shell.visual.png');
  });
});
