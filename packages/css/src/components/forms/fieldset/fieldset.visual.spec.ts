import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../../testing';

const DOCS_PATH = resolve(__dirname, 'fieldset.docs.json');

test.describe('fieldset visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'fieldset');
    await saveForLostPixel(page, 'fieldset');
    await expect(page.locator('body')).toHaveScreenshot('fieldset.visual.png');
  });
});
