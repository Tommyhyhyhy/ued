import { test, expect } from '@playwright/test';
test('mobile PDF, metadata and dark mode stay usable at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/tai-lieu/bai-giang-nhap-mon-lap-trinh');
  await expect(page.locator('.react-pdf__Page canvas')).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('heading', { name: 'Thông tin học liệu' })).toBeVisible();
  await expect(page.locator('.download-panel dl')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.pdf-viewer').screenshot({ path: 'test-results/pdf-375.png' });
  await page.getByRole('button', { name: 'Bật giao diện tối' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.pdf-viewer').screenshot({ path: 'test-results/pdf-dark-375.png' });
  await page.getByRole('button', { name: 'Trang tiếp', exact: true }).click();
  await expect(page.locator('.pdf-toolbar')).toContainText('Trang 2 / 3');
});
