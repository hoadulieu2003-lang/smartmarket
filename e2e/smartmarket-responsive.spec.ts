import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 900 },
  { name: 'desktop', width: 1280, height: 720 },
] as const;

async function expectNoPageOverflow(page: import('@playwright/test').Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const documentWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const viewportWidth = document.documentElement.clientWidth;

        return Math.max(documentWidth, bodyWidth) <= viewportWidth + 1;
      })
    )
    .toBe(true);
}

test.describe('Smartmarket responsive drawer behavior', () => {
  for (const viewport of viewports) {
    test(`keeps the operations screen and stall drawer within the ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      await expect(page.getByTestId('map-toolbar')).toBeVisible();
      await expectNoPageOverflow(page);

      const stallA12 = page.locator('#stall-stall_A12');
      await expect(stallA12).toBeVisible();
      if (viewport.width < 640) {
        await expect
          .poll(async () => {
            const viewBox = await page.locator('#zone-zone_A').evaluate((node) => (node as SVGElement).ownerSVGElement?.getAttribute('viewBox') || '');
            return Number(viewBox.split(/\s+/)[2]);
          })
          .toBeLessThan(1000);
      }
      await stallA12.scrollIntoViewIfNeeded();
      await stallA12.click();

      const drawer = page.getByRole('dialog', { name: /SẠP A12/i });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole('button', { name: /Giao Xử Lý Ngay/i })).toBeVisible();

      const box = await drawer.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);

      if (viewport.width >= 640) {
        expect(box!.width).toBeLessThanOrEqual(420);
      }

      await expectNoPageOverflow(page);
      await page.keyboard.press('Escape');
      await expect(drawer).toBeHidden();
    });
  }
});
