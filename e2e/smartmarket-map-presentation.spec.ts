import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 900 },
  { name: 'desktop', width: 1280, height: 720 },
] as const;

async function expectNoPageOverflow(page: import('@playwright/test').Page) {
  await expect
    .poll(() =>
      page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= document.documentElement.clientWidth + 1)
    )
    .toBe(true);
}

test.describe('curated responsive market map', () => {
  for (const viewport of viewports) {
    test(`keeps the curated map readable and interactive on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      const mapCanvas = page.getByTestId('map-canvas');
      await expect(mapCanvas).toBeVisible();
      const mapBox = await mapCanvas.boundingBox();
      expect(mapBox).not.toBeNull();
      expect(mapBox!.height).toBeGreaterThanOrEqual(viewport.width < 640 ? 520 : 600);
      await expect(page.locator('#zone-zone_A')).toBeVisible();
      await expect(page.locator('#stall-stall_A12')).toBeVisible();

      await page.getByRole('button', { name: /Chợ Bến Thành chữ L/i }).click();
      await expect(page.locator('#stall-stall_L02_ROTATED')).toBeVisible();

      await page.getByRole('button', { name: /Chợ An Đông 2 Block/i }).click();
      await expect(page.locator('#aisle-aisle_bridge_skywalk')).toBeAttached();
      await expect(page.locator('#stall-stall_BR01')).toBeVisible();

      await expectNoPageOverflow(page);
    });
  }
});
