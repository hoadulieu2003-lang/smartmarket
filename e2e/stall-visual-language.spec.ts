import { expect, test } from '@playwright/test';

test.describe('Smartmarket stall visual language', () => {
  test('loads the current operations shell, opens stall A12, and switches fixtures', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'SMART MARKET' })).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByRole('button', { name: 'T1' })).toBeVisible();
    await expect(page.getByRole('button', { name: /3D Không Gian/i })).toBeVisible();

    const stallA12 = page.locator('#stall-stall_A12');
    await expect(stallA12).toBeVisible();
    await stallA12.click();

    const drawer = page.getByRole('dialog', { name: /SẠP A12/i });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('heading', { name: 'SẠP A12 — Thực phẩm tươi A12' })).toBeVisible();
    await expect(drawer.getByText('Lê Thu Hương').first()).toBeVisible();
    await expect(drawer.getByRole('button', { name: /Giao Xử Lý Ngay/i })).toBeVisible();
    await expect(drawer.getByRole('button', { name: /Xem phản ánh/i })).toBeVisible();

    await page.getByRole('button', { name: /Chợ Bến Thành chữ L/i }).click();
    await expect(page.locator('#stall-stall_L01')).toBeVisible();

    await page.getByRole('button', { name: /Chợ An Đông 2 Block/i }).click();
    await expect(page.locator('#stall-stall_W01')).toBeVisible();
  });

  test('keeps the operations shell usable on a narrow mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Tìm kiếm sạp/i })).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();

    const hasPageOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasPageOverflow).toBe(false);

    const stallA12 = page.locator('#stall-stall_A12');
    await expect(stallA12).toBeVisible();
    await stallA12.click();

    const drawer = page.getByRole('dialog', { name: /SẠP A12/i });
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveClass(/w-full/);
    await expect(drawer.getByRole('button', { name: /Đóng bảng chi tiết/i }).first()).toBeVisible();
  });
});
