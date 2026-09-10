import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProductsManagementView from './ProductsManagementView';
import OrdersManagementView from './OrdersManagementView';
import ComplaintsManagementView from './ComplaintsManagementView';

describe('Controlled Repairs Verification Suite (F-01, F-02, F-03)', () => {
  // F-01 Verification: Product Detail Modal & Empty State
  it('F-01: opens product detail modal on row click, displays metadata, closes on button and ESC, and shows empty state', () => {
    render(<ProductsManagementView />);

    // Check table loaded
    const productRow = screen.getByText(/Thịt bò thăn hoa tươi/i);
    expect(productRow).toBeDefined();

    // 1. Click row opens modal
    fireEvent.click(productRow);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(screen.getByText(/Nguồn gốc & Truy xuất/i)).toBeDefined();
    expect(screen.getAllByText(/Giá niêm yết/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Tồn kho khả dụng/i)).toBeDefined();
    expect(screen.getByText(/VietGAP \/ ATTP/i)).toBeDefined();

    // 2. Close via ESC
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    // 3. Re-open and close via Close button
    fireEvent.click(productRow);
    expect(screen.getByRole('dialog')).toBeDefined();
    const closeBtn = screen.getByRole('button', { name: /^Đóng$/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).toBeNull();

    // 4. Empty state verification
    const searchInput = screen.getByPlaceholderText(/Tìm sản phẩm \/ xuất xứ \/ sạp/i);
    fireEvent.change(searchInput, { target: { value: 'SAN_PHAM_KHONG_TON_TAI_999' } });
    expect(screen.getByText(/Không tìm thấy sản phẩm nào khớp với điều kiện tìm kiếm/i)).toBeDefined();
  });

  // F-02 Verification: Order Empty State
  it('F-02: displays friendly empty state table row when orders filter returns 0 results', () => {
    render(<OrdersManagementView />);

    // Initial table has orders
    expect(screen.getByText('DH-20260908-01')).toBeDefined();

    // Search unmatched string
    const searchInput = screen.getByPlaceholderText(/Tìm mã đơn/i);
    fireEvent.change(searchInput, { target: { value: 'MA_DON_HANG_VO_DANH_404' } });

    // Verify empty state is displayed
    expect(screen.getByText(/Không tìm thấy đơn hàng nào khớp với điều kiện lọc hoặc tìm kiếm/i)).toBeDefined();
  });

  // F-03 Verification: Complaints displaySource & market dependency update
  it('F-03: synchronizes normalized complaints when selectedMarketId changes', () => {
    const mockComplaints = [
      { id: 'c-1', code: 'PAKN-101', marketId: 'm-dongxuan', content: 'Sự cố chợ Đồng Xuân', status: 'new', severityLevel: 'P0', createdAt: '2026-09-09T08:00:00Z' },
      { id: 'c-2', code: 'PAKN-102', marketId: 'm-cho-hom', content: 'Sự cố chợ Hôm', status: 'new', severityLevel: 'P1', createdAt: '2026-09-09T08:00:00Z' }
    ];

    const { rerender } = render(
      <ComplaintsManagementView complaints={mockComplaints} selectedMarketId="m-dongxuan" />
    );

    // Initial render shows only Dong Xuan complaint
    expect(screen.getByText(/Sự cố chợ Đồng Xuân/i)).toBeDefined();
    expect(screen.queryByText(/Sự cố chợ Hôm/i)).toBeNull();

    // Update selectedMarketId to m-cho-hom
    rerender(
      <ComplaintsManagementView complaints={mockComplaints} selectedMarketId="m-cho-hom" />
    );

    // Now it should show Cho Hom complaint
    expect(screen.queryByText(/Sự cố chợ Đồng Xuân/i)).toBeNull();
    expect(screen.getByText(/Sự cố chợ Hôm/i)).toBeDefined();
  });
});
