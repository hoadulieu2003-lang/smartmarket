import { expect, test } from '@playwright/test';

test.describe('Live Synchronized Market Fixture & Separated View Routing', () => {
  test('switches to Live 50-stall fixture, inspects real PAKN complaint stall, and navigates separated views', async ({ page }) => {
    await page.goto('/');

    // 1. Verify app shell loads
    await expect(page.getByRole('heading', { name: 'SMART MARKET' })).toBeVisible();

    // 2. Select Live Fixture (Chợ Đồng Xuân Live 50 sạp)
    const liveFixtureBtn = page.getByRole('button', { name: /Đồng Xuân \(Live 50 sạp\)/i });
    await expect(liveFixtureBtn).toBeVisible();
    await liveFixtureBtn.click();

    // 3. Verify Live stall D900-06 is present and clickable
    const stallLive = page.locator('text=D900-06').first();
    await expect(stallLive).toBeVisible();
    await stallLive.click();

    // 4. Verify Stall Detail Drawer opens with live synced PAKN complaint
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('heading', { name: /SẠP D900-06 — Gian hàng gia vị/i })).toBeVisible();
    await expect(drawer.getByText(/Nhân viên phục vụ chưa hướng dẫn rõ cho khách/i)).toBeVisible();

    // Close drawer
    await page.keyboard.press('Escape');

    // 5. Test Separated View Routing: Switch to Overview
    const overviewNav = page.getByRole('button', { name: /Tổng quan/i });
    await expect(overviewNav).toBeVisible();
    await overviewNav.click();

    // Verify Overview dashboard content is rendered without map canvas
    await expect(page.getByText(/Tổng Quan Vận Hành — Chợ Đồng Xuân \(Demo Live\)/i)).toBeVisible();
    
    // Click vào Nghiệp vụ số 4 (Thẻ chỉ số thu phí) để mở phân hệ thu phí theo đúng chỉ đạo mới
    await page.getByRole('button', { name: /Thẻ chỉ số thu phí/i }).click();
    await expect(page.getByText(/TÌNH HÌNH THU PHÍ QUẢN LÝ THỊ TRƯỜNG/i)).toBeVisible();

    // 6. Switch back to Map View
    const stallsNav = page.getByRole('button', { name: 'Sơ đồ chợ 50 sạp' });
    await expect(stallsNav).toBeVisible();
    await stallsNav.click();

    // Verify map canvas returns
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
  });
});
