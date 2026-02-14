import { expect, test } from '@playwright/test';

// Needs docs server running at localhost:3000
test.skip(!!process.env.CI, 'Sidebar toggle test requires docs server');

test.describe('sidebar toggle buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear sessionStorage/localStorage to start fresh
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    await page.reload();
  });

  test('all buttons start with aria-pressed=false', async ({ page }) => {
    const buttons = page.locator('.ui-sidebar-nav__footer button[aria-pressed]');
    const count = await buttons.count();
    expect(count).toBe(5);
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  test('debug grid toggle adds class and sets aria-pressed', async ({ page }) => {
    const btn = page.locator('button', { hasText: 'Toggle Grid' }).first();
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    const hasClass = await page.evaluate(() => document.body.classList.contains('ui-debug-grid'));
    expect(hasClass).toBe(true);

    // Toggle off
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    const removed = await page.evaluate(() => !document.body.classList.contains('ui-debug-grid'));
    expect(removed).toBe(true);
  });

  test('debug grid overlay renders background-image', async ({ page }) => {
    const btn = page.locator('button', { hasText: 'Toggle Grid' }).first();
    await btn.click();

    const bg = await page.evaluate(() => {
      return window.getComputedStyle(document.body, '::after').backgroundImage;
    });
    expect(bg).not.toBe('none');
  });

  test('debug baseline toggle works', async ({ page }) => {
    const btn = page.locator('button', { hasText: 'Toggle Baseline' });
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    const hasClass = await page.evaluate(() =>
      document.body.classList.contains('ui-debug-baseline'),
    );
    expect(hasClass).toBe(true);
  });

  test('debug outline toggle adds outlines to children', async ({ page }) => {
    const btn = page.locator('button', { hasText: 'Toggle Outlines' });
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    const outlineStyle = await page.evaluate(() => {
      const el = document.querySelector('.ui-main');
      return el ? window.getComputedStyle(el).outlineStyle : '';
    });
    expect(outlineStyle).toBe('solid');
  });

  test('dark mode toggle sets data-theme and aria-pressed', async ({ page }) => {
    const btn = page.locator('#theme-toggle');
    await expect(btn).toHaveAttribute('aria-pressed', 'false');

    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(btn).toHaveText('Light Mode');
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await expect(btn).toHaveText('Dark Mode');
  });

  test('debug state persists across page loads', async ({ page }) => {
    // Enable grid
    const gridBtn = page.locator('button', { hasText: 'Toggle Grid' }).first();
    await gridBtn.click();
    await expect(gridBtn).toHaveAttribute('aria-pressed', 'true');

    // Reload page
    await page.reload();

    // Body should still have the class
    const hasClass = await page.evaluate(() => document.body.classList.contains('ui-debug-grid'));
    expect(hasClass).toBe(true);

    // Button should reflect the restored state
    const restoredBtn = page.locator('button', { hasText: 'Toggle Grid' }).first();
    await expect(restoredBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
