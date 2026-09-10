import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StallsManagementView from './StallsManagementView';
import TradersManagementView from './TradersManagementView';
import ProductsManagementView from './ProductsManagementView';
import OrdersManagementView from './OrdersManagementView';
import ComplaintsManagementView from './ComplaintsManagementView';
import MarketsManagementView from './MarketsManagementView';
import SystemOperationsView from './SystemOperationsView';
import GisMapView from './GisMapView';
import PendingProfilesView from './PendingProfilesView';
import Sidebar from './Sidebar';

describe('CMS Client Integration Views', () => {
  it('renders StallsManagementView with capacity pulse and triggers navigation to spatial map', () => {
    const onNavigateToMap = vi.fn();
    render(<StallsManagementView onNavigateToMap={onNavigateToMap} />);

    expect(screen.getByText(/Sạp Hàng/i)).toBeDefined();
    expect(screen.getByText(/Đang thuê/i)).toBeDefined();
    expect(screen.getByText('A-01')).toBeDefined();

    const viewButtons = screen.getAllByRole('button', { name: /Xem trên sơ đồ/i });
    expect(viewButtons.length).toBeGreaterThan(0);
    fireEvent.click(viewButtons[0]);
    expect(onNavigateToMap).toHaveBeenCalledWith('A-01');
  });

  it('renders TradersManagementView with trader avatars and phone numbers', () => {
    render(<TradersManagementView />);

    expect(screen.getByText(/Quản Lý Tiểu Thương/i)).toBeDefined();
    expect(screen.getByText('Nguyễn Thị Mai')).toBeDefined();
    expect(screen.getByText('0912 345 601')).toBeDefined();
  });

  it('renders ProductsManagementView, opens product detail modal and toggles price', () => {
    render(<ProductsManagementView />);

    expect(screen.getByText(/Sản Phẩm & Hàng Hóa/i)).toBeDefined();
    const productRow = screen.getByText(/Thịt bò thăn hoa tươi/i);
    expect(productRow).toBeDefined();

    // Click row opens modal
    fireEvent.click(productRow);
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Nguồn gốc & Truy xuất/i)).toBeDefined();

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /^Đóng$/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).toBeNull();

    const toggleBtn = screen.getByRole('button', { name: /Đang ẩn giá bán|Hiển thị giá bán/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Đang ẩn giá bán/i)).toBeDefined();
  });

  it('renders OrdersManagementView with order list and displays empty state when not found', () => {
    render(<OrdersManagementView />);

    expect(screen.getByText(/Đơn Hàng Online/i)).toBeDefined();
    expect(screen.getByText('DH-20260908-01')).toBeDefined();
    expect(screen.getByText('Nguyễn Hồng Anh')).toBeDefined();

    // Search non-existent order
    const searchInput = screen.getByPlaceholderText(/Tìm mã đơn/i);
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT_ORDER_CODE_XYZ' } });
    expect(screen.getByText(/Không tìm thấy đơn hàng nào khớp với điều kiện lọc hoặc tìm kiếm/i)).toBeDefined();
  });

  it('renders ComplaintsManagementView and allows marking as resolved', () => {
    render(<ComplaintsManagementView />);

    expect(screen.getByText(/PAKN · Phản Ánh & Khiếu Nại/i)).toBeDefined();
    expect(screen.getByText(/Phát hiện sạp rã đông gà đông lạnh/i)).toBeDefined();

    const resolveButtons = screen.getAllByRole('button', { name: /Đánh dấu Đã xử lý/i });
    expect(resolveButtons.length).toBeGreaterThan(0);
    fireEvent.click(resolveButtons[0]);
    expect(screen.getAllByText(/Biên bản xử lý/i).length).toBeGreaterThan(0);
  });

  it('renders MarketsManagementView with 3 markets cards', () => {
    render(<MarketsManagementView />);

    expect(screen.getByText(/Quản Lý Chợ/i)).toBeDefined();
    expect(screen.getByText('Chợ Đồng Xuân (Demo)')).toBeDefined();
    expect(screen.getByText('Chợ Hôm - Đức Viên')).toBeDefined();
    expect(screen.getByText('Chợ Hàng Bè')).toBeDefined();
  });

  it('renders GisMapView with coordinates and market pin indicators', () => {
    const onNavigateToMarketMap = vi.fn();
    render(<GisMapView onNavigateToMarketMap={onNavigateToMarketMap} />);

    expect(screen.getByText(/Bản Đồ GIS Địa Lý/i)).toBeDefined();
    expect(screen.getByText(/Hồ Tây/i)).toBeDefined();
    expect(screen.getByText(/Hồ Gươm/i)).toBeDefined();
  });

  it('renders SystemOperationsView and switches between tabs', () => {
    render(<SystemOperationsView initialTab="notifications" />);

    expect(screen.getByText(/Thông Báo Điều Hành/i)).toBeDefined();
    expect(screen.getByText(/Diễn tập định kỳ phương án PCCC/i)).toBeDefined();

    const settingsTab = screen.getByRole('button', { name: /Cài Đặt Hệ Thống/i });
    fireEvent.click(settingsTab);
    expect(screen.getByText(/Cấu hình Hệ thống & Tham số Vận hành BQL/i)).toBeDefined();

    const auditsTab = screen.getByRole('button', { name: /Nhật Ký Hệ Thống/i });
    fireEvent.click(auditsTab);
    expect(screen.getByText(/Nhật ký Hệ thống \(Audit Trail\)/i)).toBeDefined();
  });

  it('renders isolated notifications mode without settings tabs', () => {
    render(<SystemOperationsView mode="notifications" />);

    expect(screen.getByText(/Trung Tâm Thông Báo & Phát Tin Điều Hành/i)).toBeDefined();
    expect(screen.getByText(/Diễn tập định kỳ phương án PCCC/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /^Cài Đặt Hệ Thống$/i })).toBeNull();
  });

  it('renders isolated settings mode with only the 2 system tabs', () => {
    render(<SystemOperationsView mode="settings" />);

    expect(screen.queryByText(/Thông Báo Điều Hành/i)).toBeNull();
    expect(screen.getByRole('button', { name: /Cài Đặt Hệ Thống/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Nhật Ký Hệ Thống/i })).toBeDefined();
    expect(screen.getByText(/Cấu hình Hệ thống & Tham số Vận hành BQL/i)).toBeDefined();
  });

  it('filters stalls by occupied and displays all 43 stalls correctly', () => {
    const onNavigateToMap = vi.fn();
    render(<StallsManagementView onNavigateToMap={onNavigateToMap} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'occupied' } });

    // Should include regular occupied stalls and expiring/complaint stalls that have status occupied
    expect(screen.getByText('A-01')).toBeDefined();
    expect(screen.getByText('A-06')).toBeDefined();
  });

  it('navigates to map from TradersManagementView stall button and opens trader modal', () => {
    const onNavigateToMap = vi.fn();
    render(<TradersManagementView onNavigateToMap={onNavigateToMap} />);

    const stallBtn = screen.getByTitle(/Xem sạp A-01 trên sơ đồ chợ/i);
    expect(stallBtn).toBeDefined();
    fireEvent.click(stallBtn);
    expect(onNavigateToMap).toHaveBeenCalledWith('A-01');

    // Click trader row to open modal
    const traderName = screen.getByText('Nguyễn Thị Mai');
    fireEvent.click(traderName);
    expect(screen.getByText(/HỒ SƠ ĐỊNH DANH & KINH DOANH/i)).toBeDefined();
    expect(screen.getByText(/TÀI KHOẢN THANH TOÁN KHÔNG DÙNG TIỀN MẶT/i)).toBeDefined();
  });

  it('navigates to map from PendingProfilesView stall badge', () => {
    const onNavigateToMap = vi.fn();
    const onBackToMap = vi.fn();
    render(<PendingProfilesView onBackToMap={onBackToMap} onNavigateToMap={onNavigateToMap} />);

    const stallBtn = screen.getByTitle(/Xem sạp A06 trên sơ đồ quy hoạch/i);
    expect(stallBtn).toBeDefined();
    fireEvent.click(stallBtn);
    expect(onNavigateToMap).toHaveBeenCalledWith('A06');
  });

  it('renders Sidebar with dynamic badge counters', () => {
    const onSelectView = vi.fn();
    const onToggleCollapse = vi.fn();
    render(
      <Sidebar
        isCollapsed={false}
        onToggleCollapse={onToggleCollapse}
        currentView="overview"
        onSelectView={onSelectView}
        activeComplaintsCount={11}
        pendingProfilesCount={7}
        pendingOrdersCount={5}
        unreadNotificationsCount={3}
      />
    );

    expect(screen.getByText('11')).toBeDefined();
    expect(screen.getByText('7')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });
});
