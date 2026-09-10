import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LiveDashboardOverview from './LiveDashboardOverview';

describe('LiveDashboardOverview Command Center Integration', () => {
  it('renders all 4 core KPI blocks and operations hero action chips', () => {
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
      />
    );

    // 4 KPI Cards
    expect(screen.getByRole('button', { name: /Thẻ chỉ số sạp hàng/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Thẻ chỉ số tiểu thương/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Thẻ chỉ số phản ánh/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Thẻ chỉ số thu phí/i })).toBeDefined();
    expect(screen.getByText(/43 \/ 50/i)).toBeDefined();

    // Operations Hero Action Chips
    expect(screen.getByText(/3 Phản ánh khẩn cấp/i)).toBeDefined();
    expect(screen.getByText(/7 Vấn đề hạ tầng & 4 Trật tự/i)).toBeDefined();
    expect(screen.getByText(/4 Sạp đến hạn nộp phí/i)).toBeDefined();
  });

  it('renders pure SVG Donut chart and DetailStatCards in Stalls tab by default', () => {
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
      />
    );

    // Default tab is stalls
    expect(screen.getByText(/Quy Mô Sạp Hàng/i)).toBeDefined();
    expect(screen.getAllByText(/Tổng sạp/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Đã thuê/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Còn trống/i)).toBeDefined();
  });

  it('switches to Traders tab and displays trader Donut chart and stats', () => {
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
      />
    );

    const tradersCard = screen.getByRole('button', { name: /Thẻ chỉ số tiểu thương/i });
    fireEvent.click(tradersCard);

    expect(screen.getByText(/Danh Bạ .* Hộ Tiểu Thương Đang Kinh Doanh/i)).toBeDefined();
    expect(screen.getByText(/Hàng đợi phê duyệt: 7 hồ sơ/i)).toBeDefined();
    expect(screen.getAllByText(/Cố định \(có sạp\)/i).length).toBeGreaterThan(0);
  });

  it('switches to Complaints tab and displays SLA metrics with 3 operational tiers', () => {
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
      />
    );

    const complaintsCard = screen.getByRole('button', { name: /Thẻ chỉ số phản ánh/i });
    fireEvent.click(complaintsCard);

    expect(screen.getByText(/Hệ Thống 14 Sự Cố Phản Ánh PAKN/i)).toBeDefined();
    expect(screen.getAllByText(/Sắp đến hạn SLA/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Quá hạn SLA/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Gian Lận & An Toàn Thực Phẩm/i)).toBeDefined();
    expect(screen.getByText(/Trật Tự & Quy Chế Mặt Bằng/i)).toBeDefined();
    expect(screen.getByText(/Hạ Tầng & Vệ Sinh Môi Trường/i)).toBeDefined();
  });

  it('switches to Billing tab and displays fee metrics and management section', () => {
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
      />
    );

    const billingCard = screen.getByRole('button', { name: /Thẻ chỉ số thu phí/i });
    fireEvent.click(billingCard);

    // Fee metrics & BQL collection section
    expect(screen.getByText(/Tổng phải thu/i)).toBeDefined();
    expect(screen.getByText(/Đã thu thực tế/i)).toBeDefined();
    expect(screen.getByText(/Còn nợ đôn đốc/i)).toBeDefined();
    expect(screen.getByText(/Tỷ lệ thu nợ/i)).toBeDefined();
    expect(screen.getByText(/TÌNH HÌNH THU PHÍ QUẢN LÝ THỊ TRƯỜNG & DỊCH VỤ/i)).toBeDefined();
    expect(screen.getByText(/Danh Sách Sạp Cần Thu Phí & Xử Lý Công Nợ Thực Địa/i)).toBeDefined();
  });

  it('triggers onNavigateToMap when user clicks on map navigation CTA', () => {
    const onNavigateToMap = vi.fn();
    render(
      <LiveDashboardOverview
        onNavigateToMap={onNavigateToMap}
        onNavigateToProfiles={vi.fn()}
      />
    );

    const openMapBtn = screen.getByRole('button', { name: /Mở Sơ Đồ Không Gian Đầy Đủ/i });
    fireEvent.click(openMapBtn);

    expect(onNavigateToMap).toHaveBeenCalledTimes(1);
  });

  it('displays green dispatched badge when stall has been dispatched in complaints tab', () => {
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
        dispatchedStalls={{
          'D900-06': { teamName: 'Tổ An Ninh', status: 'in_progress' }
        }}
      />
    );

    const complaintsCard = screen.getByRole('button', { name: /Thẻ chỉ số phản ánh/i });
    fireEvent.click(complaintsCard);

    expect(screen.getByText(/Đã điều phối \(Tổ An Ninh\)/i)).toBeDefined();
  });

  it('passes stall code to onNavigateToMap when opening full map from Quick Map modal', () => {
    const onNavigateToMap = vi.fn();
    render(
      <LiveDashboardOverview
        onNavigateToMap={onNavigateToMap}
        onNavigateToProfiles={vi.fn()}
      />
    );

    // Switch to Complaints tab
    const complaintsCard = screen.getByRole('button', { name: /Thẻ chỉ số phản ánh/i });
    fireEvent.click(complaintsCard);

    // Click "Sơ đồ" button on first complaint
    const mapButtons = screen.getAllByRole('button', { name: /^Sơ đồ$/i });
    expect(mapButtons.length).toBeGreaterThan(0);
    fireEvent.click(mapButtons[0]);

    // Quick map modal should open
    expect(screen.getByText(/Vị Trí Sạp/i)).toBeDefined();

    // Click "Mở Sơ Đồ Tác Chiến Toàn Diện"
    const openFullMapBtn = screen.getByRole('button', { name: /Mở Sơ Đồ Tác Chiến Toàn Diện/i });
    fireEvent.click(openFullMapBtn);

    expect(onNavigateToMap).toHaveBeenCalledWith(expect.any(String));
  });

  it('allows resolving/closing a complaint from the complaint detail modal and updates UI state', () => {
    const onResolveComplaint = vi.fn();
    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
        onResolveComplaint={onResolveComplaint}
      />
    );

    // Switch to Complaints tab
    const complaintsCard = screen.getByRole('button', { name: /Thẻ chỉ số phản ánh/i });
    fireEvent.click(complaintsCard);

    // Click on the first complaint item to open detail modal
    const complaintCard = screen.getByRole('button', { name: /Chi tiết sự cố PAKN-2026-075/i });
    fireEvent.click(complaintCard);

    // Modal opens with "Đóng phản ánh" button
    const resolveBtn = screen.getByRole('button', { name: /Đóng phản ánh/i });
    expect(resolveBtn).toBeDefined();

    // Click to resolve
    fireEvent.click(resolveBtn);

    expect(onResolveComplaint).toHaveBeenCalledWith('PAKN-2026-075');
    expect(screen.getByText(/Đã nghiệm thu và đóng phản ánh PAKN-2026-075 thành công/i)).toBeDefined();
    expect(screen.getByText(/Hồ sơ đã đóng hoàn tất/i)).toBeDefined();

    // Close modal via header close button
    const closeBtn = screen.getByRole('button', { name: /Đóng chi tiết sự cố/i });
    fireEvent.click(closeBtn);

    // Now the complaint item is removed from the active open list
    expect(screen.queryByRole('button', { name: /Chi tiết sự cố PAKN-2026-075/i })).toBeNull();

    // Toggle to view resolved complaints and verify it displays "Đã xử lý dứt điểm"
    const toggleResolvedBtn = screen.getByRole('button', { name: /Ẩn vụ việc đã xử lý|Đang hiện cả vụ đã đóng/i });
    fireEvent.click(toggleResolvedBtn);
    expect(screen.getAllByText(/Đã xử lý dứt điểm/i).length).toBeGreaterThanOrEqual(1);
  });

  it('accurately filters stalls and zones strictly for the selected market without bleeding data', () => {
    const mockMarkets = [
      { id: 'm-vinh', name: 'Chợ Vinh', code: 'CHO-VINH' },
      { id: 'm-bm', name: 'Chợ Bình Minh', code: 'CHO-BM' }
    ];
    const mockStalls = [
      { id: 's-v1', marketId: 'm-vinh', code: 'VINH-01', name: 'Sạp Vinh Số 1', status: 'occupied', acreage: 10 },
      { id: 's-b1', marketId: 'm-bm', code: 'BM-01', name: 'Sạp Bình Minh 1', status: 'occupied', acreage: 12 }
    ];

    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
        selectedMarketId="m-vinh"
        markets={mockMarkets}
        stalls={mockStalls}
      />
    );

    // Banner should show Chợ Vinh
    expect(screen.getAllByText(/Chợ Vinh \(CHO-VINH\)/i).length).toBeGreaterThanOrEqual(1);
    // Stall VINH-01 must be present
    expect(screen.getByText('VINH-01')).toBeDefined();
    // Stall BM-01 from another market MUST NOT be present
    expect(screen.queryByText('BM-01')).toBeNull();
  });

  it('accurately filters complaints strictly for the selected market', () => {
    const mockMarkets = [
      { id: 'm-vinh', name: 'Chợ Vinh', code: 'CHO-VINH' },
      { id: 'm-bm', name: 'Chợ Bình Minh', code: 'CHO-BM' }
    ];
    const mockComplaints = [
      {
        id: 'c-v1',
        marketId: 'm-vinh',
        code: 'PAKN-VINH-001',
        title: 'Khiếu nại cân thiếu Chợ Vinh',
        content: 'Cân thiếu 200g',
        severityLevel: 'P0',
        type: 'weighing_fraud'
      },
      {
        id: 'c-b1',
        marketId: 'm-bm',
        code: 'PAKN-BM-001',
        title: 'Khiếu nại sạp Bình Minh',
        content: 'Lấn chiếm lối đi',
        severityLevel: 'P1',
        type: 'infrastructure'
      }
    ];

    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
        selectedMarketId="m-vinh"
        markets={mockMarkets}
        complaints={mockComplaints}
      />
    );

    const complaintsCard = screen.getByRole('button', { name: /Thẻ chỉ số phản ánh/i });
    fireEvent.click(complaintsCard);

    // Chợ Vinh complaint should be present
    expect(screen.getByText(/PAKN-VINH-001/i)).toBeDefined();
    // Chợ Bình Minh complaint MUST NOT be present
    expect(screen.queryByText(/PAKN-BM-001/i)).toBeNull();
  });

  it('classifies complaints semantically with distinct tags instead of defaulting to infrastructure', () => {
    const mockComplaints = [
      {
        id: 'c-food-1',
        code: 'PAKN-FOOD-01',
        content: 'hàng cũ quá',
        type: 'product_quality',
        stallId: 'A-01',
        reporter: { fullName: 'Trần Văn Nguyện' }
      },
      {
        id: 'c-price-1',
        code: 'PAKN-PRICE-01',
        content: 'Giá trên quầy cần được cập nhật rõ ràng',
        type: 'price_issue',
        stallId: 'K05-S01',
        reporter: { fullName: 'Hải Yến' }
      },
      {
        id: 'c-water-1',
        code: 'PAKN-WATER-01',
        content: 'Lối đi khu B bị đọng nước',
        type: 'infrastructure',
        stallId: 'Chung',
        reporter: { fullName: 'Người Mua' }
      }
    ];

    render(
      <LiveDashboardOverview
        onNavigateToMap={vi.fn()}
        onNavigateToProfiles={vi.fn()}
        complaints={mockComplaints}
      />
    );

    // Switch to complaints tab
    const complaintsCard = screen.getByRole('button', { name: /Thẻ chỉ số phản ánh/i });
    fireEvent.click(complaintsCard);

    // Check tags are differentiated
    expect(screen.getByText('Chất lượng hàng hóa')).toBeDefined();
    expect(screen.getByText('Niêm yết giá & Cân')).toBeDefined();
    expect(screen.getByText('Vệ sinh môi trường')).toBeDefined();

    // Check clean stall label for common area
    expect(screen.getByText('Khu B (Chung)')).toBeDefined();

    // Check pending count badge
    expect(screen.getAllByText(/vụ tồn đọng/i).length).toBeGreaterThan(0);
  });
});

