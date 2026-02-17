import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs } from '../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'center.docs.json');

test.describe('center visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await saveForLostPixel(page, 'center');
    await expect(page.locator('body')).toHaveScreenshot('center.visual.png');
  });
});
